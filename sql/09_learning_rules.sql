-- 09_learning_rules.sql
-- New table to store user-defined categorization rules

CREATE TABLE IF NOT EXISTS reglas_aprendizaje (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patron_descripcion TEXT NOT NULL,
  categoria_destino categoria_enum NOT NULL,
  tipo_destino tipo_transaccion_enum NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, patron_descripcion)
);

-- Enable RLS
ALTER TABLE reglas_aprendizaje ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own learning rules" ON reglas_aprendizaje
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning rules" ON reglas_aprendizaje
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning rules" ON reglas_aprendizaje
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning rules" ON reglas_aprendizaje
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reglas_aprendizaje_user ON reglas_aprendizaje(user_id);
