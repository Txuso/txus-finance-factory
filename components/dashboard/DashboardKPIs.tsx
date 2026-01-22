"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DashboardKPIsProps {
    totalIncome: number
    totalExpenses: number
    totalInvestments: number
}

export function DashboardKPIs({ totalIncome, totalExpenses, totalInvestments }: DashboardKPIsProps) {
    const savings = totalIncome - totalExpenses
    const isPositive = savings >= 0

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* CARD PRINCIPAL - AHORRO (MES CENTRAL) */}
            <Card className={`overflow-hidden border-0 shadow-2xl transition-all hover:shadow-[0_20px_50px_rgba(79,70,229,0.2)] ${isPositive
                ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700"
                : "bg-gradient-to-br from-orange-600 via-rose-600 to-red-700"
                } text-white relative group`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-colors" />
                <CardContent className="p-4 sm:p-5 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`${isPositive ? "text-indigo-100/70" : "text-orange-100/70"} text-[10px] font-bold uppercase tracking-[0.2em]`}>
                                Ahorro Neto Mes
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-black mt-1 tracking-tighter">
                                {formatCurrency(savings)}
                            </h2>
                        </div>
                        <div className="p-2 sm:p-2.5 bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                            {isPositive ? <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" /> : <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* INGRESOS */}
            <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all hover:scale-105 active:scale-98 cursor-pointer overflow-hidden group">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em]">Ingresos</p>
                            <h3 className="text-xl sm:text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400 tracking-tight">
                                {formatCurrency(totalIncome)}
                            </h3>
                        </div>
                        <div className="p-2 sm:p-2.5 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* GASTOS */}
            <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all hover:scale-105 active:scale-98 cursor-pointer overflow-hidden group">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em]">Gastos Totales</p>
                            <h3 className="text-xl sm:text-2xl font-black mt-1 text-rose-600 dark:text-rose-400 tracking-tight">
                                {formatCurrency(totalExpenses)}
                            </h3>
                        </div>
                        <div className="p-2 sm:p-2.5 bg-rose-50/50 dark:bg-rose-900/20 rounded-2xl border border-rose-100/50 dark:border-rose-800/30 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 transition-colors">
                            <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* INVERSIONES */}
            <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all hover:scale-105 active:scale-98 cursor-pointer overflow-hidden group">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-[0.2em]">Inversión</p>
                            <h3 className="text-xl sm:text-2xl font-black mt-1 text-blue-600 dark:text-blue-400 tracking-tight">
                                {formatCurrency(totalInvestments)}
                            </h3>
                        </div>
                        <div className="p-2 sm:p-2.5 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                            <PieChart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
