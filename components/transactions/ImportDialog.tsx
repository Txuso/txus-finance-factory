"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Upload, FileText, Check, Trash2, RotateCcw } from "lucide-react"
import { parseUpload, saveImportedTransactions } from "@/app/actions/import"
import { deleteAllTransactions } from "@/app/actions/transaction"
import { ParsedTransaction } from "@/lib/parsers/pdf-parser"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Categoria, CATEGORIAS } from "@/lib/types/transaction"

export function ImportDialog() {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [step, setStep] = useState<'upload' | 'review'>('upload')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return;

        setIsProcessing(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await parseUpload(formData);

        if (res.error || !res.data) {
            toast.error(res.error || "Error al leer el archivo");
        } else {
            setTransactions(res.data);
            setStep('review');
        }
        setIsProcessing(false);
    }

    const handleSave = async () => {
        setIsProcessing(true);
        const res = await saveImportedTransactions(transactions);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`${transactions.length} transacciones importadas`);
            setOpen(false);
            setStep('upload');
            setFile(null);
            setTransactions([]);
        }
        setIsProcessing(false);
    }

    const handleResetData = async () => {
        if (confirm("⚠️ ¿⚠️ ¿Estás seguro? Esto borrará TODAS las transacciones de la base de datos. Esta acción es para TESTING.")) {
            const res = await deleteAllTransactions();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Base de datos de transacciones vaciada");
            }
        }
    }

    const removeItem = (index: number) => {
        const newTransactions = [...transactions];
        newTransactions.splice(index, 1);
        setTransactions(newTransactions);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Upload className="h-4 w-4" /> Importar PDF
                    </Button>
                    <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); handleResetData(); }} title="RESET DATA (Testing)">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[90vw] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importar Extracto Bancario</DialogTitle>
                    <DialogDescription>
                        Sube tu PDF de Kutxabank (u otros) para extraer los movimientos.
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4">
                        <FileText className="h-12 w-12 text-muted-foreground" />
                        <Input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="max-w-sm"
                        />
                        <Button onClick={handleUpload} disabled={!file || isProcessing}>
                            {isProcessing ? "Procesando..." : "Analizar PDF"}
                        </Button>
                    </div>
                )}

                {step === 'review' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{transactions.length} Movimientos detectados</h3>
                            <Button variant="ghost" size="sm" onClick={() => setStep('upload')}><RotateCcw className="h-4 w-4 mr-2" /> Volver</Button>
                        </div>

                        <div className="border rounded-md overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Descripción</TableHead>
                                        <TableHead>Monto</TableHead>
                                        <TableHead>Cat. (Adivinada)</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((t, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{format(new Date(t.fecha), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="text-sm">{t.descripcion}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={t.monto}
                                                    onChange={(e) => {
                                                        const newVal = parseFloat(e.target.value);
                                                        const newTransactions = [...transactions];
                                                        newTransactions[i].monto = isNaN(newVal) ? 0 : newVal;
                                                        setTransactions(newTransactions);
                                                    }}
                                                    className={`w-32 ${t.monto < 0 ? "text-red-500" : "text-green-500"}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={t.categoria}
                                                    onValueChange={(val: Categoria) => {
                                                        const newTransactions = [...transactions];
                                                        newTransactions[i].categoria = val;
                                                        setTransactions(newTransactions);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="Categoría" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CATEGORIAS.map((cat) => (
                                                            <SelectItem key={cat} value={cat}>
                                                                {cat}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleSave} disabled={isProcessing} className="w-full">
                                {isProcessing ? "Guardando..." : "Confirmar e Importar"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
