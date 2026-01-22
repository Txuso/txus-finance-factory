"use server"

import { createClient } from "@/lib/supabase/server"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transaction"
import { revalidatePath } from "next/cache"
import { format, startOfMonth } from "date-fns"

export async function createTransaction(data: TransactionFormValues) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autorizado" }
    }

    const validatedFields = transactionSchema.safeParse(data)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    // If it's a "Gasto fijo", we also want to ensure it exists in gastos_recurrentes
    if (validatedFields.data.tipo === 'Gasto fijo') {
        const { meses_aplicacion, fecha_inicio, fecha_fin, ...baseData } = validatedFields.data;

        // 1. Check if it already exists in recurrentes (by description match)
        const { data: existing } = await supabase
            .from("gastos_recurrentes")
            .select("id")
            .eq("user_id", user.id)
            .eq("descripcion", baseData.descripcion)
            .maybeSingle();

        if (existing) {
            const updateData: any = {
                monto_estimado: Math.abs(baseData.monto),
                categoria: baseData.categoria,
                dia_cobro_estimado: new Date(baseData.fecha).getDate()
            };

            // Only update start date if provided or if it helps consistency
            if (fecha_inicio) {
                updateData.fecha_inicio = format(fecha_inicio, 'yyyy-MM-dd');
            }

            // Handle end date (could be null)
            updateData.fecha_fin = fecha_fin ? format(fecha_fin, 'yyyy-MM-dd') : null;

            await supabase
                .from("gastos_recurrentes")
                .update(updateData)
                .eq("id", existing.id)
                .eq("user_id", user.id);
        } else {
            await supabase
                .from("gastos_recurrentes")
                .insert([{
                    user_id: user.id,
                    descripcion: baseData.descripcion,
                    monto_estimado: Math.abs(baseData.monto),
                    categoria: baseData.categoria,
                    dia_cobro_estimado: new Date(baseData.fecha).getDate(),
                    fecha_inicio: format(fecha_inicio || startOfMonth(new Date(baseData.fecha)), 'yyyy-MM-dd'),
                    fecha_fin: fecha_fin ? format(fecha_fin, 'yyyy-MM-dd') : null,
                    activo: true
                }]);
        }
    }

    const { meses_aplicacion, fecha_inicio, fecha_fin, ...transactionData } = validatedFields.data;

    const { error } = await supabase
        .from("transacciones")
        .insert([
            {
                ...transactionData,
                user_id: user.id,
                fecha: transactionData.fecha.toISOString(),
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autorizado" }
    }

    const validatedFields = transactionSchema.safeParse(data)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    // If it's a "Gasto fijo", sync with gastos_recurrentes
    if (validatedFields.data.tipo === 'Gasto fijo') {
        const { meses_aplicacion, fecha_inicio, fecha_fin, ...baseData } = validatedFields.data;

        const { data: existing } = await supabase
            .from("gastos_recurrentes")
            .select("id")
            .eq("user_id", user.id)
            .eq("descripcion", baseData.descripcion)
            .maybeSingle();

        if (existing) {
            await supabase
                .from("gastos_recurrentes")
                .update({
                    monto_estimado: Math.abs(baseData.monto),
                    categoria: baseData.categoria,
                    dia_cobro_estimado: new Date(baseData.fecha).getDate(),
                    fecha_inicio: fecha_inicio ? format(fecha_inicio, 'yyyy-MM-dd') : undefined,
                    fecha_fin: fecha_fin ? format(fecha_fin, 'yyyy-MM-dd') : null,
                })
                .eq("id", existing.id)
                .eq("user_id", user.id);
        }
    }

    const { meses_aplicacion, fecha_inicio, fecha_fin, ...transactionData } = validatedFields.data;

    const { error } = await supabase
        .from("transacciones")
        .update({
            ...transactionData,
            fecha: transactionData.fecha.toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error updating transaction:", error)
        return { error: "Error al actualizar la transacción" }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
}

export async function deleteTransaction(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "No autorizado" }

    const { error } = await supabase
        .from("transacciones")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error deleting transaction:", error)
        return { error: "Error al eliminar la transacción" }
    }

    revalidatePath("/transactions")
    return { success: true }
}

export async function deleteAllTransactions() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "No autorizado" }

    const { error } = await supabase
        .from("transacciones")
        .delete()
        .eq("user_id", user.id)
        .neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
        console.error("Error deleting all transactions:", error)
        return { error: "Error al eliminar las transacciones" }
    }

    revalidatePath("/dashboard")
    revalidatePath("/transactions")
    return { success: true }
}

export async function deleteAllRecurringExpenses() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "No autorizado" }

    const { error } = await supabase
        .from("gastos_recurrentes")
        .delete()
        .eq("user_id", user.id)
        .neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
        console.error("Error deleting all recurring expenses:", error)
        return { error: "Error al eliminar los gastos recurrentes" }
    }

    revalidatePath("/dashboard")
    return { success: true }
}

export async function excludeRecurringExpense(recurringId: string, monthDate: Date) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "No autorizado" }

    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd');

    const { error } = await supabase
        .from("exclusiones_fijos")
        .insert([{
            user_id: user.id,
            gasto_recurrente_id: recurringId,
            mes: start
        }]);

    if (error) {
        console.error("Error excluding expense:", error);
        return { error: "Error al excluir el gasto" };
    }

    revalidatePath("/dashboard");
    return { success: true };
}
