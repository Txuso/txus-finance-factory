import { TipoTransaccion } from '../types/transaction';

/**
 * Determines if a transaction type is considered an expense for monthly calculations.
 * Investments are EXPLICITLY excluded from expenses.
 */
export function esGasto(tipo: TipoTransaccion): boolean {
    return tipo === 'Gasto fijo' || tipo === 'Gasto variable';
}

export function esIngreso(tipo: TipoTransaccion): boolean {
    return tipo === 'Ingreso';
}

export function esInversion(tipo: TipoTransaccion): boolean {
    return tipo === 'Inversión';
}

/**
 * Returns the signed amount for calculations.
 * Expenses and Investments are negative, Incomes are positive.
 * Note: Even though Investments are not "Expenses", they are still outflows of money.
 */
export function obtenerMontoConSigno(monto: number, tipo: TipoTransaccion): number {
    const montoAbsoluto = Math.abs(monto);
    if (esIngreso(tipo)) {
        return montoAbsoluto;
    }
    return -montoAbsoluto;
}
