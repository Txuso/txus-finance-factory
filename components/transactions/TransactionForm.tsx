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
            fecha: initialData?.fecha ? new Date(initialData.fecha) : undefined,
            categoria: initialData?.categoria,
            tipo: initialData?.tipo,
            metodo_pago: initialData?.metodo_pago,
            es_automatico: initialData?.es_automatico || false,
            meses_aplicacion: (initialData as any)?.meses_aplicacion || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        },
    })

    // Reset form when initialData changes (important for dialogs)
    useEffect(() => {
        if (initialData) {
            form.reset({
                ...initialData,
                notas: initialData.notas || "",
                fecha: initialData.fecha ? new Date(initialData.fecha) : undefined,
                meses_aplicacion: (initialData as any)?.meses_aplicacion || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
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
                meses_aplicacion: "Meses de Aplicación"
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
                                            placeholder="Añade más detalles sobre este gasto variable..."
                                            className="bg-background/50 backdrop-blur-sm focus:border-primary/50 transition-all min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {/* Selector de Meses (Solo para Gasto fijo) */}
                    {form.watch("tipo" as any) === "Gasto fijo" && (
                        <FormField
                            control={form.control}
                            name="meses_aplicacion"
                            render={({ field }) => (
                                <FormItem className="col-span-1 md:col-span-2 space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-sm font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-blue-500" />
                                            Meses en los que aplica
                                        </FormLabel>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-blue-600 hover:text-blue-700 font-medium px-2"
                                            onClick={() => {
                                                const current = field.value || [];
                                                if (current.length === 12) {
                                                    field.onChange([]);
                                                } else {
                                                    field.onChange([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
                                                }
                                            }}
                                        >
                                            {field.value?.length === 12 ? "Ninguno" : "Todos"}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"].map((mes, index) => {
                                            const monthNum = index + 1;
                                            const isSelected = field.value?.includes(monthNum);
                                            return (
                                                <Button
                                                    key={mes}
                                                    type="button"
                                                    variant={isSelected ? "default" : "outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "h-9 text-xs font-medium transition-all",
                                                        isSelected
                                                            ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm"
                                                            : "bg-white dark:bg-slate-900 hover:border-blue-300"
                                                    )}
                                                    onClick={() => {
                                                        const current = field.value || [];
                                                        const next = current.includes(monthNum)
                                                            ? current.filter((m: number) => m !== monthNum)
                                                            : [...current, monthNum].sort((a: number, b: number) => a - b);
                                                        field.onChange(next);
                                                    }}
                                                >
                                                    {mes}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        * Si es un gasto fijo, se guardará como plantilla para aparecer automáticamente en los meses seleccionados.
                                    </p>
                                </FormItem>
                            )}
                        />
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
