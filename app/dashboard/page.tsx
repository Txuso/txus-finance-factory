import { Suspense } from "react"
import { getDashboardData } from "@/lib/data/dashboard"
import { ExpenseTables } from "@/components/dashboard/ExpenseTables"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthSelectorWrapper } from "@/components/dashboard/MonthSelectorWrapper"

interface DashboardPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }> // Next.js 15+ async searchParams
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const params = await searchParams; // Await params in modern Next.js

    // 1. Resolver fecha seleccionada
    const now = new Date();

    // Si no hay params, usamos el mes actual
    let currentDate = now;

    if (params.year && params.month) {
        const year = parseInt(params.year as string);
        const month = parseInt(params.month as string); // 0-11 logic depends on how we send it. Let's assume URL sends 1-12
        if (!isNaN(year) && !isNaN(month)) {
            // Month in Date constructor is 0-indexed (0=Jan, 11=Dec)
            // We expect URL to be 1-indexed (1=Jan)
            currentDate = new Date(year, month - 1, 1);
        }
    }

    // 2. Fetch Data (Server Side)
    const { transactions, recurringExpenses } = await getDashboardData(currentDate);

    // 3. Render
    return (
        <div className="container mx-auto py-10 space-y-8">
            {/* HEADER & NAV */}
            <div className="flex flex-col items-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Txus Finance
                </h1>
                <MonthSelectorWrapper initialDate={currentDate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUMNA IZQUIERDA: GASTOS (2/3 ancho) */}
                <div className="lg:col-span-2 space-y-6">
                    <ExpenseTables
                        transactions={transactions}
                        recurringExpenses={recurringExpenses}
                    />
                </div>

                {/* COLUMNA DERECHA: FORMULARIO (1/3 ancho) */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                        <CardHeader>
                            <CardTitle>Nueva Transacción</CardTitle>
                            <CardDescription>Registra un movimiento manual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransactionForm />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
