// src/store/chat-store.ts
import { create } from "zustand";
import type { ChatConnectionStatus, ChatMessage, ServerChatMessage } from "@/types/chat";

const MAX_PER_SHOP = 500;
let pendingCounter = 0;

const timeOf = (m: ChatMessage) => Date.parse(m.createdAt) || 0;
const trim = (list: ChatMessage[]) => (list.length > MAX_PER_SHOP ? list.slice(-MAX_PER_SHOP) : list);

interface ChatState {
    status: ChatConnectionStatus;
    /** messages per shop id (the conversation partner) */
    messages: Record<number, ChatMessage[]>;
    setStatus: (status: ChatConnectionStatus) => void;
    /** shows a message immediately, before the server confirms it */
    addPending: (shopId: number, text: string) => void;
    /** handles every frame pushed by the server */
    receive: (raw: ServerChatMessage) => void;
    /**
     * Merges messages loaded from the REST history into the conversation.
     * Live / pending messages that the history doesn't contain yet are kept; duplicates are dropped.
     */
    mergeHistory: (shopId: number, history: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
    status: "idle",
    messages: {},

    setStatus: (status) => set((s) => (s.status === status ? s : { status })),

    addPending: (shopId, text) =>
        set((s) => ({
            messages: {
                ...s.messages,
                [shopId]: trim([
                    ...(s.messages[shopId] ?? []),
                    {
                        id: `p${++pendingCounter}`,
                        text,
                        mine: true,
                        createdAt: new Date().toISOString(),
                        status: "sending",
                    },
                ]),
            },
        })),

    receive: (raw) => {
        const text = raw.text;
        if (raw.type !== "chat" || typeof text !== "string") return;

        const createdAt = raw.created_at ?? new Date().toISOString();
        const id = raw.message_id != null ? `s${raw.message_id}` : `r${Date.now()}`;

        // The server also echoes my own messages back as confirmation.
        if (raw.sender_role === "user") {
            set((s) => {
                for (const key of Object.keys(s.messages)) {
                    const list = s.messages[Number(key)];
                    const i = list.findIndex((m) => m.status === "sending" && m.text === text);
                    if (i === -1) continue;
                    const next = list.slice();
                    next[i] = { ...list[i], id, createdAt, status: "sent" };
                    return { messages: { ...s.messages, [key]: next } };
                }
                return s;
            });
            return;
        }

        // From the shop: sender_id is the shop id, which identifies the conversation.
        const shopId = Number(raw.sender_id);
        if (!Number.isInteger(shopId) || shopId <= 0) return;

        set((s) => {
            const list = s.messages[shopId] ?? [];
            if (list.some((m) => m.id === id)) return s;
            return {
                messages: {
                    ...s.messages,
                    [shopId]: trim([...list, { id, text, mine: false, createdAt, status: "sent" }]),
                },
            };
        });
    },

    mergeHistory: (shopId, history) =>
        set((s) => {
            const known = new Set(history.map((m) => m.id));
            const extras = (s.messages[shopId] ?? []).filter((m) => !known.has(m.id));
            const merged = [...history, ...extras].sort((a, b) => timeOf(a) - timeOf(b));
            return { messages: { ...s.messages, [shopId]: trim(merged) } };
        }),
}));