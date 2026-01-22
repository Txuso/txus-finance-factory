import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { es } from "date-fns/locale";
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction";

export interface DashboardData {
    transactions: Transaccion[];
    recurringExpenses: GastoRecurrente[];
    config: {
        id: string;
        objetivo_ahorro_porcentaje: number;
        moneda: string;
    };
}

export async function getDashboardData(date: Date, userId: string): Promise<DashboardData> {
    const supabase = await createClient();

    // USE LOCAL DATE STRINGS for 'DATE' column queries to avoid UTC shifts
    const start = format(startOfMonth(date), 'yyyy-MM-dd');
    const end = format(endOfMonth(date), 'yyyy-MM-dd');

    // Parallelize data fetching
    const [transactionsResult, recurringResult, configResult] = await Promise.all([
        supabase
            .from("transacciones")
            .select("*")
            .eq("user_id", userId)
            .gte("fecha", start)
            .lte("fecha", end)
            .order("fecha", { ascending: false }),
        supabase
            .from("gastos_recurrentes")
            .select("*")
            .eq("user_id", userId)
            .eq("activo", true)
            .order("dia_cobro_estimado", { ascending: true }),
        supabase
            .from("configuracion")
            .select("*")
            .eq("user_id", userId)
            .single()
    ]);

    const transactions = transactionsResult.data;
    const transError = transactionsResult.error;
    const recurring = recurringResult.data;
    const recError = recurringResult.error;
    const config = configResult.data;

    if (transError) {
        console.error("Error fetching transactions:", transError);
        throw new Error("Error fetching transactions");
    }

    if (recError) {
        console.error("Error fetching recurring expenses:", recError);
        throw new Error("Error fetching recurring expenses");
    }

    // 3. Fetch Exclusions for this month (In parallel with others if possible, but let's keep it clean)
    // 3. Fetch Exclusions for this month (In parallel with others if possible, but let's keep it clean)
    const { data: exclusions } = await supabase
        .from("exclusiones_fijos")
        .select("gasto_recurrente_id")
        .eq("user_id", userId)
        .eq("mes", start);

    const excludedIds = exclusions?.map(e => e.gasto_recurrente_id) || [];

    // 4. Filter by month applicability, exclusions and DATE BOUNDS
    const currentMonthNum = date.getMonth() + 1; // 1-12
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const filteredRecurring = (recurring as GastoRecurrente[] || [])
        .filter(item => {
            // A. Check month applicability array
            const matchesMonth = !item.meses_aplicacion ||
                item.meses_aplicacion.length === 0 ||
                item.meses_aplicacion.includes(currentMonthNum);

            // B. Check if not explicitly excluded
            const isNotExcluded = !excludedIds.includes(item.id);

            // C. Check DATE BOUNDS
            const startLimit = item.fecha_inicio ? new Date(item.fecha_inicio) : null;
            const endLimit = item.fecha_fin ? new Date(item.fecha_fin) : null;

            // Is active this month if:
            // 1. No start date OR start date is before or within this month
            const isStarted = !startLimit || startLimit <= monthEnd;
            // 2. No end date OR end date is after or within this month
            const isNotFinished = !endLimit || endLimit >= monthStart;

            return matchesMonth && isNotExcluded && isStarted && isNotFinished;
        });

    return {
        transactions: (transactions as Transaccion[]) || [],
        recurringExpenses: filteredRecurring,
        config: config as any
    };
}

export interface MonthlyStat {
    month: string;
    income: number;
    expenses: number;
    investments: number;
}

export interface CategoryStat {
    name: string;
    value: number;
}

export async function getMonthlyStats(endDate: Date, userId: string): Promise<MonthlyStat[]> {
    const supabase = await createClient();
    // No auth call needed

    const stats: MonthlyStat[] = [];

    // Fetch last 6 months in one go
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1);
    const start = format(startOfMonth(startDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(endDate), 'yyyy-MM-dd');

    const { data: transactions } = await supabase
        .from("transacciones")
        .select("fecha, monto, tipo, categoria")
        .eq("user_id", userId)
        .gte("fecha", start)
        .lte("fecha", end);

    if (!transactions) return [];

    // Group by month
    for (let i = 5; i >= 0; i--) {
        const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
        const monthKey = format(date, 'yyyy-MM');

        const monthTransactions = transactions.filter(t => t.fecha.startsWith(monthKey));

        const income = monthTransactions
            .filter(t => t.tipo === 'Ingreso')
            .reduce((sum, t) => sum + Math.abs(t.monto), 0);

        const investments = monthTransactions
            .filter(t => t.tipo === 'Inversión' || t.categoria === 'Inversión')
            .reduce((sum, t) => sum + Math.abs(t.monto), 0);

        const expenses = monthTransactions
            .filter(t => t.tipo !== 'Ingreso' && t.tipo !== 'Inversión' && t.categoria !== 'Inversión')
            .reduce((sum, t) => sum + Math.abs(t.monto), 0);

        stats.push({
            month: format(date, 'MMM yy', { locale: es as any }),
            income,
            expenses,
            investments
        });
    }

    return stats;
}

export async function getYearlyStats(year: number, userId: string): Promise<MonthlyStat[]> {
    const supabase = await createClient();
    // No auth call needed

    const stats: MonthlyStat[] = [];
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;

    // Fetch whole year in one query
    const { data: transactions } = await supabase
        .from("transacciones")
        .select("fecha, monto, tipo, categoria")
        .eq("user_id", userId)
        .gte("fecha", start)
        .lte("fecha", end);

    if (!transactions) return [];

    for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1);
        const monthPrefix = format(date, 'yyyy-MM');

        const monthTransactions = transactions.filter(t => t.fecha.startsWith(monthPrefix));

        const income = monthTransactions
            .filter(t => t.tipo === 'Ingreso')
            .reduce((sum, t) => sum + Math.abs(t.monto), 0);

        const investments = monthTransactions
            .filter(t => t.tipo === 'Inversión' || t.categoria === 'Inversión')
            .reduce((sum, t) => sum + Math.abs(t.monto), 0);

        const expenses = monthTransactions
            .filter(t => t.tipo !== 'Ingreso' && t.tipo !== 'Inversión' && t.categoria !== 'Inversión')
            .reduce((sum, t) => sum + Math.abs(t.monto), 0);

        stats.push({
            month: format(date, 'MMM', { locale: es as any }),
            income,
            expenses,
            investments
        });
    }

    return stats;
}

export async function getCategoryStats(year: number, userId: string, month?: number): Promise<CategoryStat[]> {
    const supabase = await createClient();
    // No auth call needed

    let query = supabase
        .from("transacciones")
        .select("monto, categoria, tipo")
        .eq("user_id", userId);

    if (month !== undefined) {
        const date = new Date(year, month - 1, 1);
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte("fecha", start).lte("fecha", end);
    } else {
        const start = `${year}-01-01`;
        const end = `${year}-12-31`;
        query = query.gte("fecha", start).lte("fecha", end);
    }

    const { data: transactions, error } = await query;

    if (error) {
        console.error("Error fetching category stats:", error);
        return [];
    }

    const categories: Record<string, number> = {};

    transactions.forEach(t => {
        // Only count expenses (negative values usually, or tipo != 'Ingreso')
        // We exclude Inversión from general expenses distribution as requested in previous steps
        if (t.tipo !== 'Ingreso' && t.tipo !== 'Inversión' && t.categoria !== 'Inversión') {
            const amount = Math.abs(t.monto);
            categories[t.categoria] = (categories[t.categoria] || 0) + amount;
        }
    });

    return Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}
