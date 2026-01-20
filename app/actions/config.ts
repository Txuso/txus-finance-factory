"use server"

import { supabase } from "@/lib/supabase/client"
import { revalidatePath } from "next/cache"

export async function getConfig() {
    const { data, error } = await supabase
        .from("configuracion")
        .select("*")
        .single();

    if (error) {
        console.error("Error fetching config:", error);
        return { error: "No se pudo cargar la configuración" };
    }

    return { data };
}

export async function updateConfig(data: {
    objetivo_ahorro_porcentaje?: number;
    moneda?: string;
}) {
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
        .match({ id: (await getConfig()).data?.id });

    if (error) {
        console.error("Error updating config:", error);
        return { error: "Error al actualizar la configuración" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { success: true };
}
