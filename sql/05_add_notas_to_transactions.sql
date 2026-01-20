-- Add notas column to transacciones table
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS notas TEXT;
