"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryStat } from "@/lib/data/dashboard"
import { formatCurrency } from "@/lib/utils"
import { usePrivacy } from "@/components/providers/PrivacyProvider"

interface CategoryPieChartProps {
    data: CategoryStat[]
    title?: string
    description?: string
}

const COLORS = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#a855f7", // Purple
    "#ef4444", // rose
]

const CustomTooltip = ({ active, payload }: any) => {
    const { isPrivate } = usePrivacy();

    if (active && payload && payload.length) {
        const { name, value, payload: dataPayload } = payload[0];
        const color = dataPayload?.fill || payload[0].color || 'inherit';
        return (
            <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-lg border-0">
                <p className="text-sm font-medium" style={{ color }}>
                    {name}: <span className="font-bold">{isPrivate ? "****" : formatCurrency(value)}</span>
                </p>
            </div>
        );
    }
    return null;
};

export function CategoryPieChart({ data, title = "Distribución por Categoría", description }: CategoryPieChartProps) {
    const { isPrivate } = usePrivacy();
    const total = data.reduce((sum, item) => sum + item.value, 0)

    if (data.length === 0) {
        return (
            <Card className="border-0 shadow-md bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="flex-1 flex items-center justify-center text-muted-foreground p-12">
                    No hay datos de gastos para este periodo.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-0 shadow-md bg-white dark:bg-slate-900 overflow-hidden h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 pt-0">
                <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data as any[]}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                                labelLine={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                layout="horizontal"
                                wrapperStyle={{ paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    {data.slice(0, 5).map((item, index) => {
                        const color = COLORS[index % COLORS.length];
                        return (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="font-medium" style={{ color }}>{item.name}</span>
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {isPrivate ? "**.*%" : `${((item.value / total) * 100).toFixed(1)}%`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
