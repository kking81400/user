// src/lib/chat/normalize.ts
import type { ChatMessage, ChatMessagesPage, ChatSummary } from "@/types/chat";

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const num = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const pick = (raw: Raw, ...keys: string[]): unknown => {
    for (const k of keys) {
        const v = raw[k];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
};

function listOf(body: unknown, depth = 0): Raw[] {
    if (Array.isArray(body)) return body.filter(isObj);
    if (!isObj(body) || depth > 3) return [];
    for (const key of ["items", "data", "results", "chats", "conversations", "messages"]) {
        const list = listOf(body[key], depth + 1);
        if (list.length) return list;
    }
    return [];
}

/** GET /user/home/chats/ → which conversation belongs to which shop. */
export function normalizeChats(body: unknown): ChatSummary[] {
    return listOf(body).flatMap((raw) => {
        const conversationId = num(pick(raw, "conversation_id", "id"));
        if (conversationId === null) return [];
        const shop: Raw = isObj(raw.shop) ? raw.shop : {};
        return [{ conversationId, shopId: num(pick(raw, "shop_id") ?? pick(shop, "shop_id", "id")) }];
    });
}

/** GET /user/home/chats/{id}/messages → messages sorted oldest → newest. */
export function normalizeMessages(body: unknown, page: number): ChatMessagesPage {
    const b: Raw = isObj(body) ? body : {};
    const meta: Raw = isObj(b.meta) ? b.meta : isObj(b.pagination) ? b.pagination : {};

    const items = listOf(body)
        .flatMap((raw): ChatMessage[] => {
            const id = num(pick(raw, "message_id", "id"));
            const text = str(pick(raw, "message_text", "text", "content", "body"));
            if (id === null || text === null) return [];

            const sender = str(pick(raw, "sender_type", "sender_role", "sender"));
            const mine = pick(raw, "is_mine", "is_me", "mine") === true || sender === "user";

            return [
                {
                    id: `s${id}`, // same id scheme as live messages, so duplicates are detected
                    text,
                    mine,
                    createdAt: str(pick(raw, "created_at", "sent_at", "date")) ?? new Date(0).toISOString(),
                    status: "sent",
                },
            ];
        })
        .sort((a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0));

    return { items, page: num(meta.page) ?? page, hasMore: meta.has_more === true };
}