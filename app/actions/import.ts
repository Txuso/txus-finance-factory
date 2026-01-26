"use server"

import { parseBankStatement, ParsedTransaction } from "@/lib/parsers/pdf-parser";
import { revalidatePath } from "next/cache";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { cleanDescription } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export async function parseUpload(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autorizado" };
    }

    const file = formData.get("file") as File;

    if (!file) {
        return { error: "No se ha subido ningún archivo" };
    }

    if (file.type !== "application/pdf") {
        return { error: "El archivo debe ser un PDF" };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let allParsed = await parseBankStatement(buffer);

        if (allParsed.length === 0) {
            return { success: true, data: { transactions: [], duplicates: [] } };
        }

        // Deduplicate logic
        const dates = allParsed.map(t => new Date(t.fecha));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        const start = startOfMonth(minDate).toISOString();
        const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0).toISOString();

        // 2. Fetch existing transactions for those months
        const { data: existingTransactions } = await supabase
            .from('transacciones')
            .select('descripcion, fecha, monto, tipo')
            .eq('user_id', user.id)
            .gte('fecha', format(startOfMonth(minDate), 'yyyy-MM-dd'))
            .lte('fecha', format(new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0), 'yyyy-MM-dd'));

        // 3. Enhancement: Detect Fixed Expenses from definitions
        const [recurringResult, learningRulesResult] = await Promise.all([
            supabase
                .from('gastos_recurrentes')
                .select('*')
                .eq('user_id', user.id)
                .eq('activo', true),
            supabase
                .from('reglas_aprendizaje')
                .select('*')
                .eq('user_id', user.id)
        ]);

        const recurringList = recurringResult.data;
        const learningRules = learningRulesResult.data;

        const transactions: ParsedTransaction[] = [];
        const duplicates: ParsedTransaction[] = [];

        // Helper to check if two descriptions are "similar enough"
        const areSimilar = (d1: string, d2: string) => {
            const c1 = cleanDescription(d1);
            const c2 = cleanDescription(d2);
            if (!c1 || !c2) return false;
            if (c1 === c2) return true;
            // Partial match: one contains the other
            if (c1.length > 3 && c2.length > 3) {
                if (c1.includes(c2) || c2.includes(c1)) return true;
            }
            return false;
        };

        for (const t of allParsed) {
            let processed = t;
            const tDate = new Date(t.fecha);
            const tMonth = format(tDate, 'yyyy-MM');
            const tAbsAmount = Math.abs(t.monto);

            // 1. Identify if it matches any known recurring expense template
            const tClean = cleanDescription(processed.descripcion);
            const matchTemplate = recurringList?.find(r => {
                const rClean = cleanDescription(r.descripcion);
                return tClean === rClean || tClean.includes(rClean) || rClean.includes(tClean);
            });

            if (matchTemplate) {
                processed = {
                    ...t,
                    tipo: 'Gasto fijo' as const,
                    categoria: matchTemplate.categoria
                };
            } else {
                // 1.1 Check Learning Rules (Prioritize over static guess)
                const matchRule = learningRules?.find(rule =>
                    tClean.includes(rule.patron_descripcion) ||
                    rule.patron_descripcion.includes(tClean)
                );

                if (matchRule) {
                    processed = {
                        ...t,
                        tipo: matchRule.tipo_destino as any,
                        categoria: matchRule.categoria_destino as any
                    };
                }
            }

            // 2. Comprehensive Deduplication
            if (existingTransactions) {
                const isDuplicate = existingTransactions.some(existing => {
                    const existingDate = new Date(existing.fecha);
                    const existingMonth = format(existingDate, 'yyyy-MM');
                    const existAbsAmount = Math.abs(existing.monto);

                    // A. Exact Duplicate (Same Day, Same Description, Same Amount) -> Always skip
                    const isExact = format(existingDate, 'yyyy-MM-dd') === format(tDate, 'yyyy-MM-dd') &&
                        Math.abs(t.monto - existing.monto) < 0.01 &&
                        processed.descripcion.toUpperCase() === existing.descripcion.toUpperCase();
                    if (isExact) return true;

                    // B. Monthly Duplicate for Fixed/Recurring Transactions
                    // If they are in the same month and have the same amount
                    if (existingMonth === tMonth && Math.abs(tAbsAmount - existAbsAmount) < 0.01) {
                        // Check if they both relate to the same template or have same "base" name
                        const tClean = cleanDescription(processed.descripcion);
                        const existClean = cleanDescription(existing.descripcion);

                        const relatesByTemplate = matchTemplate &&
                            (existClean === cleanDescription(matchTemplate.descripcion) ||
                                existClean.includes(cleanDescription(matchTemplate.descripcion)));

                        if (relatesByTemplate) return true;
                        if (areSimilar(tClean, existClean)) return true;

                        // Specifically for fixed expenses, if current is fixed and existing is fixed, 
                        // and they have the same amount in the same month, it's likely a duplicate.
                        if (processed.tipo === 'Gasto fijo' && existing.tipo === 'Gasto fijo') return true;
                    }

                    return false;
                });

                if (isDuplicate) {
                    console.log(`[DEDUPE] Skipping ${processed.descripcion} (${tMonth}) - already exists.`);
                    duplicates.push(processed);
                    continue;
                }
            }

            transactions.push(processed);
        }

        return { success: true, data: { transactions, duplicates } };
    } catch (error) {
        console.error("Error parsing file:", error);
        return { error: "Error al procesar el archivo PDF" };
    }
}

export async function saveImportedTransactions(transactions: ParsedTransaction[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autorizado" };
    }

    // 1. Process templates first to have IDs for linking
    const fixedExpenses = transactions.filter(t => t.tipo === 'Gasto fijo');
    const templateMapping = new Map<string, string>(); // CleanedName -> TemplateID

    if (fixedExpenses.length > 0) {
        const { data: allTemplates } = await supabase
            .from('gastos_recurrentes')
            .select('*')
            .eq('user_id', user.id);

        const uniqueFixedToProcess = new Map<string, ParsedTransaction>();
        for (const fe of fixedExpenses) {
            const clean = cleanDescription(fe.descripcion);
            const existing = uniqueFixedToProcess.get(clean);
            if (!existing || new Date(fe.fecha) > new Date(existing.fecha)) {
                uniqueFixedToProcess.set(clean, fe);
            }
        }

        for (const [cleanName, fe] of uniqueFixedToProcess.entries()) {
            const matchingTemplates = (allTemplates || []).filter(r => {
                const rClean = cleanDescription(r.descripcion);
                return cleanName === rClean || cleanName.includes(rClean) || rClean.includes(cleanName);
            });

            let dbTemplate = matchingTemplates[0];

            if (matchingTemplates.length > 1) {
                const dupIds = matchingTemplates.slice(1).map(m => m.id);
                await supabase.from('gastos_recurrentes').delete().in('id', dupIds);
            }

            const recurringData = {
                user_id: user.id,
                descripcion: dbTemplate ? dbTemplate.descripcion : cleanName || fe.descripcion,
                monto_estimado: Math.abs(fe.monto),
                categoria: fe.categoria,
                meses_aplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                dia_cobro_estimado: new Date(fe.fecha).getDate(),
                activo: true,
                fecha_inicio: dbTemplate?.fecha_inicio || format(new Date(fe.fecha), 'yyyy-MM-01')
            };

            if (dbTemplate) {
                await supabase
                    .from('gastos_recurrentes')
                    .update(recurringData)
                    .eq('id', dbTemplate.id)
                    .eq('user_id', user.id);
            } else {
                const { data: newT } = await supabase
                    .from('gastos_recurrentes')
                    .insert([recurringData])
                    .select()
                    .single();
                dbTemplate = newT as any;
            }

            if (dbTemplate) {
                templateMapping.set(cleanName, dbTemplate.id);
            }
        }
    }

    // 2. Prepare and Insert Transactions with IDs
    const dbTransactions = transactions.map(t => {
        const clean = t.tipo === 'Gasto fijo' ? cleanDescription(t.descripcion) : null;
        let recurring_id = null;

        if (clean) {
            recurring_id = templateMapping.get(clean) || null;
        }

        return {
            user_id: user.id,
            descripcion: t.descripcion,
            monto: t.monto,
            categoria: t.categoria,
            tipo: t.tipo,
            metodo_pago: 'Tarjeta' as const,
            es_automatico: false,
            fecha: new Date(t.fecha).toISOString(),
            recurring_id
        }
    });

    const { error: insertError } = await supabase
        .from('transacciones')
        .insert(dbTransactions);

    if (insertError) {
        console.error("Bulk Insert Error:", insertError);
        return { error: "Error al guardar las transacciones" };
    }

    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    return { success: true };
}
