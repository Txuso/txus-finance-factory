"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface MonthSelectorProps {
    currentDate: Date
    onMonthChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
    const isCurrentMonth = format(currentDate, "MM yyyy") === format(new Date(), "MM yyyy");

    return (
        <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-1 rounded-full shadow-sm">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange(subMonths(currentDate, 1))}
                className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-all"
                title="Mes anterior"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="px-4 flex items-center gap-2">
                <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-200 min-w-[110px] text-center">
                    {format(currentDate, "MMMM yyyy", { locale: es })}
                </span>
                {!isCurrentMonth && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMonthChange(new Date())}
                        className="h-6 px-2 text-[10px] uppercase tracking-wider font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 rounded-full transition-all"
                    >
                        Hoy
                    </Button>
                )}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange(addMonths(currentDate, 1))}
                className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-all"
                title="Mes siguiente"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
