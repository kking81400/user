// src/components/chat/chat-message-list.tsx
"use client";

import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { formatDay, formatTime } from "@/lib/chat/format";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

const LOAD_OLDER_THRESHOLD_PX = 120;

type Row = { kind: "day"; key: string; label: string } | { kind: "message"; key: string; message: ChatMessage };

/** Inserts a day separator whenever the (Jalali) day changes. */
function buildRows(messages: ChatMessage[]): Row[] {
    const rows: Row[] = [];
    let lastDay = "";
    for (const message of messages) {
        const day = formatDay(message.createdAt);
        if (day && day !== lastDay) {
            rows.push({ kind: "day", key: `d-${day}-${message.id}`, label: day });
            lastDay = day;
        }
        rows.push({ kind: "message", key: message.id, message });
    }
    return rows;
}

const Bubble = memo(function Bubble({ message }: { message: ChatMessage }) {
    const time = formatTime(message.createdAt);
    return (
        // RTL: justify-start = right side (my messages), justify-end = left side (the shop's)
        <div className={cn("flex", message.mine ? "justify-start" : "justify-end")}>
            <div
                className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-7",
                    message.mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    message.status === "sending" && "opacity-60",
                )}
            >
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
                {time && <span className="mt-0.5 block text-[10px] opacity-70">{time}</span>}
            </div>
        </div>
    );
});

export function ChatEmpty() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-28 place-items-center rounded-full bg-muted text-muted-foreground">
        <MessageCircle className="size-12" strokeWidth={1.5} />
      </span>
            <p className="text-base font-bold text-foreground">هنوز پیامی ارسال نشده است</p>
        </div>
    );
}

interface Props {
    messages: ChatMessage[];
    hasOlder: boolean;
    loadingOlder: boolean;
    onLoadOlder: () => void;
}

function ChatMessageListImpl({ messages, hasOlder, loadingOlder, onLoadOlder }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const prev = useRef<{ first?: string; last?: string; height: number }>({ height: 0 });
    const rows = useMemo(() => buildRows(messages), [messages]);

    // Scroll behaviour:
    //  - a new message (or the first load) → jump to the bottom
    //  - older messages prepended on top  → keep the viewport exactly where it was
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const first = messages[0]?.id;
        const last = messages[messages.length - 1]?.id;
        const p = prev.current;

        if (p.first !== undefined && first !== p.first && last === p.last) {
            el.scrollTop += el.scrollHeight - p.height;
        } else if (last !== p.last) {
            el.scrollTop = el.scrollHeight;
        }
        prev.current = { first, last, height: el.scrollHeight };
    }, [messages]);

    const onScroll = useCallback(() => {
        const el = scrollRef.current;
        if (el && hasOlder && !loadingOlder && el.scrollTop < LOAD_OLDER_THRESHOLD_PX) onLoadOlder();
    }, [hasOlder, loadingOlder, onLoadOlder]);

    return (
        <div
            ref={scrollRef}
            onScroll={onScroll}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
        >
            {loadingOlder && <p className="py-1 text-center text-[11px] text-muted-foreground">در حال بارگذاری...</p>}
            {rows.map((row) =>
                row.kind === "day" ? (
                    <p key={row.key} className="py-2 text-center text-[11px] text-muted-foreground">
                        {row.label}
                    </p>
                ) : (
                    <Bubble key={row.key} message={row.message} />
                ),
            )}
        </div>
    );
}

export const ChatMessageList = memo(ChatMessageListImpl);