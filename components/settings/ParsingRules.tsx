"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIAS, TIPOS_TRANSACCION, Categoria, TipoTransaccion } from "@/lib/types/transaction"
import { createRule, deleteRule, getRules } from "@/app/actions/rules"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Plus, Trash2, Wand2, ChevronDown, ChevronUp } from "lucide-react"
import { LearningRule } from "@/lib/types/rules"

export function ParsingRules() {
    const [rules, setRules] = useState<LearningRule[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)

    // New rule state
    const [patron, setPatron] = useState("")
    const [categoria, setCategoria] = useState<Categoria | "">("")
    const [tipo, setTipo] = useState<TipoTransaccion | "">("")
    const [expanded, setExpanded] = useState(false)

    const visibleRules = expanded ? rules : rules.slice(0, 5)


    useEffect(() => {
        loadRules()
    }, [])

    async function loadRules() {
        setLoading(true)
        const res = await getRules()
        if (res.error) {
            toast.error(res.error)
        } else {
            setRules(res.data || [])
        }
        setLoading(false)
    }

    async function handleAddRule(e: React.FormEvent) {
        e.preventDefault()
        if (!patron || !categoria || !tipo) {
            toast.error("Rellena todos los campos")
            return
        }

        setAdding(true)
        const res = await createRule({
            patron_descripcion: patron,
            categoria_destino: categoria as Categoria,
            tipo_destino: tipo as TipoTransaccion
        })

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Regla creada correctamente")
            setPatron("")
            setCategoria("")
            setTipo("")
            loadRules()
        }
        setAdding(false)
    }

    async function handleDeleteRule(id: string) {
        const res = await deleteRule(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Regla eliminada")
            loadRules()
        }
    }

    return (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent">
                <div className="flex items-center gap-3">
                    <Wand2 className="h-5 w-5 text-purple-500" />
                    <CardTitle>Reglas de Parseo Automatizado</CardTitle>
                </div>
                <CardDescription>
                    Define reglas personalizadas para clasificar automáticamente tus transacciones al importar PDFs.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                {/* Formulario de Añadir */}
                <form onSubmit={handleAddRule} className="space-y-4 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="patron" className="text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">Si contiene...</Label>
                            <Input
                                id="patron"
                                placeholder="Ej: RESTAURANTE PACO"
                                value={patron}
                                onChange={(e) => setPatron(e.target.value)}
                                className="bg-white/80 dark:bg-slate-900/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="categoria" className="text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">Asignar Categoría</Label>
                            <Select value={categoria} onValueChange={(val) => setCategoria(val as Categoria)}>
                                <SelectTrigger className="bg-white/80 dark:bg-slate-900/50">
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIAS.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tipo" className="text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-100">Asignar Tipo</Label>
                            <Select value={tipo} onValueChange={(val) => setTipo(val as TipoTransaccion)}>
                                <SelectTrigger className="bg-white/80 dark:bg-slate-900/50">
                                    <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS_TRANSACCION.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={adding}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Añadir Regla
                    </Button>
                </form>

                {/* Lista de Reglas */}
                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Reglas Activas ({rules.length})</h3>
                    {loading ? (
                        <div className="flex justify-center py-4 text-purple-500">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : rules.length === 0 ? (
                        <p className="text-sm text-center py-6 text-muted-foreground italic bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            No tienes reglas definidas.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {visibleRules.map((rule) => (
                                <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all group">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full mr-4 items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-muted-foreground">Si contiene</span>
                                            <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={rule.patron_descripcion}>
                                                "{rule.patron_descripcion}"
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-muted-foreground">Categoría</span>
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{rule.categoria_destino}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase text-muted-foreground">Tipo</span>
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{rule.tipo_destino}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {rules.length > 5 && (
                                <Button
                                    variant="ghost"
                                    className="w-full text-xs text-muted-foreground hover:text-purple-600 mt-2"
                                    onClick={() => setExpanded(!expanded)}
                                >
                                    {expanded ? (
                                        <span className="flex items-center gap-1">
                                            Ver menos <ChevronUp className="h-3 w-3" />
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            Ver más ({rules.length - 5} reglas más) <ChevronDown className="h-3 w-3" />
                                        </span>
                                    )}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
