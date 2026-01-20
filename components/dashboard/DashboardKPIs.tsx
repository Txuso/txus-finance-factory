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
            {/* CARD PRINCIPAL - AHORRO */}
            <Card className={`overflow-hidden border-0 shadow-md transition-colors ${isPositive
                ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                : "bg-gradient-to-br from-orange-500 to-rose-600"
                } text-white`}>
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`${isPositive ? "text-indigo-100" : "text-orange-100"} text-[10px] font-medium uppercase tracking-wider`}>
                                Ahorro Mes
                            </p>
                            <h2 className="text-2xl font-bold mt-1">
                                {formatCurrency(savings)}
                            </h2>
                        </div>
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            {isPositive ? <TrendingUp className="h-5 w-5 text-white" /> : <TrendingDown className="h-5 w-5 text-white" />}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* INGRESOS */}
            <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Ingresos</p>
                            <h3 className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalIncome)}
                            </h3>
                        </div>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <Wallet className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* GASTOS */}
            <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Gastos</p>
                            <h3 className="text-xl font-bold mt-1 text-rose-600 dark:text-rose-400">
                                {formatCurrency(totalExpenses)}
                            </h3>
                        </div>
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                            <TrendingDown className="h-5 w-5 text-rose-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* INVERSIONES (INFORMATIVO) */}
            <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Inversión</p>
                            <h3 className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                                {formatCurrency(totalInvestments)}
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <PieChart className="h-5 w-5 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
