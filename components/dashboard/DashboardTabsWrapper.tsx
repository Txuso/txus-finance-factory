"use client"

import { Tabs } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"

interface DashboardTabsWrapperProps {
    children: React.ReactNode
    defaultValue: string
}

export function DashboardTabsWrapper({ children, defaultValue }: DashboardTabsWrapperProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Read current tab from URL, fallback to defaultValue
    const currentTab = searchParams.get("tab") || defaultValue

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("tab", value)
        // Preserve current scroll position and update URL
        router.push(`?${params.toString()}`, { scroll: false })
    }

    return (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            {children}
        </Tabs>
    )
}
