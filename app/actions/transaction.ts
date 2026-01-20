"use server"

// Using the singleton supabase client for now


import { supabase } from "@/lib/supabase/client"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transaction"
import { revalidatePath } from "next/cache"
import { format, startOfMonth } from "date-fns"
import { redirect } from "next/navigation"

export async function createTransaction(data: TransactionFormValues) {
    const validatedFields = transactionSchema.safeParse(data)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    // If it's a "Gasto fijo", we also want to ensure it exists in gastos_recurrentes
    if (validatedFields.data.tipo === 'Gasto fijo') {
        // We create or update the recurring definition
        const { meses_aplicacion, ...baseData } = validatedFields.data;

        // 1. Check if it already exists in recurrentes (by description match)
        const { data: existing } = await supabase
            .from("gastos_recurrentes")
            .select("id")
            .eq("descripcion", baseData.descripcion)
            .maybeSingle();

        if (existing) {
            await supabase
                .from("gastos_recurrentes")
                .update({
                    monto_estimado: Math.abs(baseData.monto),
                    categoria: baseData.categoria,
                    meses_aplicacion: meses_aplicacion,
                    dia_cobro_estimado: new Date(baseData.fecha).getDate()
                })
                .eq("id", existing.id);
        } else {
            await supabase
                .from("gastos_recurrentes")
                .insert([{
                    descripcion: baseData.descripcion,
                    monto_estimado: Math.abs(baseData.monto),
                    categoria: baseData.categoria,
                    meses_aplicacion: meses_aplicacion,
                    dia_cobro_estimado: new Date(baseData.fecha).getDate(),
                    activo: true
                }]);
        }
    }

    const { meses_aplicacion, ...transactionData } = validatedFields.data;

    const { error } = await supabase
        .from("transacciones")
        .insert([
            {
                ...transactionData,
                fecha: transactionData.fecha.toISOString(), // Convert Date to string for DB
            },
        ])

    if (error) {
        console.error("Error creating transaction:", error)
        return { error: "Error al guardar la transacción" }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
}

export async function updateTransaction(id: string, data: TransactionFormValues) {
    const validatedFields = transactionSchema.safeParse(data)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    // If it's a "Gasto fijo", sync with gastos_recurrentes
    if (validatedFields.data.tipo === 'Gasto fijo') {
        const { meses_aplicacion, ...baseData } = validatedFields.data;

        const { data: existing } = await supabase
            .from("gastos_recurrentes")
            .select("id")
            .eq("descripcion", baseData.descripcion)
            .maybeSingle();

        if (existing) {
            await supabase
                .from("gastos_recurrentes")
                .update({
                    monto_estimado: Math.abs(baseData.monto),
                    categoria: baseData.categoria,
                    meses_aplicacion: meses_aplicacion,
                    dia_cobro_estimado: new Date(baseData.fecha).getDate()
                })
                .eq("id", existing.id);
        }
    }

    const { meses_aplicacion, ...transactionData } = validatedFields.data;

    const { error } = await supabase
        .from("transacciones")
        .update({
            ...transactionData,
            fecha: transactionData.fecha.toISOString(),
        })
        .eq("id", id)

    if (error) {
        console.error("Error updating transaction:", error)
        return { error: "Error al actualizar la transacción" }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
}

export async function deleteTransaction(id: string) {
    const { error } = await supabase
        .from("transacciones")
        .delete()
        .eq("id", id)

    if (error) {
        console.error("Error deleting transaction:", error)
        return { error: "Error al eliminar la transacción" }
    }

    revalidatePath("/transactions")
    return { success: true }
}

export async function deleteAllTransactions() {
    const { error } = await supabase
        .from("transacciones")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
        console.error("Error deleting all transactions:", error)
        return { error: "Error al eliminar las transacciones" }
    }

    revalidatePath("/dashboard")
    return { success: true }
}

export async function excludeRecurringExpense(recurringId: string, monthDate: Date) {
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');

    const { error } = await supabase
        .from("exclusiones_fijos")
        .insert([{ gasto_recurrente_id: recurringId, mes: start }]);

    if (error) {
        console.error("Error excluding expense:", error);
        return { error: "Error al excluir el gasto" };
    }

    revalidatePath("/dashboard");
    return { success: true };
}
