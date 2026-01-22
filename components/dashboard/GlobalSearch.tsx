"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Calendar, Tag, ArrowRight, Pencil, TrendingUp, TrendingDown, PieChart, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchTransactions } from "@/app/actions/transaction";
import { Transaccion } from "@/lib/types/transaction";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PrivacyBlur } from "@/components/layout/PrivacyBlur";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { TransactionForm } from "@/components/transactions/TransactionForm"

interface GlobalSearchProps {
    localTransactions?: Transaccion[];
}

export function GlobalSearch({ localTransactions }: GlobalSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Transaccion[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaccion | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (query.length < 2) {
                setResults([]);
                setError(null);
                return;
            }

            if (localTransactions) {
                // Frontend search (Current month)
                setLoading(true);
                const search = query.toLowerCase().trim();
                const filtered = localTransactions.filter(t =>
                    t.descripcion.toLowerCase().includes(search) ||
                    t.categoria.toLowerCase().includes(search) ||
                    String(Math.abs(t.monto)).includes(search)
                );
                setResults(filtered.slice(0, 20));
                setLoading(false);
            } else {
                // Backend search (Historical)
                const timer = setTimeout(async () => {
                    setLoading(true);
                    setError(null);
                    try {
                        const res = await searchTransactions(query);
                        if (res.error) {
                            setError(res.error);
                            setResults([]);
                        } else if (res.data) {
                            setResults(res.data);
                        }
                    } catch (err) {
                        setError("Error de conexión");
                    }
                    setLoading(false);
                }, 300);
                return () => clearTimeout(timer);
            }
        };

        performSearch();
    }, [query, localTransactions]);

    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(true);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const handleEditClick = (t: Transaccion) => {
        setSelectedTransaction(t);
        setIsEditDialogOpen(true);
        setIsOpen(false); // Close search dropdown
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto" ref={containerRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <Input
                    type="text"
                    placeholder="Buscar transacciones... (Cmd+K)"
                    className="pl-10 pr-10 h-10 sm:h-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50 rounded-2xl focus-visible:ring-primary/20 transition-all shadow-sm"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults([]); setError(null); }}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            {isOpen && (query.length >= 2 || loading) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-2 space-y-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span className="text-sm font-medium">Buscando...</span>
                            </div>
                        ) : error ? (
                            <div className="py-8 text-center text-rose-500 p-4">
                                <p className="text-xs font-bold uppercase tracking-widest mb-1">Error en la búsqueda</p>
                                <p className="text-sm opacity-80">{error}</p>
                            </div>
                        ) : results.length > 0 ? (
                            results.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => handleEditClick(t)}
                                    className="p-3 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer group flex items-center justify-between border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50 hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg shrink-0 transition-colors",
                                            t.tipo === 'Ingreso' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 group-hover:bg-emerald-100/80" :
                                                t.tipo === 'Inversión' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 group-hover:bg-blue-100/80" :
                                                    t.tipo === 'Gasto fijo' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 group-hover:bg-indigo-100/80" :
                                                        "bg-rose-50 dark:bg-rose-900/20 text-rose-600 group-hover:bg-rose-100/80"
                                        )}>
                                            {t.tipo === 'Ingreso' && <TrendingUp className="h-4 w-4" />}
                                            {t.tipo === 'Inversión' && <PieChart className="h-4 w-4" />}
                                            {t.tipo === 'Gasto fijo' && <Wallet className="h-4 w-4" />}
                                            {t.tipo === 'Gasto variable' && <TrendingDown className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-primary transition-colors">{t.descripcion}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                    {format(new Date(t.fecha), 'dd MMM yyyy')}
                                                </span>
                                                <span className="text-muted-foreground/30">•</span>
                                                <Badge variant="outline" className="h-4 text-[9px] px-1 bg-slate-100 dark:bg-slate-800 border-none">
                                                    {t.categoria}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-sm font-black tracking-tight",
                                                t.tipo === 'Ingreso' ? "text-emerald-600" : "text-slate-900 dark:text-slate-100"
                                            )}>
                                                <PrivacyBlur>{formatCurrency(t.monto)}</PrivacyBlur>
                                            </p>
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                <Pencil className="h-2 w-2" /> Editar
                                            </span>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">
                                <p className="text-sm">No se encontraron transacciones</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dialog de Edición Centralizado */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-0 shadow-2xl sm:rounded-3xl flex flex-col">
                    {selectedTransaction && (
                        <>
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
                                        Editar Transacción
                                    </DialogTitle>
                                    <DialogDescription className="text-slate-400 text-xs font-medium uppercase tracking-widest opacity-70">
                                        {selectedTransaction.descripcion}
                                    </DialogDescription>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
                                <TransactionForm
                                    initialData={{
                                        ...selectedTransaction,
                                        monto: Math.abs(selectedTransaction.monto),
                                        fecha: new Date(selectedTransaction.fecha)
                                    } as any}
                                    onSuccess={() => setIsEditDialogOpen(false)}
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
