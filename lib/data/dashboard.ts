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

export interface FinancialInsight {
    type: 'alert' | 'success' | 'tip' | 'salary';
    title: string;
    message: string;
    value?: string;
    impact?: 'positive' | 'negative' | 'neutral';
    icon?: string;
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

export async function getFinancialInsights(currentDate: Date, userId: string): Promise<FinancialInsight[]> {
    const supabase = await createClient();
    const insights: FinancialInsight[] = [];

    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    // History (Last 3 months for better averages)
    const historyStart = format(startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1)), 'yyyy-MM-dd');
    const historyEnd = format(endOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)), 'yyyy-MM-dd');

    const [currentRes, historyRes, configRes] = await Promise.all([
        supabase.from("transacciones").select("*").eq("user_id", userId).gte("fecha", start).lte("fecha", end),
        supabase.from("transacciones").select("*").eq("user_id", userId).gte("fecha", historyStart).lte("fecha", historyEnd),
        supabase.from("configuracion").select("*").eq("user_id", userId).single()
    ]);

    const currentTrans = (currentRes.data || []) as Transaccion[];
    const historyTrans = (historyRes.data || []) as Transaccion[];
    const config = configRes.data;

    if (currentTrans.length === 0 && historyTrans.length === 0) return [];

    // --- 1. SALARY ANTICIPATION ---
    const historicalSalaries = historyTrans.filter(t => t.tipo === 'Ingreso' && (t.descripcion.toUpperCase().includes('NOMINA') || t.monto > 1000));
    const avgSalary = historicalSalaries.length > 0
        ? historicalSalaries.reduce((sum, t) => sum + Math.abs(t.monto), 0) / 3 // Divide by 3 months
        : 0;

    const hasReceivedSalary = currentTrans.some(t => t.tipo === 'Ingreso' && (t.descripcion.toUpperCase().includes('NOMINA') || t.monto > 1000));

    if (!hasReceivedSalary && avgSalary > 0) {
        const currentBalance = currentTrans.reduce((sum, t) => sum + t.monto, 0);
        const projectedBalance = currentBalance + avgSalary;

        insights.push({
            type: 'salary',
            title: 'Nómina pendiente',
            message: `Aún no detectamos tu nómina (~${avgSalary.toFixed(0)}€), pero con ella tu balance final será positivo.`,
            value: `${projectedBalance.toFixed(0)}€`,
            impact: 'neutral',
            icon: 'Wallet'
        });
    }

    // --- 2. CATEGORY ANOMALIES ---
    const categories = Array.from(new Set(currentTrans.map(t => t.categoria)));
    categories.forEach(cat => {
        if (cat === 'Inversión' || cat === 'Otros') return;

        const currentCatTotal = Math.abs(currentTrans.filter(t => t.categoria === cat).reduce((sum, t) => sum + t.monto, 0));
        const historicalCatTotal = Math.abs(historyTrans.filter(t => t.categoria === cat).reduce((sum, t) => sum + t.monto, 0));
        const avgCatMonthly = historicalCatTotal / 3;

        if (avgCatMonthly > 50 && currentCatTotal > avgCatMonthly * 1.15) {
            const diffPct = ((currentCatTotal / avgCatMonthly) - 1) * 100;
            insights.push({
                type: 'alert',
                title: `Gasto en ${cat}`,
                message: `Llevas un ${diffPct.toFixed(0)}% más de lo habitual en esta categoría.`,
                value: `+${(currentCatTotal - avgCatMonthly).toFixed(0)}€`,
                impact: 'negative',
                icon: 'TrendingDown'
            });
        }
    });

    // --- 3. SAVINGS PROJECTION ---
    const currentIncome = currentTrans.filter(t => t.tipo === 'Ingreso').reduce((sum, t) => sum + Math.abs(t.monto), 0);
    const effectiveIncome = hasReceivedSalary ? currentIncome : currentIncome + avgSalary;
    const currentExpenses = Math.abs(currentTrans.filter(t => t.tipo !== 'Ingreso').reduce((sum, t) => sum + t.monto, 0));

    // Simple projection: expenses scale with days elapsed
    const daysInMonth = endOfMonth(currentDate).getDate();
    const dayOfMonth = currentDate.getDate();
    const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

    if (isCurrentMonth && dayOfMonth > 5 && effectiveIncome > 0) {
        const projectedExpenses = (currentExpenses / dayOfMonth) * daysInMonth;
        const projectedSavings = effectiveIncome - projectedExpenses;
        const projectedPct = (projectedSavings / effectiveIncome) * 100;
        const targetPct = (config?.objetivo_ahorro_porcentaje || 0.20) * 100;

        if (projectedPct >= targetPct) {
            insights.push({
                type: 'success',
                title: 'Objetivo a la vista',
                message: `Sigues así y ahorrarás un ${projectedPct.toFixed(0)}% este mes.`,
                value: `${projectedSavings.toFixed(0)}€`,
                impact: 'positive',
                icon: 'TrendingUp'
            });
        } else {
            insights.push({
                type: 'tip',
                title: 'Ahorro ajustado',
                message: `La proyección indica un ${(projectedPct < 0 ? 0 : projectedPct).toFixed(0)}% de ahorro. Necesitas reducir algún gasto variable.`,
                value: `${(targetPct - projectedPct).toFixed(0)}% off`,
                impact: 'negative',
                icon: 'PieChart'
            });
        }
    }

    return insights;
}
