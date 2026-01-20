"use server"

import { parseBankStatement } from "@/lib/parsers/pdf-parser";
import { revalidatePath } from "next/cache";

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

        let transactions = await parseBankStatement(buffer);

        // ENHANCEMENT: Detect Fixed Expenses
        const { data: recurringList } = await supabase
            .from('gastos_recurrentes')
            .select('*')
            .eq('activo', true);

        if (recurringList && recurringList.length > 0) {
            transactions = transactions.map(t => {
                const match = recurringList.find(r =>
                    t.descripcion.toUpperCase().includes(r.descripcion.toUpperCase())
                );

                if (match) {
                    return {
                        ...t,
                        tipo: 'Gasto fijo' as const,
                        categoria: match.categoria
                    };
                }
                return t;
            });
        }

        return { success: true, data: transactions };
    } catch (error) {
        console.error("Error parsing file:", error);
        return { error: "Error al procesar el archivo PDF" };
    }
}

// Bulk insert action
import { supabase } from "@/lib/supabase/client";
import { ParsedTransaction } from "@/lib/parsers/pdf-parser";
import { redirect } from "next/navigation";

export async function saveImportedTransactions(transactions: ParsedTransaction[]) {
    // Transform formatting for DB
    const dbTransactions = transactions.map(t => ({
        descripcion: t.descripcion,
        monto: t.monto,
        categoria: t.categoria,
        tipo: t.tipo,
        metodo_pago: 'Tarjeta', // Default for Bank Import
        es_automatico: false,
        fecha: new Date(t.fecha).toISOString()
    }));

    const { error } = await supabase
        .from('transacciones')
        .insert(dbTransactions);

    if (error) {
        console.error("Bulk Insert Error:", error);
        return { error: "Error al guardar las transacciones" };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
