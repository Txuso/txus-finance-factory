"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface MonthSelectorProps {
    currentDate: Date
    onMonthChange: (date: Date) => void
}

export function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
    const months = React.useMemo(() => {
        const result = [];
        for (let i = -6; i <= 6; i++) {
            result.push(addMonths(currentDate, i));
        }
        return result;
    }, [currentDate]);

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-1 rounded-full shadow-lg max-w-full overflow-x-auto no-scrollbar justify-center">
                {months.map((date, index) => {
                    const isSelected = index === 6;
                    const today = isToday(date);

                    return (
                        <Button
                            key={date.toISOString()}
                            variant="ghost"
                            size="sm"
                            onClick={() => onMonthChange(date)}
                            className={cn(
                                "h-11 px-3 rounded-full transition-all duration-300 flex flex-col items-center justify-center gap-0 relative shrink-0",
                                isSelected
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 min-w-[110px] z-10"
                                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50 min-w-[75px]",
                                // Responsive visibility dynamic
                                !isSelected && Math.abs(index - 6) >= 1 && "hidden sm:flex",
                                !isSelected && Math.abs(index - 6) >= 2 && "hidden md:flex",
                                !isSelected && Math.abs(index - 6) >= 3 && "hidden lg:flex",
                                !isSelected && Math.abs(index - 6) >= 4 && "hidden xl:flex",
                                !isSelected && Math.abs(index - 6) >= 5 && "hidden 2xl:flex"
                            )}
                        >
                            <span className={cn(
                                "text-[10px] uppercase tracking-tighter font-bold opacity-70",
                                isSelected ? "text-blue-100" : "text-slate-400"
                            )}>
                                {format(date, "yyyy")}
                            </span>
                            <span className={cn(
                                "text-sm font-bold capitalize leading-none",
                                isSelected ? "text-white" : "text-slate-600 dark:text-slate-300"
                            )}>
                                {format(date, "MMM", { locale: es })}
                            </span>
                            {today && !isSelected && (
                                <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white dark:border-slate-900" />
                            )}
                        </Button>
                    );
                })}
            </div>

            {/* Mes anterior/siguiente para móviles (que solo ven el central) */}
            <div className="flex sm:hidden items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onMonthChange(subMonths(currentDate, 1))}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {!isToday(currentDate) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMonthChange(new Date())}
                        className="h-8 px-4 text-[10px] uppercase font-bold text-blue-500 rounded-full border border-blue-100 dark:border-blue-900/30"
                    >
                        Volver a Hoy
                    </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onMonthChange(addMonths(currentDate, 1))}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Botón Hoy para desktop si no estamos en el mes actual */}
            {!isToday(currentDate) && (
                <div className="hidden sm:block">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMonthChange(new Date())}
                        className="h-7 px-3 text-[10px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all border border-blue-100/50 dark:border-blue-900/20"
                    >
                        Volver al mes actual
                    </Button>
                </div>
            )}
        </div>
    )
}
