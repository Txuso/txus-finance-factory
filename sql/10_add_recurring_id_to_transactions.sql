-- Migración: Añadir link robusto entre transacciones y gastos recurrentes
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS recurring_id UUID REFERENCES gastos_recurrentes(id) ON DELETE SET NULL;

-- Crear un índice para mejorar la velocidad de matching
CREATE INDEX IF NOT EXISTS idx_transacciones_recurring_id ON transacciones(recurring_id);
