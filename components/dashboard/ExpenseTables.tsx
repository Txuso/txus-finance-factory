"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction"
import { TrendingDown, Trash2, Pencil, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTransaction, excludeRecurringExpense } from "@/app/actions/transaction"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
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
    const [isVariablesExpanded, setIsVariablesExpanded] = useState(false);
    const [isFixedExpanded, setIsFixedExpanded] = useState(false);
    const [isInvestmentsExpanded, setIsInvestmentsExpanded] = useState(false);
    const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);

    // 1. Identificar Gastos Variables (Excluyendo Inversiones)
    const variableExpenses = transactions.filter(t => t.tipo === 'Gasto variable' && t.categoria !== 'Inversión');

    // 2. Identificar Inversiones
    const investmentTransactions = transactions.filter(t => t.tipo === 'Inversión' || t.categoria === 'Inversión');

    // 3. Procesar Gastos Fijos
    const cleanDescription = (desc: string) => {
        return desc
            .replace(/\d{2}[/.-]\d{2}[/.-]\d{2,4}/g, '')
            .replace(/\b\d{2}[/.-]\d{2}\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase();
    };

    const fixedExpensesList = recurringExpenses.map(recurring => {
        const recurringClean = cleanDescription(recurring.descripcion);
        const match = transactions.find(t => {
            if (t.tipo !== 'Gasto fijo') return false;

            const tClean = cleanDescription(t.descripcion);
            const matchesName = tClean === recurringClean || tClean.includes(recurringClean) || recurringClean.includes(tClean);

            const matchesAmount = Math.abs(Math.abs(t.monto) - recurring.monto_estimado) < 50;

            return matchesName && matchesAmount;
        });

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

    // Calcular Totales
    const totalVariable = Math.abs(variableExpenses.reduce((sum, t) => sum + t.monto, 0));
    const totalInvestments = Math.abs(investmentTransactions.reduce((sum, t) => sum + t.monto, 0));

    // Para gastos fijos (Total Mes Teórico):
    const totalFixed = recurringExpenses.reduce((sum, item) => sum + item.monto_estimado, 0)
        + extraFixedExpenses.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    // 3. Ingresos
    const incomeTransactions = transactions.filter(t => t.tipo === 'Ingreso');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    return (
        <div className="space-y-6">
            {/* TABLA DE GASTOS FIJOS */}
            <Card className="border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-blue-500" />
                            Gastos Fijos
                            <QuickAddButton tipo="Gasto fijo" />
                        </span>
                        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(totalFixed)}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-4">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="py-2.5">Concepto</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Importe</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(() => {
                                    const allFixed = [
                                        ...fixedExpensesList.map(item => ({ type: 'definition', data: item })),
                                        ...extraFixedExpenses.map(t => ({ type: 'extra', data: t }))
                                    ];
                                    const displayedFixed = isFixedExpanded ? allFixed : allFixed.slice(0, 5);

                                    return (
                                        <>
                                            {displayedFixed.map((item) => {
                                                if (item.type === 'definition') {
                                                    const def = item.data as typeof fixedExpensesList[0];
                                                    return (
                                                        <TableRow key={`def-${def.definition.id}`}>
                                                            <TableCell className="py-2 font-medium text-slate-700 dark:text-slate-200">
                                                                {def.definition.descripcion}
                                                            </TableCell>
                                                            <TableCell className="py-2 text-xs text-muted-foreground italic">
                                                                {def.transaction?.descripcion || "-"}
                                                            </TableCell>
                                                            <TableCell className="py-2 text-right">
                                                                {def.transaction ? (
                                                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                                                        {formatCurrency(Math.abs(def.transaction.monto))}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                                                                        {formatCurrency(def.definition.monto_estimado)}
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-2">
                                                                <TransactionActionsInner transaction={def.transaction} recurring={def.definition} />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                } else {
                                                    const t = item.data as typeof extraFixedExpenses[0];
                                                    return (
                                                        <TableRow key={`extra-${t.id}`} className="bg-slate-50/50">
                                                            <TableCell className="py-2 font-medium text-slate-600 italic">{t.descripcion}</TableCell>
                                                            <TableCell className="py-2 text-xs text-muted-foreground font-medium">Gasto Extra</TableCell>
                                                            <TableCell className="py-2 text-right font-bold">{formatCurrency(Math.abs(t.monto))}</TableCell>
                                                            <TableCell className="py-2">
                                                                <TransactionActionsInner transaction={t} />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                            })}

                                            {allFixed.length > 5 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center p-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setIsFixedExpanded(!isFixedExpanded)}
                                                            className="w-full text-muted-foreground hover:text-foreground text-xs"
                                                        >
                                                            {isFixedExpanded ? (
                                                                <span className="flex items-center gap-2 justify-center">Ver menos <ChevronUp className="h-4 w-4" /></span>
                                                            ) : (
                                                                <span className="flex items-center gap-2 justify-center">Ver {allFixed.length - 5} más <ChevronDown className="h-4 w-4" /></span>
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    );
                                })()}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* TABLA DE GASTOS VARIABLES */}
            <Card className="border-l-4 border-l-rose-500 shadow-md">
                <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-rose-500" />
                            Gastos Variables
                            <QuickAddButton tipo="Gasto variable" />
                        </span>
                        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(totalVariable)}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-4">
                    <div className="overflow-x-auto">
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
                                            <TableRow key={t.id}>
                                                <TableCell className="py-2 text-muted-foreground text-xs sm:text-sm">
                                                    {format(new Date(t.fecha), 'dd/MM')}
                                                </TableCell>
                                                <TableCell className="py-2 font-medium text-xs sm:text-sm">{t.descripcion}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                                                        {t.categoria}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-right font-bold text-rose-600 text-xs sm:text-sm">
                                                    {formatCurrency(Math.abs(t.monto))}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <TransactionActionsInner transaction={t} />
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
                                                        className="w-full text-muted-foreground hover:text-foreground text-xs"
                                                    >
                                                        {isVariablesExpanded ? (
                                                            <span className="flex items-center gap-2 justify-center">Ver menos <ChevronUp className="h-4 w-4" /></span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 justify-center">Ver {variableExpenses.length - 5} más <ChevronDown className="h-4 w-4" /></span>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* TABLA DE INVERSIONES */}
            {
                investmentTransactions.length > 0 && (
                    <Card className="border-l-4 border-l-blue-400 shadow-md">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <TrendingDown className="h-5 w-5 text-blue-400" />
                                    Inversiones / Ahorro activo
                                    <QuickAddButton tipo="Inversión" />
                                </span>
                                <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                                    {formatCurrency(totalInvestments)}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 sm:p-4">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[100px]">Fecha</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right">Monto</TableHead>
                                            <TableHead className="w-[100px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(isInvestmentsExpanded ? investmentTransactions : investmentTransactions.slice(0, 5)).map((t) => (
                                            <TableRow key={t.id} className="bg-blue-50/10">
                                                <TableCell className="py-2 text-muted-foreground text-xs sm:text-sm">
                                                    {format(new Date(t.fecha), 'dd/MM')}
                                                </TableCell>
                                                <TableCell className="py-2 font-medium text-xs sm:text-sm">{t.descripcion}</TableCell>
                                                <TableCell className="py-2 text-right font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                                                    {formatCurrency(Math.abs(t.monto))}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <TransactionActionsInner transaction={t} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {investmentTransactions.length > 5 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center p-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsInvestmentsExpanded(!isInvestmentsExpanded)}
                                                        className="w-full text-muted-foreground hover:text-foreground text-xs"
                                                    >
                                                        {isInvestmentsExpanded ? (
                                                            <span className="flex items-center gap-2 justify-center">Ver menos <ChevronUp className="h-4 w-4" /></span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 justify-center">Ver {investmentTransactions.length - 5} más <ChevronDown className="h-4 w-4" /></span>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* TABLA DE INGRESOS */}
            <Card className="border-l-4 border-l-emerald-500 shadow-md">
                <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-emerald-500 rotate-180" />
                            Ingresos
                            <QuickAddButton tipo="Ingreso" />
                        </span>
                        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
                            {formatCurrency(totalIncome)}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 sm:p-4">
                    <div className="overflow-x-auto">
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
                                    <>
                                        {(isIncomeExpanded ? incomeTransactions : incomeTransactions.slice(0, 5)).map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="py-2 text-muted-foreground text-xs sm:text-sm">
                                                    {format(new Date(t.fecha), 'dd/MM')}
                                                </TableCell>
                                                <TableCell className="py-2 font-medium text-xs sm:text-sm">{t.descripcion}</TableCell>
                                                <TableCell className="py-2">
                                                    <Badge variant="outline" className="text-[10px] sm:text-xs border-emerald-200 text-emerald-700 bg-emerald-50">{t.categoria}</Badge>
                                                </TableCell>
                                                <TableCell className="py-2 text-right font-bold text-emerald-600 text-xs sm:text-sm">
                                                    {formatCurrency(Math.abs(t.monto))}
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <TransactionActionsInner transaction={t} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {incomeTransactions.length > 5 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center p-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setIsIncomeExpanded(!isIncomeExpanded)}
                                                        className="w-full text-muted-foreground hover:text-foreground text-xs"
                                                    >
                                                        {isIncomeExpanded ? (
                                                            <span className="flex items-center gap-2 justify-center">Ver menos <ChevronUp className="h-4 w-4" /></span>
                                                        ) : (
                                                            <span className="flex items-center gap-2 justify-center">Ver {incomeTransactions.length - 5} más <ChevronDown className="h-4 w-4" /></span>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}

// Botón de creación rápida por tipo
function QuickAddButton({ tipo }: { tipo: 'Gasto fijo' | 'Gasto variable' | 'Inversión' | 'Ingreso' }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all hover:scale-110 active:scale-95 ml-1"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Nueva Transacción: {tipo}</DialogTitle>
                    <DialogDescription>
                        Añade un nuevo {tipo} manualmente a tu registro.
                    </DialogDescription>
                </DialogHeader>
                <TransactionForm
                    initialData={{ tipo } as any}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    );
}

// Componente de acciones reutilizable para Filas (Fuera de ExpenseTables para evitar remounts)
function TransactionActionsInner({ transaction, recurring }: { transaction?: Transaccion; recurring?: GastoRecurrente }) {
    const [open, setOpen] = useState(false);

    // Adaptar transaccion a TransactionFormValues o usar el recurring como base
    const initialData = transaction
        ? {
            id: transaction.id,
            descripcion: transaction.descripcion,
            monto: Math.abs(transaction.monto),
            fecha: new Date(transaction.fecha),
            categoria: transaction.categoria,
            tipo: transaction.tipo,
            metodo_pago: transaction.metodo_pago,
            es_automatico: transaction.es_automatico,
            notas: transaction.notas,
            meses_aplicacion: (transaction as any).meses_aplicacion || recurring?.meses_aplicacion
        }
        : recurring
            ? {
                descripcion: recurring.descripcion,
                monto: Math.abs(recurring.monto_estimado),
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
                        initialData={initialData as any}
                        onSuccess={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {transaction ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                        if (confirm("¿Estás seguro de que quieres eliminar esta transacción?")) {
                            const res = await deleteTransaction(transaction.id);
                            if (res.error) {
                                toast.error(res.error);
                            } else {
                                toast.success("Transacción eliminada");
                            }
                        }
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            ) : recurring && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    onClick={async () => {
                        if (confirm("¿Quieres omitir este gasto solo para este mes?")) {
                            const res = await excludeRecurringExpense(recurring.id, new Date());
                            if (res.error) {
                                toast.error(res.error);
                            } else {
                                toast.success("Gasto omitido para este mes");
                            }
                        }
                    }}
                    title="Omitir solo este mes"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
