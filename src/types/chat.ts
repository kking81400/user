// src/types/chat.ts
export type ChatConnectionStatus = "idle" | "connecting" | "open" | "closed";

export interface ChatMessage {
    /** "s<message_id>" once confirmed by the server, "p<n>" while pending */
    id: string;
    text: string;
    /** true = sent by the current user */
    mine: boolean;
    /** ISO date string */
    createdAt: string;
    status: "sending" | "sent";
}

/** What the server pushes over the socket (see the Go `outgoingChatMsg`). */
export interface ServerChatMessage {
    type?: string;
    message_id?: number;
    /** "user" for the customer, "store" / "shop_owner" for the shop side */
    sender_role?: string;
    /** user id for customers, shop id for the shop side */
    sender_id?: string | number;
    text?: string;
    created_at?: string | null;
}

/** What the client sends — field names match the Go `socket.IncomingMessage` json tags (camelCase). */
export interface OutgoingChatMessage {
    type: "chat";
    receiverRole: "store";
    receiverId: string;
    text: string;
}

/** One row of GET /user/home/chats/ (only what the chat screen needs). */
export interface ChatSummary {
    conversationId: number;
    shopId: number | null;
}

export interface ChatMessagesPage {
    items: ChatMessage[];
    page: number;
    hasMore: boolean;
}