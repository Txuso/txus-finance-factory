"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction"
import { CheckCircle2, AlertCircle, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ExpenseTablesProps {
    transactions: Transaccion[]
    recurringExpenses: GastoRecurrente[]
}

export function ExpenseTables({ transactions, recurringExpenses }: ExpenseTablesProps) {
    // 1. Identificar Gastos Variables (Tipo = 'Gasto variable')
    const variableExpenses = transactions.filter(t => t.tipo === 'Gasto variable');

    // 2. Procesar Gastos Fijos (Matching con Recurrentes)
    // Estrategia: Iteramos sobre los gastos recurrentes definidos (tabla de configuración)
    // y buscamos si existe alguna transacción de tipo 'Gasto fijo' que coincida (por categoría o nombre aproximado).
    // Nota: Esto es una simplificación. Idealmente deberíamos tener un ID de enlace, pero por ahora usamos matching simple.

    const fixedExpensesList = recurringExpenses.map(recurring => {
        // Buscamos una transacción que coincida
        // Criterio: Misma categoría y descripcion similar (o simplemente asumimos que si hay un gasto fijo de esa categoría es ese)
        // Para ser más precisos en V1, buscaremos coincidencias parciales de nombre O misma categoría y monto similar.
        const match = transactions.find(t =>
            t.tipo === 'Gasto fijo' &&
            (t.descripcion.toLowerCase().includes(recurring.descripcion.toLowerCase()) ||
                (t.categoria === recurring.categoria && Math.abs(t.monto - recurring.monto_estimado) < 50)) // Margen de 50€
        );

        return {
            definition: recurring,
            transaction: match, // Puede ser undefined si no se ha pagado aún
            status: match ? 'paid' : 'pending'
        };
    });

    // También debemos mostrar los gastos fijos que NO estaban previstos en recurrentes (gasto fijo extra)
    const matchedTransactionIds = fixedExpensesList.map(item => item.transaction?.id).filter(Boolean);
    const extraFixedExpenses = transactions.filter(t =>
        t.tipo === 'Gasto fijo' &&
        !matchedTransactionIds.includes(t.id)
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    return (
        <div className="space-y-8">
            {/* TABLA DE GASTOS FIJOS */}
            <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-blue-500" />
                            Gastos Fijos
                        </span>
                        <span className="text-sm font-normal text-muted-foreground">
                            Recurrentes y Facturas
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead>Día Estimado</TableHead>
                                <TableHead>Monto Previo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Pagado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fixedExpensesList.map((item) => (
                                <TableRow key={item.definition.id}>
                                    <TableCell className="font-medium">{item.definition.descripcion}</TableCell>
                                    <TableCell>{item.definition.dia_cobro_estimado}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatCurrency(item.definition.monto_estimado)}</TableCell>
                                    <TableCell>
                                        {item.status === 'paid' ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Pagado
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1">
                                                <AlertCircle className="h-3 w-3" /> Pendiente
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {item.transaction ? formatCurrency(item.transaction.monto) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Gastos Fijos Extra no planificados */}
                            {extraFixedExpenses.map((t) => (
                                <TableRow key={t.id} className="bg-slate-50/50">
                                    <TableCell className="font-medium text-slate-600">{t.descripcion} (Extra)</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-muted-foreground">-</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">Extra</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(t.monto)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* TABLA DE GASTOS VARIABLES */}
            <Card className="border-l-4 border-l-rose-500 shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-rose-500" />
                            Gastos Variables
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Fecha</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-right">Monto</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {variableExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                        No hay gastos variables este mes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                variableExpenses.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(t.fecha).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="font-medium">{t.descripcion}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{t.categoria}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-rose-600">
                                            {formatCurrency(Math.abs(t.monto))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
