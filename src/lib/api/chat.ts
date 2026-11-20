// src/lib/api/chat.ts
import { http, unwrap } from "./http";
import { normalizeChats, normalizeMessages } from "@/lib/chat/normalize";
import type { ChatMessagesPage, ChatSummary } from "@/types/chat";

export const CHAT_PAGE_SIZE = 30;

export async function fetchChats(): Promise<ChatSummary[]> {
    const { data } = await http.get("/user/home/chats/");
    return normalizeChats(unwrap(data));
}

export async function fetchChatMessages(params: {
    conversationId: number;
    page: number;
}): Promise<ChatMessagesPage> {
    const { conversationId, page } = params;
    const { data } = await http.get(`/user/home/chats/${conversationId}/messages`, {
        params: { page, limit: CHAT_PAGE_SIZE },
    });
    return normalizeMessages(unwrap(data), page);
}