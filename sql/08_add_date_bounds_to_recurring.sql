-- Migración: Añadir fecha de inicio y fin a gastos recurrentes
ALTER TABLE gastos_recurrentes ADD COLUMN IF NOT EXISTS fecha_inicio DATE;
ALTER TABLE gastos_recurrentes ADD COLUMN IF NOT EXISTS fecha_fin DATE;

-- Para los existentes, ponemos la fecha de hoy como inicio si no tienen una.
-- Pero idealmente, como no sabemos cuando empezaron, les ponemos una fecha muy antigua para que sigan saliendo.
UPDATE gastos_recurrentes SET fecha_inicio = '2024-01-01' WHERE fecha_inicio IS NULL;

-- Asegurar que los nuevos tengan fecha_inicio por defecto (opcional, mejor manejarlo en el código)
ALTER TABLE gastos_recurrentes ALTER COLUMN fecha_inicio SET DEFAULT CURRENT_DATE;
