"use client";

import { PrivacyProvider } from "./PrivacyProvider";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <PrivacyProvider>
                {children}
            </PrivacyProvider>
        </ThemeProvider>
    );
}
