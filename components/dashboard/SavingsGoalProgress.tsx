"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrivacyBlur } from "@/components/layout/PrivacyBlur"

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
        <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <CardHeader className="py-2.5 px-4 pb-0">
                <CardTitle className="text-[10px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Target className="h-3 w-3" />
                    </div>
                    Objetivo Ahorro
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-black bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent leading-none tracking-tighter">
                            <PrivacyBlur>{(currentPercentage * 100).toFixed(1)}%</PrivacyBlur>
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-1">
                            Meta: {(targetPercentage * 100).toFixed(0)}%
                        </p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all shadow-sm",
                        isTargetMet
                            ? "bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none"
                            : "bg-amber-500 text-white shadow-amber-200 dark:shadow-none"
                    )}>
                        {isTargetMet ? "COMPLETO" : "EN CURSO"}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000 ease-out rounded-full",
                                isTargetMet ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground/40 px-0.5 tracking-tight uppercase">
                        <span>0%</span>
                        <span>meta: {((targetPercentage * 100)).toFixed(0)}%</span>
                        <span>{(Math.max(currentPercentage, targetPercentage) * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
