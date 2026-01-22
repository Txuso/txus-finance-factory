"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface PrivacyContextType {
    isPrivate: boolean;
    togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
    const [isPrivate, setIsPrivate] = useState<boolean>(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('privacy-mode');
        if (stored === 'true') {
            setIsPrivate(true);
        }
        setMounted(true);
    }, []);

    const togglePrivacy = () => {
        setIsPrivate(prev => {
            const newValue = !prev;
            localStorage.setItem('privacy-mode', String(newValue));
            return newValue;
        });
    };

    return (
        <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    const context = useContext(PrivacyContext);
    if (context === undefined) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
}
