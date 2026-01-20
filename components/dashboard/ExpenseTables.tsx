"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction"
import { CheckCircle2, AlertCircle, TrendingDown, Trash2, Pencil, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTransaction, excludeRecurringExpense } from "@/app/actions/transaction"
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
import { format, startOfMonth } from "date-fns"

interface ExpenseTablesProps {
    transactions: Transaccion[]
    recurringExpenses: GastoRecurrente[]
}

export function ExpenseTables({ transactions, recurringExpenses }: ExpenseTablesProps) {
    const [isVariablesExpanded, setIsVariablesExpanded] = useState(false);

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

    // Calucular Totales
    // Sumamos los valores RAW (negativos = gasto, positivos = ingreso/abono)
    // Luego invertimos el signo para mostrar el "Gasto Total" como positivo
    // EXCLUIMOS las inversiones del total de gastos variables
    const totalVariableRaw = variableExpenses
        .filter(t => t.categoria !== 'Inversión' && t.tipo !== 'Inversión')
        .reduce((sum, t) => sum + t.monto, 0);
    const totalVariable = Math.abs(totalVariableRaw);

    // Para gastos fijos (Total Mes Teórico):
    // 1. Sumamos SIEMPRE el 'monto_estimado' de los gastos recurrentes (independiente de si se pagaron o no).
    // 2. Sumamos los gastos extra (reales) que hayan ocurrido.
    const totalFixed = recurringExpenses.reduce((sum, item) => sum + item.monto_estimado, 0)
        + extraFixedExpenses.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    // 3. Ingresos
    const incomeTransactions = transactions.filter(t => t.tipo === 'Ingreso');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.monto), 0);

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

    const handleExclude = async (recurringId: string) => {
        if (confirm("¿Quieres omitir este gasto solo para este mes?")) {
            // Necesitamos la fecha actual del dashboard. Tendremos que pasarla como prop o usar un contexto.
            // Por ahora asumimos la fecha actual de la UI.
            const res = await excludeRecurringExpense(recurringId, new Date()); // temporal
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Gasto omitido para este mes");
            }
        }
    }

    // Componente de acciones reutilizable para Filas
    const TransactionActions = ({ transaction, recurring, currentMonth }: { transaction?: Transaccion; recurring?: GastoRecurrente; currentMonth?: Date }) => {
        const [open, setOpen] = useState(false);

        // Adaptar transaccion a TransactionFormValues o usar el recurring como base
        const initialData = transaction
            ? {
                ...transaction,
                monto: Math.abs(transaction.monto),
                fecha: new Date(transaction.fecha),
                meses_aplicacion: recurring?.meses_aplicacion // Pass template applicability if available
            }
            : recurring
                ? {
                    descripcion: recurring.descripcion,
                    monto: Math.abs(recurring.monto_estimado), // Gastos se muestran en positivo en el form
                    tipo: 'Gasto fijo' as const,
                    categoria: recurring.categoria,
                    fecha: new Date(),
                    metodo_pago: 'Tarjeta' as const,
                    es_automatico: false,
                    meses_aplicacion: recurring.meses_aplicacion,
                }
                : undefined;

        if (!initialData) return null;

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
                            <DialogTitle>{transaction ? "Editar Transacción" : "Registrar Pago Fijo"}</DialogTitle>
                            <DialogDescription>
                                {transaction
                                    ? "Modifica los datos de la transacción."
                                    : "Define los detalles finales para registrar este gasto fijo."}
                            </DialogDescription>
                        </DialogHeader>
                        <TransactionForm
                            initialData={initialData}
                            onSuccess={() => setOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                {transaction ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(transaction.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                ) : recurring && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => handleExclude(recurring.id)}
                        title="Omitir solo este mes"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
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
                        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(totalFixed)}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Concepto</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="text-right">Importe</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fixedExpensesList.map((item) => (
                                <TableRow key={item.definition.id}>
                                    <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                                        {item.definition.descripcion}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground italic">
                                        {item.transaction?.descripcion || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.transaction ? (
                                            <span className="font-bold text-slate-900 dark:text-slate-100">
                                                {formatCurrency(Math.abs(item.transaction.monto))}
                                            </span>
                                        ) : (
                                            <span className="text-slate-900 dark:text-slate-100 font-medium">
                                                {formatCurrency(item.definition.monto_estimado)}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <TransactionActions transaction={item.transaction} recurring={item.definition} />
                                    </TableCell>
                                </TableRow>
                            ))}

                            {/* Gastos Fijos Extra */}
                            {extraFixedExpenses.map((t) => (
                                <TableRow key={t.id} className="bg-slate-50/50">
                                    <TableCell className="font-medium text-slate-600 italic">{t.descripcion}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground font-medium">Gasto Extra</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(Math.abs(t.monto))}</TableCell>
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
                        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(totalVariable)}
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
                                <>
                                    {(isVariablesExpanded ? variableExpenses : variableExpenses.slice(0, 5)).map((t) => (
                                        <TableRow key={t.id} className={t.categoria === 'Inversión' ? "bg-blue-50/30" : ""}>
                                            <TableCell className="text-muted-foreground">
                                                {format(new Date(t.fecha), 'dd/MM')}
                                            </TableCell>
                                            <TableCell className="font-medium">{t.descripcion}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={t.categoria === 'Inversión' ? "border-blue-200 text-blue-700 bg-blue-50" : ""}>
                                                    {t.categoria}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-bold ${t.categoria === 'Inversión' ? "text-blue-600" : "text-rose-600"}`}>
                                                {formatCurrency(Math.abs(t.monto))}
                                            </TableCell>
                                            <TableCell>
                                                <TransactionActions transaction={t} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {variableExpenses.length > 5 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center p-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsVariablesExpanded(!isVariablesExpanded)}
                                                    className="w-full text-muted-foreground hover:text-foreground"
                                                >
                                                    {isVariablesExpanded ? (
                                                        <span className="flex items-center gap-2">Ver menos <ChevronUp className="h-4 w-4" /></span>
                                                    ) : (
                                                        <span className="flex items-center gap-2">Ver {variableExpenses.length - 5} más <ChevronDown className="h-4 w-4" /></span>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card >

            {/* TABLA DE INGRESOS */}
            < Card className="border-l-4 border-l-emerald-500 shadow-md" >
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-emerald-500 rotate-180" />
                            Ingresos
                        </span>
                        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(totalIncome)}
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
                            {incomeTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                        No hay ingresos este mes.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                incomeTransactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(t.fecha), 'dd/MM')}
                                        </TableCell>
                                        <TableCell className="font-medium">{t.descripcion}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">{t.categoria}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-emerald-600">
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
            </Card >
        </div >
    )
}
