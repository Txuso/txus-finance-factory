import { Suspense } from "react"
import { getDashboardData, getYearlyStats } from "@/lib/data/dashboard"
import { ExpenseTables } from "@/components/dashboard/ExpenseTables"
import { MonthlyComparisonChart } from "@/components/dashboard/MonthlyComparisonChart"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthSelectorWrapper } from "@/components/dashboard/MonthSelectorWrapper"
import { YearSelector } from "@/components/dashboard/YearSelector"

import { ImportDialog } from "@/components/transactions/ImportDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs"
import { PieChart, TrendingUp, Wallet } from "lucide-react"

interface DashboardPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const params = await searchParams;

    const now = new Date();
    let currentDate = now;

    if (params.year && params.month) {
        const year = parseInt(params.year as string);
        const month = parseInt(params.month as string);
        if (!isNaN(year) && !isNaN(month)) {
            currentDate = new Date(year, month - 1, 1);
        }
    }

    // Estadísticas independientes
    const statsYear = params.statsYear ? parseInt(params.statsYear as string) : now.getFullYear();
    const yearlyStats = await getYearlyStats(statsYear);

    const { transactions, recurringExpenses } = await getDashboardData(currentDate);

    // Cálculos para KPIs (Lógica centralizada en el servidor)
    const incomeTransactions = transactions.filter(t => t.tipo === 'Ingreso');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    const variableExpenses = transactions.filter(t => t.tipo === 'Gasto variable');
    const totalVariable = Math.abs(variableExpenses
        .filter(t => t.categoria !== 'Inversión' && t.tipo !== 'Inversión')
        .reduce((sum, t) => sum + t.monto, 0));

    // Identificar fijos extra (no recurrentes matched)
    const matchedTransactionIds = recurringExpenses.map(recurring => {
        const match = transactions.find(t =>
            t.tipo === 'Gasto fijo' &&
            (t.descripcion.toLowerCase().includes(recurring.descripcion.toLowerCase()) ||
                (t.categoria === recurring.categoria && Math.abs(t.monto - recurring.monto_estimado) < 50))
        );
        return match?.id;
    }).filter(Boolean);

    const extraFixedExpenses = transactions.filter(t =>
        t.tipo === 'Gasto fijo' &&
        !matchedTransactionIds.includes(t.id)
    );

    const totalFixed = recurringExpenses.reduce((sum, item) => sum + item.monto_estimado, 0)
        + extraFixedExpenses.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    const totalInvestments = Math.abs(transactions
        .filter(t => t.categoria === 'Inversión' || t.tipo === 'Inversión')
        .reduce((sum, t) => sum + t.monto, 0));

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col items-center space-y-4 relative">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Txus Finance Factory
                </h1>

                <div className="absolute right-0 top-0">
                    <ImportDialog />
                </div>

                <MonthSelectorWrapper initialDate={currentDate} />
            </div>

            <DashboardKPIs
                totalIncome={totalIncome}
                totalExpenses={totalFixed + totalVariable}
                totalInvestments={totalInvestments}
            />

            <Tabs defaultValue="summary" className="w-full">
                <div className="flex items-center justify-center mb-10">
                    <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50 h-auto">
                        <TabsTrigger
                            value="summary"
                            className="rounded-lg px-6 py-2.5 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium text-slate-500"
                        >
                            <Wallet className="h-4 w-4" />
                            Resumen Mensual
                        </TabsTrigger>
                        <TabsTrigger
                            value="stats"
                            className="rounded-lg px-6 py-2.5 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all font-medium text-slate-500"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Estadísticas
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="summary" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* COLUMNA IZQUIERDA: GASTOS (2/3 ancho) */}
                        <div className="lg:col-span-2 space-y-6">
                            <ExpenseTables
                                transactions={transactions}
                                recurringExpenses={recurringExpenses}
                            />
                        </div>

                        {/* COLUMNA DERECHA: FORMULARIO (1/3 ancho) */}
                        <div className="space-y-6">
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 sticky top-10">
                                <CardHeader>
                                    <CardTitle>Nueva Transacción</CardTitle>
                                    <CardDescription>Registra un movimiento manual</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TransactionForm />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="stats" className="mt-0">
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-6">
                            <YearSelector currentYear={statsYear} />
                            <MonthlyComparisonChart
                                data={yearlyStats}
                                title={`Resumen Anual ${statsYear}`}
                                description={`Comparativa mensual de ingresos, gastos e inversiones durante el año ${statsYear}`}
                            />
                        </div>

                        <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-2 bg-slate-50/50">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm">
                                <PieChart className="h-8 w-8 text-slate-400" />
                            </div>
                            <div>
                                <CardTitle className="text-sm">Más gráficos próximamente</CardTitle>
                                <CardDescription className="max-w-xs mx-auto text-xs">
                                    Estamos preparando visualizaciones de ahorro neto y tendencias de categorías.
                                </CardDescription>
                            </div>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
