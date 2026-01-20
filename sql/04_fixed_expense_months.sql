-- Migración: Añadir aplicabilidad mensual a gastos fijos y tabla de exclusiones

-- 1. Añadir columna meses_aplicacion a gastos_recurrentes
-- Por defecto, un gasto aplica a todos los meses (null o array vacío = todos, o podemos llenarlo [1..12])
ALTER TABLE gastos_recurrentes ADD COLUMN meses_aplicacion INTEGER[] DEFAULT '{1,2,3,4,5,6,7,8,9,10,11,12}';

-- 2. Crear tabla de exclusiones para saltar meses específicos sin borrar el recurrente
CREATE TABLE IF NOT EXISTS exclusiones_fijos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gasto_recurrente_id UUID NOT NULL REFERENCES gastos_recurrentes(id) ON DELETE CASCADE,
    mes DATE NOT NULL, -- Guardamos el primer día del mes excluido
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gasto_recurrente_id, mes)
);

-- Políticas RLS (Si están activas en el resto del proyecto)
ALTER TABLE exclusiones_fijos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enforce public access for now" ON exclusiones_fijos FOR ALL USING (true);

-- 3. Actualizar todos los gastos fijos existentes para que apliquen a todos los meses
UPDATE gastos_recurrentes SET meses_aplicacion = '{1,2,3,4,5,6,7,8,9,10,11,12}' WHERE meses_aplicacion IS NULL OR meses_aplicacion = '{}';
