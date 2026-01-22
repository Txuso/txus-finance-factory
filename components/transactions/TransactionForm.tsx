"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/transaction"
import { createTransaction, updateTransaction } from "@/app/actions/transaction"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { CATEGORIAS, TIPOS_TRANSACCION, METODOS_PAGO } from "@/lib/types/transaction"

interface TransactionFormProps {
    initialData?: TransactionFormValues & { id?: string }
    onSuccess?: () => void
}

export function TransactionForm({ initialData, onSuccess }: TransactionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            descripcion: initialData?.descripcion || "",
            notas: initialData?.notas || "",
            monto: initialData?.monto || 0,
            fecha: initialData?.fecha ? new Date(initialData.fecha) : new Date(),
            categoria: initialData?.categoria || (
                initialData?.tipo === 'Inversión' ? 'Inversión' :
                    initialData?.tipo === 'Ingreso' ? 'Trabajo' :
                        CATEGORIAS[0]
            ),
            tipo: initialData?.tipo || 'Gasto variable',
            metodo_pago: initialData?.metodo_pago || METODOS_PAGO[0],
            es_automatico: initialData?.es_automatico || false,
            fecha_inicio: (initialData as any)?.fecha_inicio ? new Date((initialData as any).fecha_inicio) : new Date(),
            fecha_fin: (initialData as any)?.fecha_fin ? new Date((initialData as any).fecha_fin) : null,
        },
    })

    const tieneFechaFin = form.watch("fecha_fin" as any) !== null;

    // Reset form when initialData changes (important for dialogs)
    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                notas: initialData.notas || "",
                fecha: initialData.fecha ? new Date(initialData.fecha) : undefined,
                fecha_inicio: (initialData as any)?.fecha_inicio ? new Date((initialData as any).fecha_inicio) : new Date(),
                fecha_fin: (initialData as any)?.fecha_fin ? new Date((initialData as any).fecha_fin) : null,
            } as any)
        }
    }, [initialData, form])

    async function onSubmit(data: TransactionFormValues) {
        console.log("Submit detectado. Datos:", data);
        setIsSubmitting(true)
        try {
            // Aseguramos que los gastos sean negativos para la DB
            const finalData = {
                ...data,
                monto: data.tipo === 'Ingreso' ? Math.abs(data.monto) : -Math.abs(data.monto)
            };

            console.log("Enviando a la acción:", initialData?.id ? "UPDATE" : "CREATE", finalData);

            let result;
            if (initialData?.id) {
                result = await updateTransaction(initialData.id, finalData)
            } else {
                result = await createTransaction(finalData)
            }

            console.log("Resultado de la acción:", result);

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(initialData?.id ? "Transacción actualizada" : "Transacción creada")
                if (!initialData?.id) {
                    form.reset()
                }
                if (onSuccess) {
                    onSuccess()
                }
            }
        } catch (error) {
            console.error("Error en onSubmit:", error);
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    const onError = (errors: any) => {
        console.error("Errores de validación:", errors);
        const errorFields = Object.keys(errors).map(key => {
            const fieldNames: Record<string, string> = {
                descripcion: "Título",
                monto: "Monto",
                fecha: "Fecha",
                categoria: "Categoría",
                tipo: "Tipo",
                metodo_pago: "Método de Pago",
                notas: "Notas",
                fecha_inicio: "Fecha de Inicio",
                fecha_fin: "Fecha de Fin"
            };
            return fieldNames[key] || key;
        }).join(", ");

        toast.error(`Revisa estos campos: ${errorFields}`);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Descripción -> Título */}
                    <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                            <FormItem className="col-span-1 md:col-span-2">
                                <FormLabel>Título</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Compra mensual Mercadona" {...field} className="bg-background/50 backdrop-blur-sm focus:border-primary/50 transition-all" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Monto */}
                    <FormField
                        control={form.control}
                        name="monto"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto (€)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            {...field}
                                            className="pl-8 bg-background/50 backdrop-blur-sm transition-all font-mono text-lg"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Fecha */}
                    <FormField
                        control={form.control}
                        name="fecha"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Fecha</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal bg-background/50 backdrop-blur-sm",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Selecciona una fecha</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Categoría */}
                    <FormField
                        control={form.control}
                        name="categoria"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoría</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                                            <SelectValue placeholder="Selecciona una categoría" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {CATEGORIAS.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Tipo */}
                    <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                                            <SelectValue placeholder="Tipo de transacción" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {TIPOS_TRANSACCION.map((tipo) => (
                                            <SelectItem key={tipo} value={tipo}>
                                                {tipo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Método de Pago */}
                    <FormField
                        control={form.control}
                        name="metodo_pago"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Método de Pago</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                        <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                                            <SelectValue placeholder="Método de pago" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {METODOS_PAGO.map((metodo) => (
                                            <SelectItem key={metodo} value={metodo}>
                                                {metodo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Notas (Descripción textarea) - Solo para Gasto Fijo */}
                    {form.watch("tipo" as any) === "Gasto fijo" && (
                        <FormField
                            control={form.control}
                            name="notas"
                            render={({ field }) => (
                                <FormItem className="col-span-1 md:col-span-2">
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalles adicionales sobre este movimiento..."
                                            className="bg-background/50 backdrop-blur-sm focus:border-primary/50 transition-all min-h-[100px]"
                                            {...field}
                                            value={field.value || ""}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {/* Control de Duración (Solo para Gasto fijo) */}
                    {form.watch("tipo" as any) === "Gasto fijo" && (
                        <div className="col-span-1 md:col-span-2 space-y-4 p-5 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Periodo de Vigencia</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha Inicio */}
                                <FormField
                                    control={form.control}
                                    name="fecha_inicio"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Inicia el</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-background/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/30 hover:border-blue-300 transition-colors",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Fecha de inicio</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value || undefined}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Fecha Fin */}
                                <FormField
                                    control={form.control}
                                    name="fecha_fin"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Finaliza el</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="no-end-date"
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={!tieneFechaFin}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                field.onChange(null);
                                                            } else {
                                                                field.onChange(new Date());
                                                            }
                                                        }}
                                                    />
                                                    <label htmlFor="no-end-date" className="text-[10px] font-medium text-muted-foreground cursor-pointer">
                                                        Sin fecha fin
                                                    </label>
                                                </div>
                                            </div>
                                            <Popover>
                                                <PopoverTrigger asChild disabled={!tieneFechaFin}>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            disabled={!tieneFechaFin}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-background/50 backdrop-blur-sm border-blue-100 dark:border-blue-900/30 hover:border-blue-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Sin fecha de fin</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value || undefined}
                                                        onSelect={field.onChange}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 italic mt-2">
                                * Este gasto aparecerá automáticamente en el dashboard dentro del rango de fechas seleccionado.
                            </p>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                    {isSubmitting ? "Guardando..." : "Guardar Transacción"}
                </Button>
            </form>
        </Form>
    )
}
