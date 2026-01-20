-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ENUMS (Tipos de datos personalizados)
DO $$ BEGIN
    CREATE TYPE categoria_enum AS ENUM (
      'Vivienda', 'Alimentación', 'Transporte', 'Salud', 
      'Educación', 'Ocio', 'Comunicaciones', 'Suscripciones', 
      'Imprevistos', 'Inversión', 'Otros', 'Trabajo', 'VIdeojuegos'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_transaccion_enum AS ENUM (
      'Gasto fijo', 'Gasto variable', 'Inversión', 'Ingreso'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE metodo_pago_enum AS ENUM (
      'Tarjeta', 'Efectivo', 'Transferencia', 'Bizum', 'Domiciliación'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLAS PRINCIPALES

-- Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objetivo_ahorro_porcentaje DECIMAL(5,2) DEFAULT 0.20,
  moneda VARCHAR(10) DEFAULT '€',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto si no existe
INSERT INTO configuracion (objetivo_ahorro_porcentaje, moneda) 
SELECT 0.20, '€'
WHERE NOT EXISTS (SELECT 1 FROM configuracion);

-- Tabla: transacciones
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  descripcion TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  categoria categoria_enum NOT NULL,
  tipo tipo_transaccion_enum NOT NULL,
  metodo_pago metodo_pago_enum NOT NULL,
  es_automatico BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para transacciones
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones(categoria);


-- 3. GASTOS RECURRENTES (Nueva tabla Fase 2)
CREATE TABLE IF NOT EXISTS gastos_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  monto_estimado DECIMAL(10,2) NOT NULL,
  categoria categoria_enum NOT NULL,
  dia_cobro_estimado INTEGER CHECK (dia_cobro_estimado BETWEEN 1 AND 31),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_email TEXT
);

-- Datos de ejemplo para gastos recurrentes (solo si la tabla está vacía)
INSERT INTO gastos_recurrentes (descripcion, monto_estimado, categoria, dia_cobro_estimado)
SELECT 'Alquiler/Hipoteca', 800.00, 'Vivienda', 1
WHERE NOT EXISTS (SELECT 1 FROM gastos_recurrentes);

INSERT INTO gastos_recurrentes (descripcion, monto_estimado, categoria, dia_cobro_estimado)
SELECT 'Internet + Móvil', 50.00, 'Comunicaciones', 5
WHERE NOT EXISTS (SELECT 1 FROM gastos_recurrentes WHERE descripcion = 'Internet + Móvil');

INSERT INTO gastos_recurrentes (descripcion, monto_estimado, categoria, dia_cobro_estimado)
SELECT 'Netflix/Spotify', 15.00, 'Suscripciones', 10
WHERE NOT EXISTS (SELECT 1 FROM gastos_recurrentes WHERE descripcion = 'Netflix/Spotify');
