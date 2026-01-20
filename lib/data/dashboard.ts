import { supabase } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction";

export interface DashboardData {
    transactions: Transaccion[];
    recurringExpenses: GastoRecurrente[];
}

export async function getDashboardData(date: Date): Promise<DashboardData> {
    // USE LOCAL DATE STRINGS for 'DATE' column queries to avoid UTC shifts
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');

    // 1. Fetch Transactions for the month
    const { data: transactions, error: transError } = await supabase
        .from("transacciones")
        .select("*")
        .gte("fecha", start)
        .lte("fecha", end)
        .order("fecha", { ascending: false });

    if (transError) {
        console.error("Error fetching transactions:", transError);
        throw new Error("Error fetching transactions");
    }

    // 2. Fetch Recurring Expenses definition
    let { data: recurring, error: recError } = await supabase
        .from("gastos_recurrentes")
        .select("*")
        .eq("activo", true)
        .order("dia_cobro_estimado", { ascending: true });

    if (recError) {
        console.error("Error fetching recurring expenses:", recError);
        throw new Error("Error fetching recurring expenses");
    }

    // 3. Fetch Exclusions for this month
    const { data: exclusions } = await supabase
        .from("exclusiones_fijos")
        .select("gasto_recurrente_id")
        .eq("mes", start);

    const excludedIds = exclusions?.map(e => e.gasto_recurrente_id) || [];

    // 4. Filter by month applicability and exclusions
    const currentMonthNum = date.getMonth() + 1; // 1-12
    const filteredRecurring = (recurring as GastoRecurrente[] || [])
        .filter(item => {
            // Check if month is in applicability array (if it exists)
            const matchesMonth = !item.meses_aplicacion ||
                item.meses_aplicacion.length === 0 ||
                item.meses_aplicacion.includes(currentMonthNum);

            // Check if not explicitly excluded for this month
            const isNotExcluded = !excludedIds.includes(item.id);

            return matchesMonth && isNotExcluded;
        });

    return {
        transactions: (transactions as Transaccion[]) || [],
        recurringExpenses: filteredRecurring,
    };
}

export interface MonthlyStat {
    month: string;
    income: number;
    expenses: number;
    investments: number;
}

export async function getMonthlyStats(endDate: Date): Promise<MonthlyStat[]> {
    const stats: MonthlyStat[] = [];

    // Fetch last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');

        const { data: transactions } = await supabase
            .from("transacciones")
            .select("monto, tipo, categoria")
            .gte("fecha", start)
            .lte("fecha", end);

        if (transactions) {
            const income = transactions
                .filter(t => t.tipo === 'Ingreso')
                .reduce((sum, t) => sum + Math.abs(t.monto), 0);

            const investments = transactions
                .filter(t => t.tipo === 'Inversión' || t.categoria === 'Inversión')
                .reduce((sum, t) => sum + Math.abs(t.monto), 0);

            const expenses = transactions
                .filter(t => t.tipo !== 'Ingreso' && t.tipo !== 'Inversión' && t.categoria !== 'Inversión')
                .reduce((sum, t) => sum + Math.abs(t.monto), 0);

            stats.push({
                month: format(date, 'MMM yy', { locale: es as any }),
                income,
                expenses,
                investments
            });
        }
    }

    return stats;
}

export async function getYearlyStats(year: number): Promise<MonthlyStat[]> {
    const stats: MonthlyStat[] = [];

    for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1);
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');

        const { data: transactions } = await supabase
            .from("transacciones")
            .select("monto, tipo, categoria")
            .gte("fecha", start)
            .lte("fecha", end);

        if (transactions) {
            const income = transactions
                .filter(t => t.tipo === 'Ingreso')
                .reduce((sum, t) => sum + Math.abs(t.monto), 0);

            const investments = transactions
                .filter(t => t.tipo === 'Inversión' || t.categoria === 'Inversión')
                .reduce((sum, t) => sum + Math.abs(t.monto), 0);

            const expenses = transactions
                .filter(t => t.tipo !== 'Ingreso' && t.tipo !== 'Inversión' && t.categoria !== 'Inversión')
                .reduce((sum, t) => sum + Math.abs(t.monto), 0);

            stats.push({
                month: format(date, 'MMM', { locale: es as any }),
                income,
                expenses,
                investments
            });
        }
    }

    return stats;
}
