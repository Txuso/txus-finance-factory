-- Add indexes to improve query performance on large datasets
CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_recurrentes_user_id ON gastos_recurrentes(user_id);
CREATE INDEX IF NOT EXISTS idx_exclusiones_fijos_user_id ON exclusiones_fijos(user_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_user_id ON configuracion(user_id);
