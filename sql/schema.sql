-- Enable UUID extension
create extension if not exists "uuid-ossp";

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

-- Enums
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

-- Indices
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_categoria ON transacciones(categoria);
