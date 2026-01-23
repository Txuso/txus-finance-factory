import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export function cleanDescription(desc: string) {
  if (!desc) return "";
  return desc
    .replace(/^(OP\.?\s*NET|RECIBO|MOVIMIENTO|TRANSF\.?\s*A\s*FAVOR|ABONO)\s+/gi, '')
    .replace(/\d{2}[/.-]\d{2}[/.-]\d{2,4}/g, ' ')
    .replace(/\b\d{2}[/.-]\d{2}\b/g, ' ')
    .replace(/[*.,\-/_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}
