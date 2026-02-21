"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Transaccion, GastoRecurrente } from "@/lib/types/transaction"
import { TrendingDown, Trash2, Pencil, ChevronDown, ChevronUp, Plus, CalendarClock, CheckCircle2, PackageOpen } from "lucide-react"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TransactionForm } from "@/components/transactions/TransactionForm"
import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PrivacyBlur } from "@/components/layout/PrivacyBlur"

// --- 3.2 Category color map ---
const CATEGORY_COLORS: Record<string, string> = {
    "Supermercado": "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800",
    "Restaurantes": "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800",
    "Salud": "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800",
    "Transporte": "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-100 dark:border-yellow-800",
    "Farmacia": "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-100 dark:border-cyan-800",
    "Videojuegos": "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-800",
    "Ocio": "bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-100 dark:border-pink-800",
    "Ropa": "bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-100 dark:border-fuchsia-800",
    "Mascotas": "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-800",
    "Tecnología": "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800",
    "Suscripciones": "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-800",
    "Formación": "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-100 dark:border-teal-800",
    "Viajes": "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800",
    "Hogar": "bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-100 dark:border-lime-800",
    "Gasolina": "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800",
    "Otros": "bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
}

function getCategoryColor(cat: string | null): string {
    if (!cat) return CATEGORY_COLORS["Otros"];
    return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["Otros"];
}

interface ExpenseTablesProps {
    transactions: Transaccion[]
    recurringExpenses: GastoRecurrente[]
    variableAverage?: number
}

export function ExpenseTables({ transactions, recurringExpenses, variableAverage = 0 }: ExpenseTablesProps) {
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
            {/* --- 3.3 EMPTY STATE for months with NO data --- */}
            {transactions.length === 0 && recurringExpenses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-3xl mb-5 shadow-inner">
                        <PackageOpen className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-slate-700 dark:text-slate-200 mb-1">Sin datos este mes</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-6">
                        Aún no hay transacciones registradas. Importa tu extracto bancario para empezar.
                    </p>
                    <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">📄 Importar PDF</span>
                        <span className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">✏️ Añadir manual</span>
                    </div>
                </div>
            )}

            {/* Show tables only if there's something to show */}
            {(transactions.length > 0 || recurringExpenses.length > 0) && (<>

                {/* TABLA DE GASTOS FIJOS */}
                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-500">
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
                                                                    <div className="flex items-center gap-2">
                                                                        {def.definition.descripcion}
                                                                        {def.status === 'paid' ? (
                                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shrink-0">
                                                                                ✓ Pagado
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 shrink-0">
                                                                                ⏳ Pendiente
                                                                            </span>
                                                                        )}
                                                                    </div>
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
                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
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

                    {/* BANNER: PROGRESO GASTO VARIABLE VS MEDIA */}
                    {variableAverage > 0 && variableExpenses.length > 0 && (() => {
                        const pct = Math.min(200, (totalVariable / variableAverage) * 100);
                        const isOver = totalVariable > variableAverage;
                        const diff = Math.abs(totalVariable - variableAverage);
                        const barWidth = Math.min(100, pct);
                        return (
                            <div className="mx-4 mb-3">
                                <div className="px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Progreso vs media 3 meses</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOver
                                            ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {isOver ? `+${formatCurrency(diff)} sobre la media` : `${formatCurrency(diff)} bajo la media`}
                                        </span>
                                    </div>
                                    <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${pct > 120 ? 'bg-rose-500' : pct > 90 ? 'bg-amber-400' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${barWidth}%` }}
                                        />
                                        {/* Media marker */}
                                        <div className="absolute top-0 bottom-0 w-px bg-slate-400 dark:bg-slate-500" style={{ left: '100%', transform: 'translateX(-1px)' }} />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <PrivacyBlur><span className="text-[9px] text-muted-foreground">Actual: {formatCurrency(totalVariable)}</span></PrivacyBlur>
                                        <PrivacyBlur><span className="text-[9px] text-muted-foreground">Media: {formatCurrency(variableAverage)}</span></PrivacyBlur>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

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
                                                    {/* 3.6 Date with full date tooltip */}
                                                    <TableCell
                                                        className="py-2 text-muted-foreground text-xs sm:text-sm cursor-default"
                                                        title={format(new Date(t.fecha), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                                                    >
                                                        {format(new Date(t.fecha), 'dd/MM')}
                                                    </TableCell>
                                                    <TableCell className="py-2 font-medium text-xs sm:text-sm">{t.descripcion}</TableCell>
                                                    {/* 3.2 Color-coded category chip */}
                                                    <TableCell className="py-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${getCategoryColor(t.categoria)}`}>
                                                            {t.categoria}
                                                        </span>
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
                        <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
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
                <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
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
            </>)}
        </div>
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
                // 3.5 Delete with Popover confirmation
                <DeleteConfirmButton onConfirm={async () => {
                    const res = await deleteTransaction(transaction.id);
                    if (res.error) {
                        toast.error(res.error);
                    } else {
                        toast.success("Transacción eliminada");
                    }
                }} />
            ) : recurring && (
                <ExcludeConfirmButton onConfirm={async () => {
                    const res = await excludeRecurringExpense(recurring.id, new Date());
                    if (res.error) {
                        toast.error(res.error);
                    } else {
                        toast.success("Gasto omitido para este mes");
                    }
                }} />
            )}
        </div>
    )
}

// 3.5 Popover-based delete confirmation
function DeleteConfirmButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">¿Eliminar transacción?</p>
                <p className="text-xs text-muted-foreground mb-3">Esta acción no se puede deshacer.</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" size="sm" className="flex-1 text-xs" disabled={loading} onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); setOpen(false); }}>
                        {loading ? "…" : "Eliminar"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// 3.5 Popover-based exclude (recurring) confirmation
function ExcludeConfirmButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" title="Omitir solo este mes">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">¿Omitir este mes?</p>
                <p className="text-xs text-muted-foreground mb-3">Se excluirá solo para este mes. El gasto recurrente se mantendrá.</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" size="sm" className="flex-1 text-xs" disabled={loading} onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); setOpen(false); }}>
                        {loading ? "…" : "Omitir"}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
