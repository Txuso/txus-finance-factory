-- Migración: Añadir columnas para el Fondo de Emergencia
ALTER TABLE configuracion 
ADD COLUMN IF NOT EXISTS fondo_emergencia_objetivo DECIMAL(12,2) DEFAULT 12000.00,
ADD COLUMN IF NOT EXISTS fondo_emergencia_actual DECIMAL(12,2) DEFAULT 0.00;

-- Asegurar que los registros existentes tengan el valor por defecto
UPDATE configuracion 
SET fondo_emergencia_objetivo = 12000.00 
WHERE fondo_emergencia_objetivo IS NULL;

UPDATE configuracion 
SET fondo_emergencia_actual = 0.00 
WHERE fondo_emergencia_actual IS NULL;
