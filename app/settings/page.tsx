"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getConfig, updateConfig } from "@/app/actions/config"
import { getExportData } from "@/app/actions/transaction"
import { signOut } from "@/app/actions/auth"
import { toast } from "sonner"
import { Settings, Save, Wallet, Target, ArrowLeft, LogOut, FileDown } from "lucide-react"
import Link from "next/link"
import { ExportButtons } from "@/components/dashboard/ExportButtons"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Transaccion } from "@/lib/types/transaction"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState({
        objetivo_ahorro_porcentaje: 0.20,
        moneda: "€",
        fondo_emergencia_objetivo: 12000,
        fondo_emergencia_actual: 0
    })
    const [exportData, setExportData] = useState<{
        transactions: Transaccion[]
        monthLabel: string
        kpis: { income: number; expenses: number; investments: number; savings: number }
    } | null>(null)
    const [exportPeriod, setExportPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    })
    const [loadingExport, setLoadingExport] = useState(false)

    useEffect(() => {
        async function loadData() {
            const [configRes, exportRes] = await Promise.all([
                getConfig(),
                getExportData()
            ])

            if (configRes.error) toast.error(configRes.error)
            else if (configRes.data) {
                setConfig({
                    objetivo_ahorro_porcentaje: Number(configRes.data.objetivo_ahorro_porcentaje),
                    moneda: configRes.data.moneda,
                    fondo_emergencia_objetivo: Number(configRes.data.fondo_emergencia_objetivo || 12000),
                    fondo_emergencia_actual: Number(configRes.data.fondo_emergencia_actual || 0)
                })
            }

            if (exportRes.data) {
                setExportData(exportRes.data)
            }

            setLoading(false)
        }
        loadData()
    }, [])

    useEffect(() => {
        async function updateExportData() {
            setLoadingExport(true)
            const res = await getExportData(exportPeriod.month, exportPeriod.year)
            if (res.data) setExportData(res.data)
            setLoadingExport(false)
        }
        if (!loading) updateExportData()
    }, [exportPeriod, loading])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await updateConfig(config)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Configuración guardada correctamente")
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="container mx-auto py-20 flex justify-center">
                <div className="animate-pulse text-slate-400">Cargando ajustes...</div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Ajustes
                    </h1>
                    <p className="text-muted-foreground italic">Configura tu perfil financiero</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <Target className="h-5 w-5 text-blue-500" />
                            <CardTitle>Objetivo de Ahorro</CardTitle>
                        </div>
                        <CardDescription>
                            Define qué porcentaje de tus ingresos quieres ahorrar cada mes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="objetivo">Porcentaje de Ahorro (%)</Label>
                            <div className="relative">
                                <Input
                                    id="objetivo"
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={Math.round(config.objetivo_ahorro_porcentaje * 100)}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        objetivo_ahorro_porcentaje: Number(e.target.value) / 100
                                    })}
                                    className="bg-background/50"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                                * Recomendado: 20%. Esto se usará para mostrarte si has cumplido tu meta en el Dashboard.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-rose-500/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <Settings className="h-5 w-5 text-rose-500" />
                            <CardTitle>Fondo de Emergencia</CardTitle>
                        </div>
                        <CardDescription>
                            Configura tu colchón de seguridad financiera.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fondo_objetivo">Meta del Fondo</Label>
                                <div className="relative">
                                    <Input
                                        id="fondo_objetivo"
                                        type="number"
                                        value={config.fondo_emergencia_objetivo}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            fondo_emergencia_objetivo: Number(e.target.value)
                                        })}
                                        className="bg-background/50"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{config.moneda}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fondo_actual">Saldo Actual</Label>
                                <div className="relative">
                                    <Input
                                        id="fondo_actual"
                                        type="number"
                                        value={config.fondo_emergencia_actual}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            fondo_emergencia_actual: Number(e.target.value)
                                        })}
                                        className="bg-background/50"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{config.moneda}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            * El Fondo de Emergencia recomendado suele ser de 3 a 6 meses de gastos fijos.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-emerald-500" />
                            <CardTitle>Preferencia de Moneda</CardTitle>
                        </div>
                        <CardDescription>
                            Selecciona la moneda principal de la aplicación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="moneda">Símbolo de Moneda</Label>
                            <Input
                                id="moneda"
                                value={config.moneda}
                                onChange={(e) => setConfig({ ...config, moneda: e.target.value })}
                                placeholder="€, $, etc."
                                className="bg-background/50"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <FileDown className="h-5 w-5 text-amber-500" />
                            <CardTitle>Exportación de Datos</CardTitle>
                        </div>
                        <CardDescription>
                            Extrae tu información financiera en formatos profesionales para auditoría personal o análisis detallado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Mes a exportar</Label>
                                <Select
                                    value={exportPeriod.month.toString()}
                                    onValueChange={(val) => setExportPeriod({ ...exportPeriod, month: parseInt(val) })}
                                >
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder="Mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[
                                            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                                        ].map((m, i) => (
                                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Año</Label>
                                <Select
                                    value={exportPeriod.year.toString()}
                                    onValueChange={(val) => setExportPeriod({ ...exportPeriod, year: parseInt(val) })}
                                >
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder="Año" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map((y) => (
                                            <SelectItem key={y} value={y.toString()}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50">
                            <div className="space-y-1">
                                <p className="text-sm font-bold">Resumen de {exportData?.monthLabel || "Seleccionado"}</p>
                                <p className="text-xs text-muted-foreground italic">Incluye transacciones, KPIs de ahorro y desglose por categorías.</p>
                            </div>
                            {!loadingExport && exportData ? (
                                <ExportButtons
                                    transactions={exportData.transactions}
                                    monthLabel={exportData.monthLabel}
                                    kpis={exportData.kpis}
                                />
                            ) : (
                                <div className="h-9 w-24 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md" />
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            * Los reportes se generan localmente en tu navegador de forma segura.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-10 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => signOut()}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold gap-2"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </Button>

                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transform transition-all hover:-translate-y-0.5"
                    >
                        {saving ? "Guardando..." : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
