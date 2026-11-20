// src/components/chat/chat-composer.tsx
"use client";

import { memo, useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { CHAT_MAX_LENGTH } from "@/lib/chat/socket";

const MAX_HEIGHT_PX = 120;

function ChatComposerImpl({ onSend }: { onSend: (text: string) => void }) {
    const [value, setValue] = useState("");
    const ref = useRef<HTMLTextAreaElement>(null);
    const canSend = value.trim().length > 0;

    // auto-grow up to ~5 lines, and shrink back after sending
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [value]);

    const submit = () => {
        if (!canSend) return;
        onSend(value);
        setValue("");
        ref.current?.focus();
    };

    return (
        <div className="shrink-0 border-t border-border bg-background px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-end gap-2 rounded-3xl bg-muted p-1.5 ps-4">
        <textarea
            ref={ref}
            value={value}
            rows={1}
            maxLength={CHAT_MAX_LENGTH}
            placeholder="پیام ..."
            aria-label="متن پیام"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
                // Enter sends on desktop; on touch devices Enter is a new line and the button sends
                if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing &&
                    window.matchMedia("(hover: hover)").matches
                ) {
                    e.preventDefault();
                    submit();
                }
            }}
            className="max-h-[120px] min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground"
        />
                <button
                    type="button"
                    onClick={submit}
                    disabled={!canSend}
                    aria-label="ارسال"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity active:opacity-80 disabled:opacity-40"
                >
                    <SendHorizontal className="size-5 rtl:-scale-x-100" />
                </button>
            </div>
        </div>
    );
}

export const ChatComposer = memo(ChatComposerImpl);