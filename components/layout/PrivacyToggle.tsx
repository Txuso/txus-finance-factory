"use client";

import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function PrivacyToggle({ className }: { className?: string }) {
    const { isPrivate, togglePrivacy } = usePrivacy();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const iconClass = "h-5 w-5 sm:h-6 sm:w-6";

    return (
        <Button
            variant="ghost"
            onClick={togglePrivacy}
            className={cn(
                "h-10 sm:h-12 px-3 sm:px-4 flex items-center gap-2 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:text-primary transition-all active:scale-95 shadow-sm border border-slate-200/50 dark:border-slate-800/50",
                mounted && isPrivate && "text-primary bg-primary/10 border-primary/20",
                className
            )}
            title={mounted && isPrivate ? "Desactivar modo incógnito" : "Activar modo incógnito"}
        >
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden xs:inline-block">
                Modo Incógnito
            </span>
            {!mounted ? (
                <Eye className={iconClass} />
            ) : isPrivate ? (
                <EyeOff className={iconClass} />
            ) : (
                <Eye className={iconClass} />
            )}
        </Button>
    );
}
