"use client";

import { FinancialInsight } from "@/lib/data/dashboard";
import {
    AlertTriangle,
    CheckCircle2,
    Lightbulb,
    Wallet,
    TrendingUp,
    TrendingDown,
    PieChart,
    Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PrivacyBlur } from "@/components/layout/PrivacyBlur";

interface DashboardInsightsProps {
    insights: FinancialInsight[];
}

export function DashboardInsights({ insights }: DashboardInsightsProps) {
    if (!insights || insights.length === 0) return null;

    const getIcon = (iconName?: string, type?: string) => {
        switch (iconName || type) {
            case 'Wallet': return <Wallet className="h-5 w-5" />;
            case 'TrendingUp': return <TrendingUp className="h-5 w-5" />;
            case 'TrendingDown': return <TrendingDown className="h-5 w-5" />;
            case 'PieChart': return <PieChart className="h-5 w-5" />;
            case 'alert': return <AlertTriangle className="h-5 w-5" />;
            case 'success': return <CheckCircle2 className="h-5 w-5" />;
            case 'tip': return <Lightbulb className="h-5 w-5" />;
            default: return <Sparkles className="h-5 w-5" />;
        }
    };

    const getTypeStyles = (type: string, impact?: string) => {
        switch (type) {
            case 'salary':
                return "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300 shadow-blue-500/5";
            case 'alert':
                return "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300 shadow-rose-500/5";
            case 'success':
                return "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-emerald-500/5";
            case 'tip':
                return "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 shadow-amber-500/5";
            default:
                return "bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-300 shadow-slate-500/5";
        }
    };

    const getIconContainerStyles = (type: string) => {
        switch (type) {
            case 'salary': return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
            case 'alert': return "bg-rose-500/20 text-rose-600 dark:text-rose-400";
            case 'success': return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
            case 'tip': return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
            default: return "bg-slate-500/20 text-slate-600 dark:text-slate-400";
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-2">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <h2 className="text-sm font-black italic tracking-widest uppercase text-slate-500 dark:text-slate-400">
                    Insights del Consultor
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "flex flex-col p-5 rounded-3xl border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] shadow-xl group relative overflow-hidden",
                            getTypeStyles(insight.type, insight.impact)
                        )}
                    >
                        {/* Decorative background circle */}
                        <div className="absolute -right-6 -top-6 w-24 h-24 bg-current opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.06] transition-opacity" />

                        <div className="flex items-start justify-between mb-3 relative z-10">
                            <div className={cn(
                                "p-2.5 rounded-2xl shadow-sm transition-transform group-hover:rotate-6",
                                getIconContainerStyles(insight.type)
                            )}>
                                {getIcon(insight.icon, insight.type)}
                            </div>
                            {insight.value && (
                                <span className="text-lg font-black tracking-tighter italic">
                                    <PrivacyBlur>{insight.value}</PrivacyBlur>
                                </span>
                            )}
                        </div>

                        <div className="relative z-10">
                            <h3 className="font-black text-sm uppercase tracking-tight mb-1">
                                {insight.title}
                            </h3>
                            <p className="text-xs font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                {insight.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
