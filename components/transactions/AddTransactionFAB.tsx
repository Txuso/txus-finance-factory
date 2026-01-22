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
            <DialogContent
                className="sm:max-w-[550px] w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 overflow-hidden border-0 shadow-2xl sm:rounded-3xl flex flex-col"
                closeButtonClassName="text-white hover:text-white/80"
            >
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-10 text-white text-center shrink-0 flex flex-col items-center relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />

                    <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl mb-6 shadow-2xl border border-white/20 relative z-10 transition-transform hover:scale-105 duration-500">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-lg"
                        />
                    </div>
                    <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase relative z-10">
                        Nueva Transacción
                    </DialogTitle>
                    <DialogDescription className="text-blue-100/80 mt-2 font-medium max-w-xs relative z-10 text-balance">
                        Registra tus movimientos en la factoría Txus
                    </DialogDescription>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-background custom-scrollbar">
                    <TransactionForm onSuccess={() => setOpen(false)} />
                </div>
            </DialogContent>
        </Dialog>
    )
}
