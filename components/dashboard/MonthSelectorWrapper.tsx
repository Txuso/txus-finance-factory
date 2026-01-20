"use client"

import { useRouter } from "next/navigation"
import { MonthSelector } from "./MonthSelector"

export function MonthSelectorWrapper({ initialDate }: { initialDate: Date }) {
    const router = useRouter()

    const handleMonthChange = (newDate: Date) => {
        // Construir URL params
        // newDate object. getMonth is 0-indexed (0=Jan), but URL usually user friendly 1-12
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
