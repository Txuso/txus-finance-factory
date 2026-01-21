import { Suspense } from "react"
import { getDashboardData, getYearlyStats, getCategoryStats } from "@/lib/data/dashboard"
import { ExpenseTables } from "@/components/dashboard/ExpenseTables"
import { MonthlyComparisonChart } from "@/components/dashboard/MonthlyComparisonChart"
import { AddTransactionFAB } from "@/components/transactions/AddTransactionFAB"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthSelectorWrapper } from "@/components/dashboard/MonthSelectorWrapper"
import { YearSelector } from "@/components/dashboard/YearSelector"

import { ImportDialog } from "@/components/transactions/ImportDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs"
import { PieChart, TrendingUp, Wallet, Settings as SettingsIcon } from "lucide-react"
import Link from "next/link"
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart"
import { SavingsGoalProgress } from "@/components/dashboard/SavingsGoalProgress"
import { SavingsGrowthChart } from "@/components/dashboard/SavingsGrowthChart"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
    const categoryStats = await getCategoryStats(statsYear);

    const { transactions, recurringExpenses, config } = await getDashboardData(currentDate);

    // Cálculos para KPIs (Lógica centralizada en el servidor)
    const incomeTransactions = transactions.filter(t => t.tipo === 'Ingreso');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    const variableExpenses = transactions.filter(t => t.tipo === 'Gasto variable' && t.categoria !== 'Inversión');
    const totalVariable = Math.abs(variableExpenses
        .reduce((sum, t) => sum + t.monto, 0));

    // ... fixed expenses logic ...
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
        .filter(t => t.tipo === 'Inversión' || t.categoria === 'Inversión')
        .reduce((sum, t) => sum + t.monto, 0));

    // Lógica de objetivo de ahorro
    const actualSavings = totalIncome - (totalFixed + totalVariable);
    const savingsPercentage = totalIncome > 0 ? (actualSavings / totalIncome) : 0;
    const targetPercentage = config?.objetivo_ahorro_porcentaje || 0.20;
    const isObjectiveMet = savingsPercentage >= targetPercentage;
    const savingsNeeded = (totalIncome * targetPercentage) - actualSavings;

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col items-center space-y-4 relative px-4 text-center">
                <div className="flex items-center justify-between w-full sm:justify-center relative gap-2 sm:gap-4">
                    <div className="sm:hidden w-10" />
                    <div className="flex items-center gap-3 sm:gap-4">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-10 h-10 sm:w-14 sm:h-14 object-contain filter drop-shadow-md"
                        />
                        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent italic">
                            Txus Finance Factory
                        </h1>
                    </div>

                    <div className="flex items-center gap-1 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2">
                        <Link href="/settings">
                            <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all hover:scale-110 active:scale-95">
                                <SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                            </Button>
                        </Link>
                        <ImportDialog />
                    </div>
                </div>

                <MonthSelectorWrapper initialDate={currentDate} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mt-4">
                    {/* Mensaje Motivacional de Objetivo */}
                    <div className={cn(
                        "flex items-center justify-center p-6 rounded-3xl border transition-all duration-500 shadow-sm",
                        isObjectiveMet
                            ? "bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-300"
                            : "bg-slate-50/50 border-slate-200 text-slate-600 dark:bg-slate-900/20 dark:border-slate-800"
                    )}>
                        <p className="text-sm font-medium leading-relaxed">
                            {isObjectiveMet ? (
                                <>
                                    <span className="font-extrabold text-lg block mb-1 italic">¡BRUTAL JOSU! 🚀</span>
                                    Estás ahorrando un <span className="underline decoration-wavy underline-offset-4 decoration-emerald-400">{(savingsPercentage * 100).toFixed(1)}%</span>.
                                    Objetivo superado.
                                </>
                            ) : (
                                <>
                                    <span className="font-bold block mb-1 uppercase tracking-tight">VAMOS JOSU 💪</span>
                                    Te faltan <span className="font-bold text-rose-500">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(savingsNeeded)}</span> para llegar a tu objetivo.
                                </>
                            )}
                        </p>
                    </div>

                    <SavingsGoalProgress
                        currentSavings={actualSavings}
                        totalIncome={totalIncome}
                        targetPercentage={targetPercentage}
                    />
                </div>
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
                            className="rounded-lg px-6 py-2.5 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all hover:scale-105 active:scale-95 cursor-pointer font-medium text-slate-500"
                        >
                            <Wallet className="h-4 w-4" />
                            Resumen Mensual
                        </TabsTrigger>
                        <TabsTrigger
                            value="stats"
                            className="rounded-lg px-6 py-2.5 flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all hover:scale-105 active:scale-95 cursor-pointer font-medium text-slate-500"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Estadísticas
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="summary" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* TABLAS DE GASTOS (Ancho completo) */}
                        <div className="lg:col-span-3 space-y-6">
                            <ExpenseTables
                                transactions={transactions}
                                recurringExpenses={recurringExpenses}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="stats" className="mt-0">
                    <div className="space-y-6">
                        <YearSelector currentYear={statsYear} />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <MonthlyComparisonChart
                                    data={yearlyStats}
                                    title={`Comparativa Mensual ${statsYear}`}
                                    description={`Ingresos vs Gastos vs Inversión en ${statsYear}`}
                                />

                                <SavingsGrowthChart
                                    data={yearlyStats}
                                    title="Crecimiento del Ahorro"
                                    description="Relación entre ahorro mensual, gastos y ahorro acumulado"
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <CategoryPieChart
                                    data={categoryStats}
                                    title={`Distribución de Gastos ${statsYear}`}
                                    description={`Reparto por categorías en el año ${statsYear}`}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            <AddTransactionFAB />
        </div>
    )
}
