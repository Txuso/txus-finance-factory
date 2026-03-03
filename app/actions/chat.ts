"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ChatMessage {
    role: "user" | "model";
    content: string;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    created_at: string;
    updated_at: string;
}

/**
 * Get the most recent chat sessions for the current user (max 10)
 */
export async function getChatSessions(): Promise<{ data?: ChatSession[]; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10);

    if (error) return { error: error.message };
    return { data: data as ChatSession[] };
}

/**
 * Create a new chat session
 */
export async function createChatSession(
    messages: ChatMessage[],
    title?: string
): Promise<{ data?: ChatSession; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    // Enforce max 10 sessions: delete oldest if needed
    const { data: existing } = await supabase
        .from("chat_sessions")
        .select("id, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: true });

    if (existing && existing.length >= 10) {
        const toDelete = existing.slice(0, existing.length - 9);
        await supabase
            .from("chat_sessions")
            .delete()
            .in("id", toDelete.map((s: any) => s.id));
    }

    // Auto-generate a title from the first user message
    const autoTitle = title || (messages.find(m => m.role === "user")?.content.slice(0, 60) + "...") || "Nueva conversación";

    const { data, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, messages, title: autoTitle })
        .select()
        .single();

    if (error) return { error: error.message };
    return { data: data as ChatSession };
}

/**
 * Update an existing chat session's messages
 */
export async function updateChatSession(
    sessionId: string,
    messages: ChatMessage[]
): Promise<{ error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase
        .from("chat_sessions")
        .update({ messages, updated_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(sessionId: string): Promise<{ error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    return {};
}
