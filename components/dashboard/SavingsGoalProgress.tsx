"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface SavingsGoalProgressProps {
    currentSavings: number
    totalIncome: number
    targetPercentage: number
}

export function SavingsGoalProgress({ currentSavings, totalIncome, targetPercentage }: SavingsGoalProgressProps) {
    const currentPercentage = totalIncome > 0 ? (currentSavings / totalIncome) : 0;
    const progressValue = Math.min(100, Math.max(0, (currentPercentage / targetPercentage) * 100));

    const isTargetMet = currentPercentage >= targetPercentage;

    return (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                    <Target className="h-4 w-4" />
                    Objetivo de Ahorro
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                            {(currentPercentage * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                            Actual vs {(targetPercentage * 100).toFixed(0)}% objetivo
                        </p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                        isTargetMet
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                        <TrendingUp className="h-3 w-3" />
                        {isTargetMet ? "OBJETIVO CUMPLIDO" : "EN PROGRESO"}
                    </div>
                </div>

                <div className="space-y-2">
                    <Progress
                        value={progressValue}
                        className="h-3 bg-slate-200 dark:bg-slate-800"
                    // Custom style for the progress color
                    />
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-0.5">
                        <span>0%</span>
                        <span>{((targetPercentage * 100)).toFixed(0)}% (META)</span>
                        <span>{(Math.max(currentPercentage, targetPercentage) * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </CardContent>

            {/* Visual accent bar at the bottom */}
            <div className={cn(
                "h-1.5 w-full",
                isTargetMet ? "bg-emerald-500" : "bg-amber-500"
            )} />
        </Card>
    )
}
