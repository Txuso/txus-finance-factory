-- 1. Add user_id to all relevant tables
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE gastos_recurrentes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE exclusiones_fijos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_recurrentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE exclusiones_fijos ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies for 'transacciones'
CREATE POLICY "Users can view their own transactions" ON transacciones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transacciones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transacciones
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON transacciones
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Create Policies for 'gastos_recurrentes'
CREATE POLICY "Users can view their own recurring expenses" ON gastos_recurrentes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recurring expenses" ON gastos_recurrentes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses" ON gastos_recurrentes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses" ON gastos_recurrentes
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Create Policies for 'configuracion'
CREATE POLICY "Users can view their own configuration" ON configuracion
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own configuration" ON configuracion
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own configuration" ON configuracion
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create Policies for 'exclusiones_fijos'
CREATE POLICY "Users can view their own exclusions" ON exclusiones_fijos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exclusions" ON exclusiones_fijos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exclusions" ON exclusiones_fijos
    FOR DELETE USING (auth.uid() = user_id);
