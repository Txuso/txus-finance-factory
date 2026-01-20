-- Tabla para definir gastos fijos recurrentes (ej: Alquiler, Internet, Gimnasio)
-- Esto permite mostrarlos en el dashboard aunque aún no se haya realizado el pago en el mes actual.

CREATE TABLE gastos_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  monto_estimado DECIMAL(10,2) NOT NULL,
  categoria categoria_enum NOT NULL,
  dia_cobro_estimado INTEGER CHECK (dia_cobro_estimado BETWEEN 1 AND 31),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_email TEXT -- Opcional: para futura multi-tenancy o seguridad
);

-- Datos de ejemplo iniciales (Opcional, el usuario puede borrarlos luego)
INSERT INTO gastos_recurrentes (descripcion, monto_estimado, categoria, dia_cobro_estimado) VALUES
('Alquiler/Hipoteca', 800.00, 'Vivienda', 1),
('Internet + Móvil', 50.00, 'Comunicaciones', 5),
('Gimnasio', 30.00, 'Salud', 1),
('Netflix/Spotify', 15.00, 'Suscripciones', 10);
