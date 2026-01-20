"use server"

// Using the singleton supabase client for now


import { supabase } from "@/lib/supabase/client"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transaction"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTransaction(data: TransactionFormValues) {
    const validatedFields = transactionSchema.safeParse(data)

    if (!validatedFields.success) {
        return { error: "Datos inválidos" }
    }

    const { error } = await supabase
        .from("transacciones")
        .insert([
            {
                ...validatedFields.data,
                fecha: validatedFields.data.fecha.toISOString(), // Convert Date to string for DB
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

    const { error } = await supabase
        .from("transacciones")
        .update({
            ...validatedFields.data,
            fecha: validatedFields.data.fecha.toISOString(),
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
