"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Plus, Clock, Loader2, Trash2, MessageSquare, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    getChatSessions,
    createChatSession,
    updateChatSession,
    deleteChatSession,
    type ChatMessage,
    type ChatSession,
} from "@/app/actions/chat";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const SUGGESTED_QUESTIONS = [
    "¿Hay algún gasto que debería controlar mejor?",
    "¿Debería aumentar mi inversión mensual?",
    "¿Cuánto debería tener en el fondo de emergencia?",
    "¿Cuál es mi tendencia de ahorro en los últimos meses?",
    "¿En qué categoría gasto más de lo normal?",
];

function TypingIndicator() {
    return (
        <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm w-fit">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
    );
}

function MessageBubble({ msg, isFullscreen }: { msg: ChatMessage; isFullscreen: boolean }) {
    const isUser = msg.role === "user";
    return (
        <div className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300", isUser ? "flex-row-reverse" : "flex-row")}>
            {!isUser && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm mt-1">
                    <Bot className="h-3.5 w-3.5 text-white" />
                </div>
            )}
            <div className={cn(
                "max-w-[78%] px-4 py-3 rounded-2xl leading-relaxed shadow-sm",
                isFullscreen ? "text-sm" : "text-xs sm:text-sm",
                isUser
                    ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-sm"
            )}>
                {msg.content.split("\n").map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
            </div>
        </div>
    );
}

function SessionList({ sessions, activeId, onSelect, onDelete, onNew, isFullscreen }: {
    sessions: ChatSession[];
    activeId: string | null;
    onSelect: (s: ChatSession) => void;
    onDelete: (id: string) => void;
    onNew: () => void;
    isFullscreen: boolean;
}) {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Historial</span>
                <Button size="sm" variant="ghost" onClick={onNew}
                    className="h-7 gap-1.5 text-xs text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 px-2">
                    <Plus className="h-3 w-3" /> Nueva
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {sessions.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">Sin conversaciones guardadas</p>
                )}
                {sessions.map(s => (
                    <div key={s.id} onClick={() => onSelect(s)}
                        className={cn("group flex items-start gap-2 p-2.5 rounded-xl cursor-pointer transition-all",
                            activeId === s.id ? "bg-violet-50 dark:bg-violet-950/40 border border-violet-200/50 dark:border-violet-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/50")}>
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">{s.title}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(s.updated_at), "d MMM, HH:mm", { locale: es as any })}
                            </p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-all">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function AIChatPanel() {
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("ai-chat-open") === "true";
    });
    const [isFullscreen, setIsFullscreen] = useState(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem("ai-chat-fullscreen") === "true";
    });
    const [showSessions, setShowSessions] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionsLoaded, setSessionsLoaded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !sessionsLoaded) {
            getChatSessions().then(res => {
                if (res.data) setSessions(res.data);
                setSessionsLoaded(true);
            });
        }
    }, [isOpen, sessionsLoaded]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Persist open/fullscreen state across page re-renders (e.g. month change)
    useEffect(() => { localStorage.setItem("ai-chat-open", String(isOpen)); }, [isOpen]);
    useEffect(() => { localStorage.setItem("ai-chat-fullscreen", String(isFullscreen)); }, [isFullscreen]);

    // Close fullscreen on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                if (isFullscreen) setIsFullscreen(false);
                else setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isFullscreen]);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        setActiveSessionId(null);
        setShowSessions(false);
    }, []);

    const handleSelectSession = useCallback((session: ChatSession) => {
        setMessages(session.messages);
        setActiveSessionId(session.id);
        setShowSessions(false);
    }, []);

    const handleDeleteSession = useCallback(async (id: string) => {
        await deleteChatSession(id);
        setSessions(prev => prev.filter(s => s.id !== id));
        if (activeSessionId === id) { setMessages([]); setActiveSessionId(null); }
    }, [activeSessionId]);

    const handleSend = useCallback(async (text?: string) => {
        const content = (text ?? input).trim();
        if (!content || isLoading) return;

        setInput("");
        const userMessage: ChatMessage = { role: "user", content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsLoading(true);
        setIsStreaming(false);

        let aiText = "";
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Error desconocido");
            }

            setIsStreaming(true);
            setIsLoading(false);
            setMessages([...newMessages, { role: "model", content: "" }]);

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                aiText += decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "model", content: aiText };
                    return updated;
                });
            }
            setIsStreaming(false);

            const finalMessages = [...newMessages, { role: "model" as const, content: aiText }];
            if (activeSessionId) {
                await updateChatSession(activeSessionId, finalMessages);
                setSessions(prev => prev.map(s =>
                    s.id === activeSessionId ? { ...s, messages: finalMessages, updated_at: new Date().toISOString() } : s
                ));
            } else {
                const result = await createChatSession(finalMessages);
                if (result.data) {
                    setActiveSessionId(result.data.id);
                    setSessions(prev => [result.data!, ...prev].slice(0, 10));
                }
            }
        } catch (err: any) {
            setIsLoading(false);
            setIsStreaming(false);
            let msg = "No se pudo conectar con el consultor IA. Inténtalo de nuevo.";
            const raw = err?.message || "";
            if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota"))
                msg = "⚠️ Cuota de API agotada. Ve a console.anthropic.com para verificar tu plan.";
            else if (raw.includes("401") || raw.includes("API_KEY_INVALID"))
                msg = "🔑 API key inválida. Comprueba la clave en .env.local";
            setMessages(prev => [...prev, { role: "model", content: `❌ ${msg}` }]);
        }
    }, [input, messages, isLoading, activeSessionId]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    // ----- Shared Chat UI (used in both popup and fullscreen) -----
    const chatHeader = (
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="flex items-center gap-3 relative z-10">
                <div className="p-1.5 bg-white/20 rounded-xl">
                    <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                    <p className="text-sm font-black text-white tracking-tight">Consultor IA</p>
                    <p className="text-[10px] text-white/70">Claude 3 Haiku</p>
                </div>
                {isStreaming && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-full">
                        <Loader2 className="h-3 w-3 text-white animate-spin" />
                        <span className="text-[10px] text-white font-medium">Analizando...</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1.5 relative z-10">
                <button onClick={() => setShowSessions(p => !p)}
                    className={cn("p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all", showSessions && "bg-white/20")}
                    title="Historial de conversaciones">
                    <Clock className="h-4 w-4" />
                </button>
                <button onClick={handleNewChat}
                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all"
                    title="Nueva conversación">
                    <Plus className="h-4 w-4" />
                </button>
                <button onClick={() => setIsFullscreen(p => !p)}
                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all"
                    title={isFullscreen ? "Reducir" : "Pantalla completa"}>
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-all">
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );

    const chatBody = (
        <div className={cn("flex min-h-0 flex-1")}>
            {/* Session sidebar */}
            {showSessions && (
                <div className={cn("shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50",
                    isFullscreen ? "w-64" : "w-52")}>
                    <SessionList
                        sessions={sessions}
                        activeId={activeSessionId}
                        onSelect={handleSelectSession}
                        onDelete={handleDeleteSession}
                        onNew={handleNewChat}
                        isFullscreen={isFullscreen}
                    />
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center gap-5 py-6">
                            <div className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-3xl border border-violet-200/30 dark:border-violet-800/30">
                                <Bot className="h-8 w-8 text-violet-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-slate-700 dark:text-slate-200 text-sm">Tu Consultor Financiero</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-xs">Tengo acceso a todos tus datos financieros. Pregúntame lo que quieras.</p>
                            </div>
                            <div className={cn("w-full grid gap-2", isFullscreen ? "grid-cols-2 max-w-2xl" : "grid-cols-1")}>
                                {SUGGESTED_QUESTIONS.map(q => (
                                    <button key={q} onClick={() => handleSend(q)} disabled={isLoading}
                                        className="text-left text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 text-slate-600 dark:text-slate-300 font-medium transition-all active:scale-[0.98]">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map((msg, i) => <MessageBubble key={i} msg={msg} isFullscreen={isFullscreen} />)}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                    <div className="flex items-end gap-2">
                        <Textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Pregunta al consultor... (Enter para enviar)"
                            disabled={isLoading || isStreaming}
                            rows={1}
                            className={cn(
                                "flex-1 resize-none rounded-2xl border-slate-200 dark:border-slate-700",
                                "bg-white dark:bg-slate-800 focus-visible:ring-violet-500/30 focus-visible:border-violet-400",
                                "min-h-[44px] max-h-[140px] py-3 px-4 placeholder:text-slate-400",
                                isFullscreen ? "text-sm" : "text-xs sm:text-sm"
                            )}
                            style={{ fieldSizing: "content" } as any}
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isLoading || isStreaming}
                            size="icon"
                            className="h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-md shadow-violet-500/20 disabled:opacity-50"
                            id="ai-chat-send-btn"
                        >
                            {isLoading || isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2">Shift+Enter para nueva línea · Las conversaciones se guardan automáticamente</p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* ===== FULLSCREEN OVERLAY ===== */}
            {isOpen && isFullscreen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
                    <div className={cn(
                        "w-full max-w-5xl h-full max-h-[90vh]",
                        "rounded-3xl border border-slate-200/60 dark:border-slate-700/60",
                        "bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl",
                        "shadow-2xl shadow-violet-500/10",
                        "flex flex-col overflow-hidden",
                        "animate-in zoom-in-95 fade-in duration-200"
                    )}>
                        {chatHeader}
                        {chatBody}
                    </div>
                </div>
            )}

            {/* ===== FLOATING BUBBLE + POPUP ===== */}
            <div className="fixed bottom-28 right-6 sm:bottom-32 sm:right-8 z-50 flex flex-col items-end gap-3">

                {/* Popup panel (non-fullscreen) */}
                {isOpen && !isFullscreen && (
                    <div className={cn(
                        /* Wider and taller default size */
                        "w-[min(calc(100vw-3rem),480px)]",
                        "rounded-3xl border border-slate-200/60 dark:border-slate-700/60",
                        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                        "shadow-2xl shadow-violet-500/10",
                        "flex flex-col overflow-hidden",
                        "animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200",
                    )} style={{ height: "520px" }}>
                        {chatHeader}
                        {chatBody}
                    </div>
                )}

                {/* Floating bubble button */}
                <button
                    onClick={() => setIsOpen(p => !p)}
                    id="ai-chat-open-btn"
                    className={cn(
                        "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full",
                        "bg-gradient-to-br from-violet-600 to-purple-600",
                        "hover:from-violet-500 hover:to-purple-500",
                        "shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50",
                        "transition-all duration-300 hover:scale-110 active:scale-95",
                        "border-2 border-white/20 flex items-center justify-center",
                        isOpen && "rotate-12 scale-95"
                    )}
                    title="Consultor IA"
                >
                    {isOpen
                        ? <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        : <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    }
                    {!isOpen && <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />}
                    {!isOpen && sessions.length > 0 && (
                        <span className="absolute -top-1 -left-1 w-4 h-4 bg-violet-800 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                            {sessions.length}
                        </span>
                    )}
                </button>
            </div>
        </>
    );
}
