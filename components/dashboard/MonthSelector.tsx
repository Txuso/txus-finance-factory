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
    return (
        <Card className="p-2 flex items-center justify-between bg-background/50 backdrop-blur-sm sticky top-4 z-10 w-full max-w-sm mx-auto shadow-sm">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange(subMonths(currentDate, 1))}
                title="Mes anterior"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-lg font-semibold capitalize min-w-[140px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: es })}
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onMonthChange(addMonths(currentDate, 1))}
                title="Mes siguiente"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </Card>
    )
}
