"use server"

import { parseBankStatement, ParsedTransaction } from "@/lib/parsers/pdf-parser";
import { revalidatePath } from "next/cache";
import { startOfMonth } from "date-fns";

export async function parseUpload(formData: FormData) {
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
        // 1. Get range of months from the parsed PDF
        const dates = allParsed.map(t => new Date(t.fecha));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

        // Start of month for the range
        const start = startOfMonth(minDate).toISOString();
        const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0).toISOString();

        // 2. Fetch existing transactions for those months
        const { data: existingTransactions } = await supabase
            .from('transacciones')
            .select('descripcion, fecha, monto, tipo')
            .gte('fecha', start)
            .lte('fecha', end);

        // 3. Enhancement: Detect Fixed Expenses from definitions
        const { data: recurringList } = await supabase
            .from('gastos_recurrentes')
            .select('*')
            .eq('activo', true);

        const transactions: ParsedTransaction[] = [];
        const duplicates: ParsedTransaction[] = [];

        for (const t of allParsed) {
            let processed = t;

            // Apply templates if matches
            if (recurringList && recurringList.length > 0) {
                const matchTemplate = recurringList.find(r =>
                    t.descripcion.toUpperCase().includes(r.descripcion.toUpperCase())
                );

                if (matchTemplate) {
                    processed = {
                        ...t,
                        tipo: 'Gasto fijo' as const,
                        categoria: matchTemplate.categoria
                    };
                }
            }

            // DUPLICATE CHECK (Only for Fixed Expenses as requested)
            if (processed.tipo === 'Gasto fijo' && existingTransactions) {
                const isDuplicate = existingTransactions.some(existing => {
                    // Normalize descriptions for comparison
                    const descNorm = processed.descripcion.toUpperCase();
                    const existNorm = existing.descripcion.toUpperCase();

                    // Same month and similar description
                    const sameMonth = startOfMonth(new Date(processed.fecha)).getTime() === startOfMonth(new Date(existing.fecha)).getTime();

                    // Check if one contains the other (simple similarity)
                    const similarDesc = descNorm.includes(existNorm) || existNorm.includes(descNorm);

                    return sameMonth && similarDesc;
                });

                if (isDuplicate) {
                    duplicates.push(processed);
                    continue; // Skip adding to main list
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

// Bulk insert action
import { supabase } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export async function saveImportedTransactions(transactions: ParsedTransaction[]) {
    // 1. Transform formatting for DB
    const dbTransactions = transactions.map(t => ({
        descripcion: t.descripcion,
        monto: t.monto,
        categoria: t.categoria,
        tipo: t.tipo,
        metodo_pago: 'Tarjeta' as const, // Default for Bank Import
        es_automatico: false,
        fecha: new Date(t.fecha).toISOString()
    }));

    // 2. Insert transactions
    const { error: insertError } = await supabase
        .from('transacciones')
        .insert(dbTransactions);

    if (insertError) {
        console.error("Bulk Insert Error:", insertError);
        return { error: "Error al guardar las transacciones" };
    }

    // 3. Sync Fixed Expenses with gastos_recurrentes
    const fixedExpenses = transactions.filter(t => t.tipo === 'Gasto fijo');

    for (const fe of fixedExpenses) {
        // Check if recurring already exists
        const { data: existing } = await supabase
            .from('gastos_recurrentes')
            .select('id')
            .eq('descripcion', fe.descripcion)
            .maybeSingle();

        const recurringData = {
            descripcion: fe.descripcion,
            monto_estimado: Math.abs(fe.monto),
            categoria: fe.categoria,
            meses_aplicacion: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Default for imported
            dia_cobro_estimado: new Date(fe.fecha).getDate(),
            activo: true
        };

        if (existing) {
            await supabase
                .from('gastos_recurrentes')
                .update(recurringData)
                .eq('id', existing.id);
        } else {
            await supabase
                .from('gastos_recurrentes')
                .insert([recurringData]);
        }
    }

    revalidatePath('/dashboard');
    revalidatePath('/transactions');
    return { success: true };
}
