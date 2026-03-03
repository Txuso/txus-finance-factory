import { AddTransactionFAB } from "@/components/transactions/AddTransactionFAB";
import { AIChatPanel } from "@/components/dashboard/AIChatPanel";

/**
 * Dashboard layout — wraps all /dashboard pages.
 * Hosts the floating action buttons here so they are NOT re-mounted
 * when the user changes the selected month (which re-renders the page).
 * This keeps the AIChatPanel state (open/closed, messages) fully stable.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            {/* Fixed FABs — live outside the page so they survive re-renders */}
            <AIChatPanel />
            <AddTransactionFAB />
        </>
    );
}
