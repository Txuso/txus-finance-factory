'use server'

import { createClient } from "@/lib/supabase/server"
import { LearningRule } from "@/lib/types/rules"
import { revalidatePath } from "next/cache"

export async function getRules() {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('reglas_aprendizaje')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching rules:', error)
            return { error: 'Error al cargar las reglas' }
        }

        return { data: data as LearningRule[] }
    } catch (error) {
        console.error('Unexpected error fetching rules:', error)
        return { error: 'Error inesperado al cargar las reglas' }
    }
}

export async function createRule(data: Partial<LearningRule>) {
    const supabase = await createClient()

    try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return { error: 'No autenticado' }

        const { error } = await supabase
            .from('reglas_aprendizaje')
            .insert({
                user_id: user.user.id,
                patron_descripcion: data.patron_descripcion,
                categoria_destino: data.categoria_destino,
                tipo_destino: data.tipo_destino
            })

        if (error) {
            console.error('Error creating rule:', error)
            if (error.code === '23505') { // Unique violation
                return { error: 'Ya existe una regla para este patrón' }
            }
            return { error: 'Error al crear la regla' }
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error creating rule:', error)
        return { error: 'Error inesperado al crear la regla' }
    }
}

export async function deleteRule(id: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('reglas_aprendizaje')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting rule:', error)
            return { error: 'Error al eliminar la regla' }
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        console.error('Unexpected error deleting rule:', error)
        return { error: 'Error inesperado al eliminar la regla' }
    }
}
