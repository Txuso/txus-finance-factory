"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyStat } from "@/lib/data/dashboard"
import { formatCurrency } from "@/lib/utils"

interface MonthlyComparisonChartProps {
    data: MonthlyStat[]
    title?: string
    description?: string
}

export function MonthlyComparisonChart({ data, title = "Comparativa Mensual", description }: MonthlyComparisonChartProps) {
    return (
        <Card className="border-0 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg font-bold">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="pt-4">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12 }}
                                tickFormatter={(value) => `${value}€`}
                            />
                            <Tooltip
                                cursor={{ fill: '#F8FAFC' }}
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                formatter={(value: any) => [formatCurrency(Number(value)), '']}
                            />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                iconType="circle"
                                wrapperStyle={{ paddingBottom: '20px' }}
                            />
                            <Bar
                                dataKey="income"
                                name="Ingresos"
                                fill="#10B981"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                dataKey="expenses"
                                name="Gastos"
                                fill="#EF4444"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                dataKey="investments"
                                name="Inversiones"
                                fill="#3B82F6"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
