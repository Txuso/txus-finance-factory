import { TransactionForm } from "@/components/transactions/TransactionForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        TxusFinanceFactory
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Control de finanzas personales.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Nueva Transacción - Columna Izquierda (o arriba en móvil) */}
                <div className="lg:col-span-1">
                    <Card className="border-none shadow-xl bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
                        <CardHeader>
                            <CardTitle className="text-2xl text-primary">Nueva Transacción</CardTitle>
                            <CardDescription>Registra un nuevo movimiento manual</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TransactionForm />
                        </CardContent>
                    </Card>
                </div>

                {/* Resumen / Lista - Columna Derecha (espacio reservado por ahora) */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent shadow-none h-64 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <p>Aquí irán los gráficos y el listado de transacciones</p>
                            <p className="text-sm">(Fase 3 y Lista de Transacciones en progreso)</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
