"use server"

import { parseBankStatement, ParsedTransaction } from "@/lib/parsers/pdf-parser";
import { revalidatePath } from "next/cache";
import { startOfMonth, format } from "date-fns";
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
        const { data: recurringList } = await supabase
            .from('gastos_recurrentes')
            .select('*')
            .eq('user_id', user.id)
            .eq('activo', true);

        const transactions: ParsedTransaction[] = [];
        const duplicates: ParsedTransaction[] = [];

        // Helper to remove dates and numbers that look like dates from strings
        const cleanDescription = (desc: string) => {
            return desc
                .replace(/\d{2}[/.-]\d{2}[/.-]\d{2,4}/g, '') // Dates like 17/12/2025
                .replace(/\b\d{2}[/.-]\d{2}\b/g, '')         // Dates like 17/12
                .replace(/\s+/g, ' ')                        // Normalizar espacios
                .trim()
                .toUpperCase();
        };

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

    const dbTransactions = transactions.map(t => ({
        user_id: user.id,
        descripcion: t.descripcion,
        monto: t.monto,
        categoria: t.categoria,
        tipo: t.tipo,
        metodo_pago: 'Tarjeta' as const,
        es_automatico: false,
        fecha: new Date(t.fecha).toISOString()
    }));

    const { error: insertError } = await supabase
        .from('transacciones')
        .insert(dbTransactions);

    if (insertError) {
        console.error("Bulk Insert Error:", insertError);
        return { error: "Error al guardar las transacciones" };
    }

    const fixedExpenses = transactions.filter(t => t.tipo === 'Gasto fijo');

    if (fixedExpenses.length > 0) {
        // Fetch current templates
        const { data: allTemplates } = await supabase
            .from('gastos_recurrentes')
            .select('*')
            .eq('user_id', user.id);

        const cleanDescription = (desc: string) => {
            return desc
                .replace(/\d{2}[/.-]\d{2}[/.-]\d{2,4}/g, '')
                .replace(/\b\d{2}[/.-]\d{2}\b/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase();
        };

        for (const fe of fixedExpenses) {
            const feClean = cleanDescription(fe.descripcion);

            // Find existing
            const existing = allTemplates?.find(r => {
                const rClean = cleanDescription(r.descripcion);
                return feClean === rClean || feClean.includes(rClean) || rClean.includes(feClean);
            });

            const recurringData = {
                user_id: user.id,
                // USE CLEAN NAME for the template to avoid "Master 12/2025"
                descripcion: existing ? existing.descripcion : feClean || fe.descripcion,
                monto_estimado: Math.abs(fe.monto),
                categoria: fe.categoria,
                meses_aplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                dia_cobro_estimado: new Date(fe.fecha).getDate(),
                activo: true
            };

            if (existing) {
                await supabase
                    .from('gastos_recurrentes')
                    .update(recurringData)
                    .eq('id', existing.id)
                    .eq('user_id', user.id);
            } else {
                await supabase
                    .from('gastos_recurrentes')
                    .insert([recurringData]);
            }
        }
    }

    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    return { success: true };
}
