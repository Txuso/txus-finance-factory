"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction"
import { CheckCircle2, AlertCircle, TrendingDown, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTransaction } from "@/app/actions/transaction"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { useState } from "react"
import { format } from "date-fns"

interface ExpenseTablesProps {
    transactions: Transaccion[]
    recurringExpenses: GastoRecurrente[]
}

export function ExpenseTables({ transactions, recurringExpenses }: ExpenseTablesProps) {
    // 1. Identificar Gastos Variables
    const variableExpenses = transactions.filter(t => t.tipo === 'Gasto variable');

    // 2. Procesar Gastos Fijos
    const fixedExpensesList = recurringExpenses.map(recurring => {
        const match = transactions.find(t =>
            t.tipo === 'Gasto fijo' &&
            (t.descripcion.toLowerCase().includes(recurring.descripcion.toLowerCase()) ||
                (t.categoria === recurring.categoria && Math.abs(t.monto - recurring.monto_estimado) < 50))
        );

        return {
            definition: recurring,
            transaction: match,
            status: match ? 'paid' : 'pending'
        };
    });

    const matchedTransactionIds = fixedExpensesList.map(item => item.transaction?.id).filter(Boolean);
    const extraFixedExpenses = transactions.filter(t =>
        t.tipo === 'Gasto fijo' &&
        !matchedTransactionIds.includes(t.id)
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
            const res = await deleteTransaction(id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Transacción eliminada");
            }
        }
    }

    // Componente de acciones reutilizable para Filas
    const TransactionActions = ({ transaction }: { transaction: Transaccion }) => {
        const [open, setOpen] = useState(false);

        // Adaptar transaccion a TransactionFormValues
        // TransactionForm espera { id, descripcion, monto, ... }
        const initialData = {
            ...transaction,
            fecha: new Date(transaction.fecha), // Asegurar date object
        }

        return (
            <div className="flex items-center justify-end gap-2">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Editar Transacción</DialogTitle>
                            <DialogDescription>Modifica los datos de la transacción.</DialogDescription>
                        </DialogHeader>
                        {/* Pasamos key=transaction.updated_at para forzar re-render si cambia, aunque open lo maneja */}
                        <TransactionForm
                            initialData={initialData}
                            onSuccess={() => setOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(transaction.id)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        )
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
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead>Día Est.</TableHead>
                                <TableHead className="text-right">Pagado</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fixedExpensesList.map((item) => (
                                <TableRow key={item.definition.id}>
                                    <TableCell className="font-medium">
                                        <div>{item.definition.descripcion}</div>
                                        <div className="text-xs text-muted-foreground">{item.transaction?.descripcion}</div>
                                    </TableCell>
                                    <TableCell>{item.definition.dia_cobro_estimado}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {item.transaction ? formatCurrency(item.transaction.monto) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {item.transaction && <TransactionActions transaction={item.transaction} />}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Gastos Fijos Extra */}
                            {extraFixedExpenses.map((t) => (
                                <TableRow key={t.id} className="bg-slate-50/50">
                                    <TableCell className="font-medium text-slate-600">{t.descripcion} (Extra)</TableCell>
                                    <TableCell>-</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(t.monto)}</TableCell>
                                    <TableCell>
                                        <TransactionActions transaction={t} />
                                    </TableCell>
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
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {variableExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                        No hay gastos variables este mes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                variableExpenses.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(t.fecha), 'dd/MM')}
                                        </TableCell>
                                        <TableCell className="font-medium">{t.descripcion}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{t.categoria}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-rose-600">
                                            {formatCurrency(Math.abs(t.monto))}
                                        </TableCell>
                                        <TableCell>
                                            <TransactionActions transaction={t} />
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
