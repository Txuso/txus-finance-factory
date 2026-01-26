"use server"

import { createClient } from "@/lib/supabase/server"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transaction"
import { revalidatePath } from "next/cache"
import { format, startOfMonth } from "date-fns"
import { cleanDescription as cleanDesc } from "@/lib/utils"

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

    let finalRecurringId = data.recurring_id;

    // If it's a "Gasto fijo", we also want to ensure it exists in gastos_recurrentes
    if (validatedFields.data.tipo === 'Gasto fijo') {
        const { meses_aplicacion, fecha_inicio, fecha_fin, recurring_id, ...baseData } = validatedFields.data;

        let templateToUpdate = null;

        if (recurring_id) {
            const { data } = await supabase.from("gastos_recurrentes").select("*").eq("id", recurring_id).eq("user_id", user.id).single();
            templateToUpdate = data;
        } else {
            const { data } = await supabase.from("gastos_recurrentes").select("*").eq("user_id", user.id).eq("descripcion", baseData.descripcion).maybeSingle();
            templateToUpdate = data;
        }

        if (templateToUpdate) {
            finalRecurringId = templateToUpdate.id;
            const oldName = templateToUpdate.descripcion;
            const newName = baseData.descripcion;
            const oldClean = cleanDesc(oldName);

            // 1. Update the template
            const updateData: any = {
                descripcion: newName,
                monto_estimado: Math.abs(baseData.monto),
                categoria: baseData.categoria,
                dia_cobro_estimado: new Date(baseData.fecha).getDate()
            };

            if (fecha_inicio) updateData.fecha_inicio = format(fecha_inicio, 'yyyy-MM-dd');
            updateData.fecha_fin = fecha_fin ? format(fecha_fin, 'yyyy-MM-dd') : null;

            await supabase.from("gastos_recurrentes").update(updateData).eq("id", templateToUpdate.id).eq("user_id", user.id);

            // 2. Global Rename & Link: Update ALL historical transactions that match
            const { data: allFixed } = await supabase
                .from("transacciones")
                .select("*")
                .eq("user_id", user.id)
                .eq("tipo", "Gasto fijo");

            if (allFixed) {
                const toUpdate = allFixed.filter(t => {
                    if (t.recurring_id === templateToUpdate.id) return true;
                    const tClean = cleanDesc(t.descripcion);
                    return tClean === oldClean || tClean.includes(oldClean) || oldClean.includes(tClean);
                });

                if (toUpdate.length > 0) {
                    const ids = toUpdate.map(t => t.id);
                    await supabase
                        .from("transacciones")
                        .update({
                            descripcion: newName,
                            recurring_id: templateToUpdate.id
                        })
                        .in("id", ids);
                }
            }
        } else {
            // New template
            const { data: newTemplate } = await supabase
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
                }])
                .select()
                .single();

            if (newTemplate) finalRecurringId = newTemplate.id;
        }
    }

    const { meses_aplicacion, fecha_inicio, fecha_fin, recurring_id, ...transactionData } = validatedFields.data;

    const { error } = await supabase
        .from("transacciones")
        .insert([
            {
                ...transactionData,
                user_id: user.id,
                fecha: transactionData.fecha.toISOString(),
                recurring_id: finalRecurringId
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

    let finalRecurringId = data.recurring_id;

    // If it's a "Gasto fijo", sync with gastos_recurrentes
    if (validatedFields.data.tipo === 'Gasto fijo') {
        const { meses_aplicacion, fecha_inicio, fecha_fin, recurring_id, ...baseData } = validatedFields.data;

        let templateToUpdate = null;

        if (recurring_id) {
            const { data } = await supabase.from("gastos_recurrentes").select("*").eq("id", recurring_id).eq("user_id", user.id).single();
            templateToUpdate = data;
        } else {
            const { data } = await supabase.from("gastos_recurrentes").select("*").eq("user_id", user.id).eq("descripcion", baseData.descripcion).maybeSingle();
            templateToUpdate = data;
        }

        if (templateToUpdate) {
            finalRecurringId = templateToUpdate.id;
            const oldName = templateToUpdate.descripcion;
            const newName = baseData.descripcion;
            const oldClean = cleanDesc(oldName);

            // Update template
            await supabase
                .from("gastos_recurrentes")
                .update({
                    descripcion: newName,
                    monto_estimado: Math.abs(baseData.monto),
                    categoria: baseData.categoria,
                    dia_cobro_estimado: new Date(baseData.fecha).getDate(),
                    fecha_inicio: fecha_inicio ? format(fecha_inicio, 'yyyy-MM-dd') : undefined,
                    fecha_fin: fecha_fin ? format(fecha_fin, 'yyyy-MM-dd') : null,
                })
                .eq("id", templateToUpdate.id)
                .eq("user_id", user.id);

            // Global Rename and Link: Update ALL historical transactions that match the template
            // We fetch them all to apply the cleanDescription logic
            const { data: allFixed } = await supabase
                .from("transacciones")
                .select("*")
                .eq("user_id", user.id)
                .eq("tipo", "Gasto fijo");

            if (allFixed) {
                const toUpdate = allFixed.filter(t => {
                    // Already linked?
                    if (t.recurring_id === templateToUpdate.id) return true;
                    // Fuzzy match with old name?
                    const tClean = cleanDesc(t.descripcion);
                    return tClean === oldClean || tClean.includes(oldClean) || oldClean.includes(tClean);
                });

                if (toUpdate.length > 0) {
                    const ids = toUpdate.map(t => t.id);
                    await supabase
                        .from("transacciones")
                        .update({
                            descripcion: newName,
                            recurring_id: templateToUpdate.id
                        })
                        .in("id", ids);
                }
            }
        }
    }

    const { meses_aplicacion, fecha_inicio, fecha_fin, recurring_id, ...transactionData } = validatedFields.data;

    const { error } = await supabase
        .from("transacciones")
        .update({
            ...transactionData,
            fecha: transactionData.fecha.toISOString(),
            recurring_id: finalRecurringId
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

export async function searchTransactions(query: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "No autorizado" }

    const search = query.trim();
    if (search.length < 2) return { data: [] }

    // Postgrest syntax: column.cast(type).operator.value
    // We use % for wildcards and double quotes for the search term to handle spaces
    const term = `%${search}%`;
    let orParts = [
        `descripcion.ilike."${term}"`,
        `categoria.cast(text).ilike."${term}"`
    ];

    // Check if it's a valid number for amount search
    const isNumeric = !isNaN(Number(search.replace(',', '.')));
    if (isNumeric) {
        const val = Math.abs(Number(search.replace(',', '.')));
        orParts.push(`monto.eq.${val}`);
        orParts.push(`monto.eq.-${val}`);
    }

    const { data, error } = await supabase
        .from("transacciones")
        .select("*")
        .eq("user_id", user.id)
        .or(orParts.join(','))
        .order("fecha", { ascending: false })
        .limit(20);

    if (error) {
        console.error("Supabase Search Error:", error);
        return { error: error.message };
    }

    return { data: data || [] };
}

export async function saveLearningRule(pattern: string, category: string, type: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "No autorizado" }

    const { error } = await supabase
        .from("reglas_aprendizaje")
        .upsert([{
            user_id: user.id,
            patron_descripcion: pattern.toUpperCase(),
            categoria_destino: category,
            tipo_destino: type
        }], {
            onConflict: 'user_id, patron_descripcion'
        });

    if (error) {
        console.error("Error saving learning rule:", error);
        return { error: "Error al guardar la regla de aprendizaje" };
    }

    return { success: true };
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
