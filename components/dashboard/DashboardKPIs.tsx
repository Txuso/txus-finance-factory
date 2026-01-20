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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* CARD PRINCIPAL - AHORRO */}
            <Card className="md:col-span-2 overflow-hidden border-0 shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Ahorro del Mes</p>
                            <h2 className="text-3xl font-bold mt-1">
                                {formatCurrency(Math.abs(savings))}
                            </h2>
                            <p className="text-indigo-100/80 text-xs mt-4 font-medium uppercase">
                                {isPositive
                                    ? "¡JOSU, ESTE MES HAS AHORRADO! 🚀"
                                    : "JOSU, ESTE MES HAS GASTADO MÁS DE LO QUE HAS GANADO ⚠️"}
                            </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            {isPositive ? <TrendingUp className="h-6 w-6 text-white" /> : <TrendingDown className="h-6 w-6 text-white" />}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* INGRESOS */}
            <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Ingresos</p>
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
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Gastos</p>
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
            <div className="md:col-start-4">
                <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Inversión</p>
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
        </div>
    )
}
