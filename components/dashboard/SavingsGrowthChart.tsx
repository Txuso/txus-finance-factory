"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Area,
    AreaChart,
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend
} from "recharts"
import { MonthlyStat } from "@/lib/data/dashboard"

interface SavingsGrowthChartProps {
    data: MonthlyStat[]
    title?: string
    description?: string
}

export function SavingsGrowthChart({ data, title, description }: SavingsGrowthChartProps) {
    // Process data to include savings and accumulated savings
    let accumulated = 0;
    const chartData = data.map(item => {
        const monthlySavings = item.income - item.expenses;
        accumulated += monthlySavings;
        return {
            ...item,
            monthlySavings,
            accumulatedSavings: accumulated,
        }
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {title || "Evolución Ahorro vs Gastos"}
                </CardTitle>
                <CardDescription>
                    {description || "Progreso de ahorro mensual y acumulado"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                        >
                            <defs>
                                <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12 }}
                            />
                            <YAxis
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748B', fontSize: 12 }}
                                tickFormatter={formatCurrency}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#3b82f6', fontSize: 12 }}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value: any) => {
                                    const numValue = typeof value === 'number' ? value : 0;
                                    return [formatCurrency(numValue), ""];
                                }}
                            />
                            <Legend verticalAlign="top" height={36} />

                            <Bar
                                yAxisId="left"
                                dataKey="expenses"
                                name="Gastos"
                                fill="#f43f5e"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                                opacity={0.6}
                            />

                            <Bar
                                yAxisId="left"
                                dataKey="monthlySavings"
                                name="Ahorro Mensual"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            />

                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey="accumulatedSavings"
                                name="Ahorro Acumulado"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorAcc)"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
