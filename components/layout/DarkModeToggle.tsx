"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function DarkModeToggle({ className }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    const toggle = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <Button
            variant="ghost"
            onClick={toggle}
            className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 text-slate-500 hover:text-primary transition-all active:scale-95 shadow-sm border border-slate-200/50 dark:border-slate-800/50",
                className
            )}
            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
            {!mounted ? (
                <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : isDark ? (
                <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
                <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
        </Button>
    );
}
