export const CATEGORIAS = [
    'Vivienda',
    'Alimentación',
    'Transporte',
    'Salud',
    'Educación',
    'Ocio',
    'Comunicaciones',
    'Suscripciones',
    'Imprevistos',
    'Inversión',
    'Otros',
    'Trabajo',
    'VIdeojuegos'
] as const;

export type Categoria = typeof CATEGORIAS[number];

export const TIPOS_TRANSACCION = [
    'Gasto fijo',
    'Gasto variable',
    'Inversión',
    'Ingreso'
] as const;

export type TipoTransaccion = typeof TIPOS_TRANSACCION[number];

export const METODOS_PAGO = [
    'Tarjeta',
    'Efectivo',
    'Transferencia',
    'Bizum',
    'Domiciliación'
] as const;

export type MetodoPago = typeof METODOS_PAGO[number];

export interface Transaccion {
    id: string;
    fecha: string;
    descripcion: string;
    notas?: string; // Additional detailed description
    monto: number;
    categoria: Categoria;
    tipo: TipoTransaccion;
    metodo_pago: MetodoPago;
    es_automatico: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface GastoRecurrente {
    id: string;
    descripcion: string;
    monto_estimado: number;
    categoria: Categoria;
    dia_cobro_estimado: number;
    activo: boolean;
    meses_aplicacion?: number[]; // [1, 2, ..., 12]
    created_at?: string;
}
