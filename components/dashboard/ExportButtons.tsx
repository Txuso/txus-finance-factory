"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileDown, FileSpreadsheet, FileText, Download } from "lucide-react"
import { Transaccion } from "@/lib/types/transaction"
import { exportToExcel, exportToPDF } from "@/lib/export-utils"
import { toast } from "sonner"

interface ExportButtonsProps {
    transactions: Transaccion[]
    monthLabel: string
    kpis: {
        income: number
        expenses: number
        investments: number
        savings: number
    }
}

export function ExportButtons({ transactions, monthLabel, kpis }: ExportButtonsProps) {
    const handlePDF = () => {
        try {
            exportToPDF(transactions, monthLabel, kpis)
            toast.success("PDF generado correctamente")
        } catch (error) {
            console.error(error)
            toast.error("Error al generar el PDF")
        }
    }

    const handleExcel = () => {
        try {
            exportToExcel(transactions, `TxusFinance_${monthLabel.replace(/\s+/g, "_")}`)
            toast.success("Excel generado correctamente")
        } catch (error) {
            console.error(error)
            toast.error("Error al generar el Excel")
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all active:scale-95 text-slate-600 dark:text-slate-400 font-bold tracking-tight px-4"
                >
                    <Download className="h-4 w-4" />
                    <span>Exportar</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-1.5 border-slate-200/50 dark:border-slate-800/50 shadow-xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                <DropdownMenuItem
                    onClick={handlePDF}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors group"
                >
                    <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 rounded-md group-hover:bg-rose-100 dark:group-hover:bg-rose-800/40">
                        <FileText className="h-4 w-4 text-rose-500" />
                    </div>
                    <span className="text-sm">Informe PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleExcel}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium transition-colors group"
                >
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-md group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm">Datos Excel</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
