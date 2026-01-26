"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getConfig() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autorizado" }
    }

    let { data, error } = await supabase
        .from("configuracion")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Error fetching config:", error);
        return { error: "No se pudo cargar la configuración" };
    }

    // If no config exists for this user, create a default one
    if (!data) {
        const { data: newConfig, error: insertError } = await supabase
            .from("configuracion")
            .insert([{
                user_id: user.id,
                objetivo_ahorro_porcentaje: 0.20,
                moneda: '€'
            }])
            .select()
            .single();

        if (insertError) {
            console.error("Error creating default config:", insertError);
            return { error: "Error al inicializar la configuración" };
        }
        data = newConfig;
    }

    return { data };
}

export async function updateConfig(data: {
    objetivo_ahorro_porcentaje?: number;
    moneda?: string;
    fondo_emergencia_objetivo?: number;
    fondo_emergencia_actual?: number;
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "No autorizado" }
    }

    // Basic validation
    if (data.objetivo_ahorro_porcentaje !== undefined) {
        if (data.objetivo_ahorro_porcentaje < 0 || data.objetivo_ahorro_porcentaje > 1) {
            return { error: "El objetivo debe estar entre 0 y 1 (ej: 0.20 para 20%)" };
        }
    }

    const { error } = await supabase
        .from("configuracion")
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

    if (error) {
        console.error("Error updating config:", error);
        return { error: "Error al actualizar la configuración" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { success: true };
}
