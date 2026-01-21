"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { TransactionForm } from "./TransactionForm"

export function AddTransactionFAB() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-110 active:scale-95 z-55 sm:h-16 sm:w-16 group"
                    title="Añadir transaccion"
                >
                    <Plus className="h-8 w-8 text-white group-hover:rotate-90 transition-transform duration-300" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 overflow-hidden border-0 shadow-2xl sm:rounded-3xl flex flex-col">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center shrink-0 flex flex-col items-center">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-2 brightness-0 invert"
                    />
                    <DialogTitle className="text-2xl font-black italic tracking-tight">NUEVA TRANSACCIÓN</DialogTitle>
                    <DialogDescription className="text-blue-100 mt-1 font-medium">
                        Registra un movimiento manual en tu factoría
                    </DialogDescription>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-background custom-scrollbar">
                    <TransactionForm onSuccess={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
