"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { PrivacyBlur } from "@/components/layout/PrivacyBlur"

interface SavingsGoalProgressProps {
    currentSavings: number
    totalIncome: number
    targetPercentage: number
    projectedIncome?: number   // avg from last months, used when salary hasn't arrived
    isProjected?: boolean       // true when using projectedIncome (no real salary yet)
}

export function SavingsGoalProgress({
    currentSavings,
    totalIncome,
    targetPercentage,
    projectedIncome = 0,
    isProjected = false,
}: SavingsGoalProgressProps) {
    // page.tsx passes already-computed effectiveSavings as currentSavings
    // and the correct projected/real income as projectedIncome/totalIncome
    const effectiveIncome = isProjected ? projectedIncome : totalIncome;
    const hasIncome = effectiveIncome > 0;

    const currentPercentage = hasIncome ? (currentSavings / effectiveIncome) : 0;
    const isNegative = currentPercentage < 0;
    const displayPct = Math.max(0, currentPercentage);
    const progressValue = Math.min(100, Math.max(0, (displayPct / targetPercentage) * 100));
    const isTargetMet = hasIncome && !isProjected && currentPercentage >= targetPercentage;

    // Badge state
    const badgeLabel = !hasIncome
        ? "SIN INGRESO"
        : isProjected
            ? "NÓMINA PEND."
            : isNegative
                ? "NEGATIVO"
                : isTargetMet
                    ? "COMPLETO"
                    : "EN CURSO";

    const badgeClass = !hasIncome
        ? "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
        : isProjected
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            : isNegative
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                : isTargetMet
                    ? "bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none"
                    : "bg-amber-500 text-white shadow-amber-200 dark:shadow-none";

    const barClass = !hasIncome
        ? "bg-slate-300 dark:bg-slate-600"
        : isProjected
            ? "bg-amber-400 dark:bg-amber-500"
            : isNegative
                ? "bg-rose-300 dark:bg-rose-700"
                : isTargetMet
                    ? "bg-emerald-500"
                    : "bg-amber-500";

    return (
        <Card className={cn(
            "border shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]",
            isProjected
                ? "border-amber-200/60 dark:border-amber-800/40"
                : "border-slate-200/50 dark:border-slate-800/50"
        )}>
            <CardHeader className="py-2.5 px-4 pb-0">
                <CardTitle className="text-[10px] font-bold flex items-center gap-2 text-slate-400 uppercase tracking-[0.2em]">
                    <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Target className="h-3 w-3" />
                    </div>
                    Objetivo Ahorro
                    {isProjected && (
                        <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 normal-case tracking-normal ml-auto">
                            estimado
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-black bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent leading-none tracking-tighter">
                            <PrivacyBlur>
                                {!hasIncome ? '—' : isNegative ? '0%' : `${(currentPercentage * 100).toFixed(1)}%`}
                            </PrivacyBlur>
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-1">
                            Meta: {(targetPercentage * 100).toFixed(0)}%
                        </p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all shadow-sm",
                        badgeClass
                    )}>
                        {badgeLabel}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className={cn(
                        "relative h-2 w-full rounded-full overflow-hidden border",
                        isProjected
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/40"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-800/50"
                    )}>
                        <div
                            className={cn("h-full transition-all duration-1000 ease-out rounded-full", barClass,
                                isProjected && "opacity-70"
                            )}
                            style={{ width: `${progressValue}%` }}
                        />
                        {/* Dashed overlay when projected to signal uncertainty */}
                        {isProjected && progressValue > 0 && (
                            <div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                    width: `${progressValue}%`,
                                    backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(255,255,255,0.5) 6px, rgba(255,255,255,0.5) 8px)"
                                }}
                            />
                        )}
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground/40 px-0.5 tracking-tight uppercase">
                        <span>0%</span>
                        <span>meta: {((targetPercentage * 100)).toFixed(0)}%</span>
                        <span>{(Math.max(displayPct, targetPercentage) * 100).toFixed(0)}%</span>
                    </div>
                </div>

                {isProjected && (
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 font-medium leading-tight">
                        Basado en tu nómina estimada de{" "}
                        <PrivacyBlur>
                            <span className="font-black">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(projectedIncome)}
                            </span>
                        </PrivacyBlur>
                        . A medida que añades gastos, este % baja.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
