"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { getConfig, updateConfig } from "@/app/actions/config"
import { toast } from "sonner"
import { Settings, Save, Wallet, Target, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState({
        objetivo_ahorro_porcentaje: 0.20,
        moneda: "€"
    })

    useEffect(() => {
        async function loadConfig() {
            const { data, error } = await getConfig()
            if (error) {
                toast.error(error)
            } else if (data) {
                setConfig({
                    objetivo_ahorro_porcentaje: Number(data.objetivo_ahorro_porcentaje),
                    moneda: data.moneda
                })
            }
            setLoading(false)
        }
        loadConfig()
    }, [])

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

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transform transition-all hover:-translate-y-0.5"
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
