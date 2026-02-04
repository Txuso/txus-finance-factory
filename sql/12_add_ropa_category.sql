-- Migration: Add 'Ropa' category to categoria_enum
-- This migration adds a new category value for clothing expenses

-- Add 'Ropa' to the categoria_enum type
ALTER TYPE categoria_enum ADD VALUE IF NOT EXISTS 'Ropa';
