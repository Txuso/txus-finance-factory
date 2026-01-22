"use client";

import { usePrivacy } from "@/components/providers/PrivacyProvider";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface PrivacyBlurProps {
    children: React.ReactNode;
    className?: string;
}

export function PrivacyBlur({ children, className }: PrivacyBlurProps) {
    const { isPrivate } = usePrivacy();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only apply blur if mounted and private mode is ON
    const showBlur = mounted && isPrivate;

    return (
        <span className={cn(
            "transition-all duration-300",
            showBlur && "blur-[6px] select-none pointer-events-none opacity-50",
            className
        )}>
            {children}
        </span>
    );
}
