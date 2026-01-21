"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Chrome } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (error: any) {
            toast.error("Error al iniciar sesión: " + error.message)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto w-24 h-24 flex items-center justify-center mb-2">
                        <img
                            src="/logo.png"
                            alt="Txus Finance Factory Logo"
                            className="w-full h-full object-contain filter drop-shadow-xl"
                        />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Txus Finance Factory
                        </CardTitle>
                        <CardDescription className="text-lg mt-2 font-medium">
                            Toma el control total de tus finanzas
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full h-12 text-lg font-bold gap-3 border-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            <Chrome className="h-6 w-6" />
                            {isLoading ? "Conectando..." : "Entrar con Google"}
                        </Button>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground italic">
                            "La libertad financiera empieza con el primer registro"
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
