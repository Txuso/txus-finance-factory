"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, TrendingUp, Plus } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { PrivacyBlur } from "@/components/layout/PrivacyBlur"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { updateConfig } from "@/app/actions/config"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EmergencyFundCardProps {
    actual: number
    objetivo: number
}

export function EmergencyFundCard({ actual: initialActual, objetivo }: EmergencyFundCardProps) {
    const [actual, setActual] = useState(initialActual)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [increment, setIncrement] = useState("")

    const progressValue = Math.min(100, Math.max(0, (actual / objetivo) * 100));
    const isTargetMet = actual >= objetivo;

    const handleAdd = async () => {
        const valueToAdd = parseFloat(increment)
        if (isNaN(valueToAdd) || valueToAdd <= 0) {
            toast.error("Introduce un monto válido")
            return
        }

        const newActual = actual + valueToAdd
        const res = await updateConfig({ fondo_emergencia_actual: newActual })

        if (res.error) {
            toast.error(res.error)
        } else {
            setActual(newActual)
            toast.success(`¡${formatCurrency(valueToAdd)} añadidos al fondo!`)
            setIsDialogOpen(false)
            setIncrement("")
        }
    }

    return (
        <Card className="border border-slate-200/50 dark:border-slate-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm overflow-hidden relative transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
            <CardHeader className="py-2.5 px-4 pb-0">
                <CardTitle className="text-[10px] font-bold flex items-center justify-between text-slate-400 uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                            <ShieldCheck className="h-3 w-3 text-rose-500" />
                        </div>
                        Fondo Emergencia
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-black bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent leading-none tracking-tighter">
                                <PrivacyBlur>{formatCurrency(actual)}</PrivacyBlur>
                            </p>
                            <span className="text-[10px] text-slate-400 font-bold">/ <PrivacyBlur>{formatCurrency(objetivo)}</PrivacyBlur></span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-1">
                            {isTargetMet ? "¡Estás blindado! ✨" : `Faltan ${formatCurrency(objetivo - actual)}`}
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Aumentar Fondo</DialogTitle>
                                <DialogDescription>
                                    ¿Cuánto dinero quieres añadir a tu colchón de seguridad?
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="monto">Monto a añadir</Label>
                                    <Input
                                        id="monto"
                                        type="number"
                                        value={increment}
                                        onChange={(e) => setIncrement(e.target.value)}
                                        placeholder="Ej: 500"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAdd} className="bg-rose-500 hover:bg-rose-600">
                                    Confirmar Ingreso
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="space-y-1.5">
                    <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
                        <div
                            className={cn(
                                "h-full transition-all duration-1000 ease-out rounded-full",
                                isTargetMet ? "bg-emerald-500" : "bg-rose-500"
                            )}
                            style={{ width: `${progressValue}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground/40 px-0.5 tracking-tight uppercase">
                        <span>{progressValue.toFixed(0)}% Completado</span>
                        <div className="flex items-center gap-1">
                            <TrendingUp className="h-2 w-2" />
                            <span>Colchón Financiero</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
