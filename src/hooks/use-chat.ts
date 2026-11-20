// src/hooks/use-chat.ts
"use client";

import { useCallback, useEffect } from "react";
import { CHAT_MAX_LENGTH, chatSocket } from "@/lib/chat/socket";
import { useChatStore } from "@/store/chat-store";
import type { ChatMessage } from "@/types/chat";

const EMPTY: ChatMessage[] = []; // stable reference, so the selector doesn't re-render needlessly

/**
 * Conversation with one shop. Pass 0 to stay disconnected (not logged in / shop not loaded yet).
 * The socket is shared and ref-counted, so any number of screens can use this hook.
 */
export function useChat(shopId: number) {
    const messages = useChatStore((s) => s.messages[shopId] ?? EMPTY);
    const status = useChatStore((s) => s.status);
    const enabled = shopId > 0;

    useEffect(() => {
        if (!enabled) return;
        return chatSocket.acquire();
    }, [enabled]);

    const send = useCallback(
        (text: string) => {
            const clean = text.trim().slice(0, CHAT_MAX_LENGTH);
            if (!clean || !enabled) return;
            useChatStore.getState().addPending(shopId, clean);
            chatSocket.send({ type: "chat", receiverRole: "store", receiverId: String(shopId), text: clean });
        },
        [shopId, enabled],
    );

    return { messages, status, send };
}