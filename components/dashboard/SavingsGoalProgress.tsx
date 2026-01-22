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
            <CardHeader className="py-2 px-3 pb-0">
                <CardTitle className="text-[9px] font-bold flex items-center gap-1.5 text-slate-400 uppercase tracking-tighter">
                    <Target className="h-3 w-3" />
                    Objetivo
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent leading-none">
                            {(currentPercentage * 100).toFixed(1)}%
                        </p>
                        <p className="text-[9px] text-muted-foreground font-medium">
                            Meta: {(targetPercentage * 100).toFixed(0)}%
                        </p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black",
                        isTargetMet
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                        {isTargetMet ? "OK" : "GO"}
                    </div>
                </div>

                <div className="space-y-1">
                    <Progress
                        value={progressValue}
                        className="h-1.5 bg-slate-200 dark:bg-slate-800"
                    />
                    <div className="flex justify-between text-[8px] font-bold text-muted-foreground/60 px-0.5 tracking-tighter">
                        <span>0%</span>
                        <span>meta: {((targetPercentage * 100)).toFixed(0)}%</span>
                        <span>{(Math.max(currentPercentage, targetPercentage) * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
