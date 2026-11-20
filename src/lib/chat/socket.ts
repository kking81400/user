// src/lib/chat/socket.ts
import { API_BASE_URL } from "@/lib/api/http";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import type { ChatConnectionStatus, OutgoingChatMessage } from "@/types/chat";

/** ws://host:3000/ws — derived from the REST base URL unless NEXT_PUBLIC_WS_URL is set. */
const WS_URL =
    process.env.NEXT_PUBLIC_WS_URL ??
    `${API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/v\d+\/?$/, "")}/ws`;

/** The server reads at most 4 KB per frame; Persian text is ~2 bytes/char plus JSON overhead. */
export const CHAT_MAX_LENGTH = 1000;

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 15_000;
const RELEASE_GRACE_MS = 3000; // keeps the socket alive while navigating between chat screens

/**
 * One shared WebSocket for the whole app (the server keeps a single connection per user anyway).
 * - screens call `acquire()` and get a release function back (ref-counted)
 * - reconnects with exponential backoff + jitter, and immediately when the tab becomes visible / goes online
 * - messages sent while offline are queued and flushed after reconnecting
 * - the token goes in `?token=` (browsers can't set an Authorization header on WebSocket)
 */
class ChatSocket {
    private ws: WebSocket | null = null;
    private refs = 0;
    private attempts = 0;
    private reconnectTimer: number | null = null;
    private releaseTimer: number | null = null;
    private queue: string[] = [];
    private listening = false;

    acquire = (): (() => void) => {
        this.refs += 1;
        if (this.releaseTimer !== null) {
            window.clearTimeout(this.releaseTimer);
            this.releaseTimer = null;
        }
        this.listen();
        if (!this.ws && this.reconnectTimer === null) this.connect();

        let released = false;
        return () => {
            if (released) return;
            released = true;
            this.refs -= 1;
            if (this.refs === 0) this.releaseTimer = window.setTimeout(this.shutdown, RELEASE_GRACE_MS);
        };
    };

    send = (payload: OutgoingChatMessage) => {
        const data = JSON.stringify(payload);
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
            return;
        }
        this.queue.push(data);
        if (!this.ws && this.reconnectTimer === null && this.refs > 0) this.connect();
    };

    /* ---------- internals ---------- */

    private setStatus(status: ChatConnectionStatus) {
        useChatStore.getState().setStatus(status);
    }

    private connect = () => {
        if (typeof window === "undefined" || this.ws) return;

        const token = useAuthStore.getState().accessToken;
        if (!token) {
            this.setStatus("closed"); // guests can't chat; the screen shows a login prompt
            return;
        }

        this.setStatus("connecting");
        const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
        this.ws = ws;

        ws.onopen = () => {
            this.attempts = 0;
            this.setStatus("open");
            this.flush();
        };

        ws.onmessage = (event) => {
            if (typeof event.data !== "string") return;
            try {
                useChatStore.getState().receive(JSON.parse(event.data));
            } catch {
                /* ignore malformed frames */
            }
        };

        ws.onclose = () => {
            if (this.ws !== ws) return; // an old socket we replaced on purpose
            this.ws = null;
            this.setStatus("closed");
            this.scheduleReconnect();
        };
    };

    private flush() {
        while (this.queue.length && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(this.queue.shift() as string);
        }
    }

    private scheduleReconnect() {
        if (this.refs === 0 || this.reconnectTimer !== null) return;
        const base = Math.min(MAX_DELAY_MS, MIN_DELAY_MS * 2 ** this.attempts);
        this.attempts += 1;
        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, base * (0.75 + Math.random() * 0.5));
    }

    /** tab visible again / network back → try right now instead of waiting for the backoff */
    private wake = () => {
        if (this.refs === 0 || this.ws) return;
        if (document.visibilityState === "hidden") return;
        if (this.reconnectTimer !== null) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.attempts = 0;
        this.connect();
    };

    private listen() {
        if (this.listening) return;
        this.listening = true;
        window.addEventListener("online", this.wake);
        document.addEventListener("visibilitychange", this.wake);
    }

    private shutdown = () => {
        this.releaseTimer = null;
        if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
        const ws = this.ws;
        this.ws = null; // so onclose doesn't schedule a reconnect
        ws?.close();
        this.queue = [];
        this.setStatus("idle");
    };
}

export const chatSocket = new ChatSocket();