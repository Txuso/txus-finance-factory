import { createClient } from "@/lib/supabase/server";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Builds a comprehensive but token-efficient financial context string for the AI advisor.
 * Gathers ALL available transaction history - aggregated by month.
 *
 * IMPORTANT NOTE ON CALCULATIONS:
 * - "Ahorro" = income - gastos_fijos - gastos_variables  (investments are NOT subtracted — they are a positive activity)
 * - "Flujo neto de caja" = income - gastos_fijos - gastos_variables - inversiones
 * - Inversiones are treated as wealth-building, not as losses
 */
export async function buildFinancialContext(userId: string): Promise<string> {
    const supabase = await createClient();
    const now = new Date();
    const currentMonthKey = format(now, "yyyy-MM");
    const currentDayOfMonth = now.getDate();

    // --- Fetch all data in parallel ---
    const [allTransactionsRes, recurringRes, configRes] = await Promise.all([
        supabase
            .from("transacciones")
            .select("fecha, descripcion, monto, tipo, categoria")
            .eq("user_id", userId)
            .order("fecha", { ascending: false }),
        supabase
            .from("gastos_recurrentes")
            .select("descripcion, monto_estimado, categoria")
            .eq("user_id", userId)
            .eq("activo", true),
        supabase
            .from("configuracion")
            .select("objetivo_ahorro_porcentaje, fondo_emergencia_objetivo, fondo_emergencia_actual")
            .eq("user_id", userId)
            .single()
    ]);

    const allTransactions = allTransactionsRes.data || [];
    const recurring = recurringRes.data || [];
    const config = configRes.data;

    if (allTransactions.length === 0) {
        return "No hay datos financieros disponibles aún.";
    }

    // --- Aggregate by month ---
    const monthlyMap: Record<string, {
        income: number;
        fixed: number;
        variable: number;
        investments: number;
    }> = {};

    const categoryTotals: Record<string, number> = {};

    for (const t of allTransactions) {
        const monthKey = t.fecha.substring(0, 7); // "yyyy-MM"
        if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { income: 0, fixed: 0, variable: 0, investments: 0 };
        }
        const abs = Math.abs(t.monto);
        if (t.tipo === "Ingreso") {
            monthlyMap[monthKey].income += abs;
        } else if (t.tipo === "Inversión" || t.categoria === "Inversión") {
            monthlyMap[monthKey].investments += abs;
        } else if (t.tipo === "Gasto fijo") {
            monthlyMap[monthKey].fixed += abs;
        } else {
            // Gasto variable (excluding Inversión categoria already filtered above)
            monthlyMap[monthKey].variable += abs;
            if (t.categoria) {
                categoryTotals[t.categoria] = (categoryTotals[t.categoria] || 0) + abs;
            }
        }
    }

    const sortedMonths = Object.keys(monthlyMap).sort().reverse(); // newest first

    // --- Monthly summary ---
    // SAVINGS = income - fixed - variable  (investments treated as separate, positive activity)
    // NET_CASHFLOW = income - fixed - variable - investments (actual bank balance change)
    const monthlySummary = sortedMonths.map(mk => {
        const m = monthlyMap[mk];
        const isCurrent = mk === currentMonthKey;
        const savings = m.income - m.fixed - m.variable; // excludes investments
        const netCashflow = savings - m.investments;
        const savingsPct = m.income > 0 ? ((savings / m.income) * 100).toFixed(0) : "?";
        const date = new Date(mk + "-01");
        const label = format(date, "MMM-yy", { locale: es as any });
        const tag = isCurrent ? ` ⚠️INCOMPLETO(día ${currentDayOfMonth}/31)` : "";
        return `${label}${tag}: ing=${m.income.toFixed(0)}€ fijos=${m.fixed.toFixed(0)}€ var=${m.variable.toFixed(0)}€ inv=${m.investments.toFixed(0)}€ | AHORRO=${savings.toFixed(0)}€(${savingsPct}%) FLUJO_NETO=${netCashflow.toFixed(0)}€`;
    }).join("\n");

    // --- Top variable expenses current month (max 12) ---
    const currentVarTxns = allTransactions
        .filter(t => t.fecha.startsWith(currentMonthKey) && t.tipo !== "Ingreso" && t.tipo !== "Inversión" && t.categoria !== "Inversión")
        .sort((a, b) => Math.abs(b.monto) - Math.abs(a.monto))
        .slice(0, 12)
        .map(t => `  ${t.fecha.slice(5)}: ${t.descripcion.slice(0, 40)} ${Math.abs(t.monto).toFixed(0)}€ [${t.tipo}/${t.categoria}]`)
        .join("\n");

    // --- Recent investment transactions (last 15) ---
    const recentInvestments = allTransactions
        .filter(t => t.tipo === "Inversión" || t.categoria === "Inversión")
        .slice(0, 15)
        .map(t => `  ${t.fecha}: ${t.descripcion.slice(0, 45)} ${Math.abs(t.monto).toFixed(0)}€`)
        .join("\n");

    // --- Category totals (top 10, variable expenses only) ---
    const topCategories = Object.entries(categoryTotals)
        .filter(([cat]) => cat !== "Inversión")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([cat, total]) => `  ${cat}: ${total.toFixed(0)}€`)
        .join("\n");

    // --- Recurring expenses ---
    const recurringList = recurring
        .map(r => `  ${r.descripcion.slice(0, 40)}: ~${r.monto_estimado}€ [${r.categoria}]`)
        .join("\n");

    const emergencyActual = config?.fondo_emergencia_actual || 0;
    const emergencyTarget = config?.fondo_emergencia_objetivo || 12000;
    const savingsTargetPct = ((config?.objetivo_ahorro_porcentaje || 0.20) * 100).toFixed(0);
    const emergencyPct = emergencyTarget > 0 ? ((emergencyActual / emergencyTarget) * 100).toFixed(0) : "0";

    // Average monthly expenses (last 3 completed months, for emergency fund context)
    const completedMonths = sortedMonths.filter(mk => mk !== currentMonthKey).slice(0, 3);
    const avgMonthlyExpenses = completedMonths.length > 0
        ? completedMonths.reduce((sum, mk) => {
            const m = monthlyMap[mk];
            return sum + m.fixed + m.variable;
        }, 0) / completedMonths.length
        : 0;
    const recommendedEmergencyFund = avgMonthlyExpenses * 6; // 6 months of expenses

    return `=== DATOS FINANCIEROS REALES (hoy: ${format(now, "d MMM yyyy", { locale: es as any })}) ===
Historial disponible: ${sortedMonths.length} meses (${sortedMonths[sortedMonths.length - 1]} → ${sortedMonths[0]})
Objetivo de ahorro configurado: ${savingsTargetPct}% del ingreso mensual
Promedio gastos mes (últimos 3 meses): ${avgMonthlyExpenses.toFixed(0)}€/mes

=== FONDO DE EMERGENCIA ===
Actual: ${emergencyActual.toFixed(0)}€ / Objetivo: ${emergencyTarget.toFixed(0)}€ (${emergencyPct}% completado)
Fondo recomendado (6 meses de gastos): ~${recommendedEmergencyFund.toFixed(0)}€

=== DEFINICIONES IMPORTANTES (léalas ANTES de analizar) ===
- AHORRO = Ingresos - Gastos fijos - Gastos variables (las INVERSIONES NO se restan del ahorro; son un activo positivo)
- FLUJO_NETO = Ahorro - Inversiones (la variación real de la cuenta bancaria)
- Las INVERSIONES son dinero que va a generar riqueza futura (Indexa Capital, fondos, etc.), no son gastos
- El mes actual (${currentMonthKey}) está INCOMPLETO (solo ${currentDayOfMonth} días). NO hagas valoraciones definitivas sobre él.

=== HISTORIAL MENSUAL COMPLETO (más reciente primero) ===
${monthlySummary}

=== DETALLE GASTOS MES ACTUAL (${currentMonthKey}, INCOMPLETO) ===
${currentVarTxns || "Sin datos de gastos variables"}

=== HISTORIAL DE INVERSIONES RECIENTES ===
${recentInvestments || "Sin inversiones registradas"}

=== GASTOS RECURRENTES ACTIVOS ===
${recurringList || "Sin gastos recurrentes configurados"}

=== DISTRIBUCIÓN HISTÓRICA POR CATEGORÍAS (gastos variables acumulados) ===
${topCategories}`;
}
