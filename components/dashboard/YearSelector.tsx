"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"

interface YearSelectorProps {
    currentYear: number
}

export function YearSelector({ currentYear }: YearSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleYearChange = (year: number) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("statsYear", year.toString())
        router.push(`?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-2 rounded-2xl shadow-sm mb-6 max-w-xs mx-auto">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleYearChange(currentYear - 1)}
                className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900"
            >
                <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2 px-4">
                <Calendar className="h-4 w-4 text-blue-500 opacity-70" />
                <span className="text-lg font-bold tracking-tight text-slate-700 dark:text-slate-200">
                    {currentYear}
                </span>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleYearChange(currentYear + 1)}
                className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900"
            >
                <ChevronRight className="h-5 w-5" />
            </Button>
        </div>
    )
}
