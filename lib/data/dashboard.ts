import { supabase } from "@/lib/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction";

export interface DashboardData {
    transactions: Transaccion[];
    recurringExpenses: GastoRecurrente[];
}

export async function getDashboardData(date: Date): Promise<DashboardData> {
    const start = startOfMonth(date).toISOString();
    const end = endOfMonth(date).toISOString();

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
    const { data: recurring, error: recError } = await supabase
        .from("gastos_recurrentes")
        .select("*")
        .eq("activo", true)
        .order("dia_cobro_estimado", { ascending: true });

    if (recError) {
        console.error("Error fetching recurring expenses:", recError);
        throw new Error("Error fetching recurring expenses");
    }

    return {
        transactions: (transactions as Transaccion[]) || [],
        recurringExpenses: (recurring as GastoRecurrente[]) || [],
    };
}
