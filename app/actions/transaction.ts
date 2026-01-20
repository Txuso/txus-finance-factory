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
