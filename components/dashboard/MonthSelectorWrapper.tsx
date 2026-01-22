"use client"

import { useRouter } from "next/navigation"
import { MonthSelector } from "./MonthSelector"
import { useEffect } from "react"
import { addMonths, subMonths } from "date-fns"

export function MonthSelectorWrapper({ initialDate }: { initialDate: Date }) {
    const router = useRouter()

    // Caching/Prefetching strategy: prefetch 2 months back and 2 forward
    useEffect(() => {
        const monthsToPrefetch = [
            subMonths(initialDate, 2),
            subMonths(initialDate, 1),
            addMonths(initialDate, 1),
            addMonths(initialDate, 2),
        ]

        monthsToPrefetch.forEach(date => {
            const m = date.getMonth() + 1
            const y = date.getFullYear()
            router.prefetch(`/dashboard?year=${y}&month=${m}`)
        })
    }, [initialDate, router])

    const handleMonthChange = (newDate: Date) => {
        const month = newDate.getMonth() + 1
        const year = newDate.getFullYear()
        router.push(`/dashboard?year=${year}&month=${month}`)
    }

    return (
        <MonthSelector
            currentDate={initialDate}
            onMonthChange={handleMonthChange}
        />
    )
}
