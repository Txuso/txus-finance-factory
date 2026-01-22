"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 sm:space-y-8 animate-pulse">
            {/* KPIs Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-3xl border-none bg-slate-100/50 dark:bg-slate-800/50">
                        <CardHeader className="h-12" />
                        <CardContent className="h-16" />
                    </Card>
                ))}
            </div>

            {/* Tabs & Table Skeleton */}
            <div className="space-y-6">
                <div className="flex justify-center">
                    <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
                <Card className="rounded-3xl border-none shadow-md overflow-hidden">
                    <CardHeader className="h-16 bg-slate-50 dark:bg-slate-900/50" />
                    <CardContent className="p-0">
                        <div className="space-y-4 p-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/30 rounded-lg w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
