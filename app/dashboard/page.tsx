import { Suspense } from "react"
import { getDashboardData, getYearlyStats, getCategoryStats } from "@/lib/data/dashboard"
import { createClient } from "@/lib/supabase/server"
import { ExpenseTables } from "@/components/dashboard/ExpenseTables"
import { MonthlyComparisonChart } from "@/components/dashboard/MonthlyComparisonChart"
import { AddTransactionFAB } from "@/components/transactions/AddTransactionFAB"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthSelectorWrapper } from "@/components/dashboard/MonthSelectorWrapper"
import { YearSelector } from "@/components/dashboard/YearSelector"
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton"

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
import { DashboardTabsWrapper } from "@/components/dashboard/DashboardTabsWrapper"

interface DashboardPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const params = await searchParams;
    const searchKey = JSON.stringify(params);

    const now = new Date();
    let currentDate = now;

    if (params.year && params.month) {
        const year = parseInt(params.year as string);
        const month = parseInt(params.month as string);
        if (!isNaN(year) && !isNaN(month)) {
            currentDate = new Date(year, month - 1, 1);
        }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || "Josu";
    const firstName = userName.split(' ')[0];
    const hour = now.getHours();
    let greeting = "¡Hola";
    if (hour >= 6 && hour < 12) greeting = "Buenos días";
    else if (hour >= 12 && hour < 20) greeting = "Buenas tardes";
    else greeting = "Buenas noches";

    return (
        <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col items-center space-y-4 relative px-4 text-center transition-all duration-300">
                {/* Saludo y Nombre */}
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 italic tracking-wide animate-in fade-in slide-in-from-top-2 duration-700">
                    {greeting}, {firstName}
                </p>

                {/* Logo y Título Principal */}
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 group">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-xl transition-transform group-hover:scale-105 duration-300"
                    />
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tighter bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent italic leading-tight">
                        Txus Finance Factory
                    </h1>
                </div>

                {/* Botones de Acción - Mejorados para Mobile */}
                <div className="flex items-center justify-center gap-2 w-full max-w-xs sm:absolute sm:top-0 sm:right-0 sm:w-auto mt-2 sm:mt-0">
                    <Link href="/settings">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 hover:text-primary transition-all active:scale-95 shadow-sm border border-slate-200/50 dark:border-slate-800/50"
                        >
                            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Button>
                    </Link>
                    <ImportDialog />
                </div>

                <div className="w-full max-w-md pt-2">
                    <MonthSelectorWrapper initialDate={currentDate} />
                </div>
            </div>

            <Suspense key={searchKey} fallback={<DashboardSkeleton />}>
                <DashboardContent searchParams={params} firstName={firstName} currentDate={currentDate} />
            </Suspense>
        </div>
    )
}

async function DashboardContent({
    searchParams,
    firstName,
    currentDate
}: {
    searchParams: any,
    firstName: string,
    currentDate: Date
}) {
    const params = searchParams;
    const now = new Date();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) return null;

    // Estadísticas independientes
    const statsYear = params.statsYear ? parseInt(params.statsYear as string) : now.getFullYear();

    // Parallelize pre-render data fetching
    const [yearlyStats, categoryStats, dashboardData] = await Promise.all([
        getYearlyStats(statsYear, userId),
        getCategoryStats(statsYear, userId),
        getDashboardData(currentDate, userId)
    ]);

    const { transactions, recurringExpenses, config } = dashboardData;

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
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col items-center space-y-2 text-center">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mt-2">
                    {/* Mensaje Motivacional de Objetivo */}
                    <div className={cn(
                        "flex items-center justify-center p-4 rounded-2xl border transition-all duration-500 shadow-xl relative overflow-hidden group",
                        isObjectiveMet
                            ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 text-emerald-800 dark:text-emerald-300 shadow-emerald-500/5"
                            : "bg-gradient-to-br from-slate-500/10 via-slate-500/5 to-transparent border-slate-200/50 text-slate-700 dark:text-slate-300"
                    )}>
                        {isObjectiveMet && (
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-2xl animate-pulse" />
                        )}
                        <p className="text-sm sm:text-base font-medium leading-tight relative z-10">
                            {isObjectiveMet ? (
                                <>
                                    <span className="font-black text-xl sm:text-2xl block italic tracking-tighter uppercase mb-1 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-emerald-200 bg-clip-text text-transparent">
                                        ¡BRUTAL {firstName.toUpperCase()}! 🚀
                                    </span>
                                    Tu ahorro es del <span className="font-black text-emerald-600 dark:text-emerald-400">{(savingsPercentage * 100).toFixed(1)}%</span>. Meta superada con creces.
                                </>
                            ) : (
                                <>
                                    <span className="font-black text-xl sm:text-2xl block uppercase tracking-tighter mb-1 text-slate-400">
                                        VAMOS {firstName.toUpperCase()} 💪
                                    </span>
                                    Enfoque total. Te faltan <span className="font-black text-rose-500 dark:text-rose-400">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(savingsNeeded)}</span> para el objetivo.
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

            <DashboardTabsWrapper defaultValue="summary">
                <div className="flex items-center justify-center mb-6">
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
                            <PieChart className="h-4 w-4" />
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
            </DashboardTabsWrapper>
            <AddTransactionFAB />
        </div>
    )
}
