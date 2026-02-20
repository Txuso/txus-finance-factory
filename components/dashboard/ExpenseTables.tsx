"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction"
import { TrendingDown, Trash2, Pencil, ChevronDown, ChevronUp, Plus, CalendarClock, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTransaction, excludeRecurringExpense } from "@/app/actions/transaction"
import { toast } from "sonner"
import { cn, cleanDescription } from "@/lib/utils"
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
import { PrivacyBlur } from "@/components/layout/PrivacyBlur"

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

    const fixedExpensesList = recurringExpenses.map(recurring => {
        const recurringClean = cleanDescription(recurring.descripcion);
        const match = transactions.find(t => {
            if (t.tipo !== 'Gasto fijo') return false;

            // 1. Primary match: recurring_id
            if (t.recurring_id === recurring.id) return true;

            // 2. Fallback match (legacy)
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

    // Sort ALWAYS by dia_cobro_estimado (ascending) — regardless of creation/insertion order
    fixedExpensesList.sort((a, b) => (a.definition.dia_cobro_estimado ?? 31) - (b.definition.dia_cobro_estimado ?? 31));

    const matchedTransactionIds = fixedExpensesList.map(item => item.transaction?.id).filter(Boolean);
    const extraFixedExpenses = transactions.filter(t =>
        t.tipo === 'Gasto fijo' &&
        !matchedTransactionIds.includes(t.id)
    );

    // Calcular Totales (Usando lógica unificada: Importe pagado si existe, si no Importe estimado)
    const totalVariable = Math.abs(variableExpenses.reduce((sum, t) => sum + t.monto, 0));
    const totalInvestments = Math.abs(investmentTransactions.reduce((sum, t) => sum + t.monto, 0));

    // Para gastos fijos (Total Real/Estimado):
    const totalFixed = fixedExpensesList.reduce((sum, item) => {
        return sum + (item.transaction ? Math.abs(item.transaction.monto) : item.definition.monto_estimado);
    }, 0) + extraFixedExpenses.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    // 3. Ingresos
    const incomeTransactions = transactions.filter(t => t.tipo === 'Ingreso');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.monto), 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    // --- Próximo Cobro Logic ---
    const todayDay = new Date().getDate();
    const pendingItems = fixedExpensesList.filter(item => item.status === 'pending');
    // Sort pending by dia_cobro_estimado to find the closest upcoming
    const upcomingPending = pendingItems.find(item => (item.definition.dia_cobro_estimado ?? 0) >= todayDay)
        ?? pendingItems[0]; // fallback: wrap-around to first of next month
    const daysUntil = upcomingPending
        ? (upcomingPending.definition.dia_cobro_estimado ?? 0) - todayDay
        : null;

    return (
        <div className="space-y-6">
            {/* TABLA DE GASTOS FIJOS */}
            <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                {/* Side accent glow */}
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />

                <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <TrendingDown className="h-4 w-4 text-blue-500" />
                            </div>
                            <span className="font-bold tracking-tight">Gastos Fijos</span>
                            <QuickAddButton tipo="Gasto fijo" />
                        </span>
                        <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                            <PrivacyBlur>{formatCurrency(totalFixed)}</PrivacyBlur>
                        </span>
                    </CardTitle>
                </CardHeader>

                {/* BANNER: PRÓXIMO COBRO */}
                {fixedExpensesList.length > 0 && (
                    <div className="mx-4 mb-3">
                        {upcomingPending ? (
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
                                    <CalendarClock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500/70 dark:text-blue-400/70">Próximo cobro</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{upcomingPending.definition.descripcion}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-muted-foreground">Día {upcomingPending.definition.dia_cobro_estimado}</p>
                                    <PrivacyBlur>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(upcomingPending.definition.monto_estimado)}</p>
                                    </PrivacyBlur>
                                </div>
                                <Badge className={`shrink-0 text-[10px] px-2 py-0.5 ${daysUntil === 0
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200'
                                        : daysUntil !== null && daysUntil > 0
                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200'
                                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200'
                                    }`}>
                                    {daysUntil === 0 ? 'Hoy' : daysUntil !== null && daysUntil > 0 ? `en ${daysUntil} días` : 'Mes prox.'}
                                </Badge>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Todos los gastos fijos del mes cobrados</p>
                            </div>
                        )}
                    </div>
                )}

                <CardContent className="p-0 sm:p-4">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="py-2.5">Concepto</TableHead>
                                    <TableHead className="w-[80px] text-center">Día cobro</TableHead>
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
                                                            <TableCell className="py-2 text-center">
                                                                {def.definition.dia_cobro_estimado ? (
                                                                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 mx-auto">
                                                                        {def.definition.dia_cobro_estimado}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-2 text-xs text-muted-foreground italic">
                                                                {def.transaction?.notas || def.transaction?.descripcion || "-"}
                                                            </TableCell>
                                                            <TableCell className="py-2 text-right">
                                                                {def.transaction ? (
                                                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                                                        <PrivacyBlur>{formatCurrency(Math.abs(def.transaction.monto))}</PrivacyBlur>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                                                                        <PrivacyBlur>{formatCurrency(def.definition.monto_estimado)}</PrivacyBlur>
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
                                                            <TableCell className="py-2 text-center"><span className="text-muted-foreground text-xs">—</span></TableCell>
                                                            <TableCell className="py-2 text-xs text-muted-foreground italic">{t.notas || "Gasto Extra"}</TableCell>
                                                            <TableCell className="py-2 text-right font-bold"><PrivacyBlur>{formatCurrency(Math.abs(t.monto))}</PrivacyBlur></TableCell>
                                                            <TableCell className="py-2">
                                                                <TransactionActionsInner transaction={t} />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                }
                                            })}

                                            {allFixed.length > 5 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center p-2">
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
            <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                {/* Side accent glow */}
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />

                <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                <TrendingDown className="h-4 w-4 text-rose-500" />
                            </div>
                            <span className="font-bold tracking-tight">Gastos Variables</span>
                            <QuickAddButton tipo="Gasto variable" />
                        </span>
                        <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                            <PrivacyBlur>{formatCurrency(totalVariable)}</PrivacyBlur>
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
                                                    <PrivacyBlur>{formatCurrency(Math.abs(t.monto))}</PrivacyBlur>
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
                    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                        {/* Side accent glow */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]" />

                        <CardHeader className="pb-1">
                            <CardTitle className="text-lg flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <TrendingDown className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <span className="font-bold tracking-tight">Inversiones / Ahorro activo</span>
                                    <QuickAddButton tipo="Inversión" />
                                </span>
                                <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                                    <PrivacyBlur>{formatCurrency(totalInvestments)}</PrivacyBlur>
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
                                                    <PrivacyBlur>{formatCurrency(Math.abs(t.monto))}</PrivacyBlur>
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
            <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                {/* Side accent glow */}
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />

                <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                <TrendingDown className="h-4 w-4 text-emerald-500 rotate-180" />
                            </div>
                            <span className="font-bold tracking-tight">Ingresos</span>
                            <QuickAddButton tipo="Ingreso" />
                        </span>
                        <span className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
                            <PrivacyBlur>{formatCurrency(totalIncome)}</PrivacyBlur>
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
                                                    <PrivacyBlur>{formatCurrency(Math.abs(t.monto))}</PrivacyBlur>
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
            <DialogContent
                className="sm:max-w-[550px] p-0 overflow-hidden border-0 shadow-2xl sm:rounded-3xl flex flex-col"
                closeButtonClassName="text-white hover:text-white/80"
            >
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white flex items-center gap-4 shrink-0">
                    <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-8 h-8 object-contain"
                        />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black italic tracking-tighter uppercase">
                            Nueva: {tipo === 'Ingreso' ? 'Ingreso' : tipo}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs font-medium uppercase tracking-widest opacity-70">
                            Txus Finance Factory
                        </DialogDescription>
                    </div>
                </div>
                <div className="p-6 md:p-8">
                    <TransactionForm
                        initialData={{ tipo } as any}
                        onSuccess={() => setOpen(false)}
                    />
                </div>
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
            meses_aplicacion: (transaction as any).meses_aplicacion || recurring?.meses_aplicacion,
            recurring_id: recurring?.id
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
                recurring_id: recurring.id
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
