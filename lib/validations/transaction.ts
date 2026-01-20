import { z } from "zod"
import { CATEGORIAS, TIPOS_TRANSACCION, METODOS_PAGO } from "@/lib/types/transaction"

export const transactionSchema = z.object({
    descripcion: z.string().min(2, {
        message: "La descripción debe tener al menos 2 caracteres.",
    }),
    monto: z.coerce.number().refine(val => Math.abs(val) >= 0.01, {
        message: "El monto debe ser distinto de 0.",
    }),
    fecha: z.date({
        required_error: "La fecha es requerida.",
    }),
    // Cast readonly arrays to any to satisfy z.enum mutable array requirement in strict mode
    categoria: z.enum(CATEGORIAS as unknown as [string, ...string[]], {
        errorMap: () => ({ message: "Selecciona una categoría válida." }),
    }),
    tipo: z.enum(TIPOS_TRANSACCION as unknown as [string, ...string[]], {
        errorMap: () => ({ message: "Selecciona un tipo válido." }),
    }),
    metodo_pago: z.enum(METODOS_PAGO as unknown as [string, ...string[]], {
        errorMap: () => ({ message: "Selecciona un método de pago válido." }),
    }),
    es_automatico: z.boolean().default(false),
    meses_aplicacion: z.array(z.number()).optional(),
});

export const recurringSchema = z.object({
    descripcion: z.string().min(2, {
        message: "La descripción debe tener al menos 2 caracteres.",
    }),
    monto_estimado: z.coerce.number().min(0.01, {
        message: "El monto debe ser mayor a 0.",
    }),
    categoria: z.enum(CATEGORIAS as unknown as [string, ...string[]], {
        errorMap: () => ({ message: "Selecciona una categoría válida." }),
    }),
    dia_cobro_estimado: z.coerce.number().min(1).max(31),
    activo: z.boolean().default(true),
    meses_aplicacion: z.array(z.number()).default([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>
export type RecurringFormValues = z.infer<typeof recurringSchema>
