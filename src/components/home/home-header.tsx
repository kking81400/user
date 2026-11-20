"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import "./home.css";

export type HomeTab = "explore" | "following";

// ترتیب مطابق طرح (چپ‌به‌راست): صفحه اصلی | فروشندگان من
const TABS: { key: HomeTab; label: string }[] = [
    { key: "explore", label: "صفحه اصلی" },
    { key: "following", label: "فروشندگان من" },
];

function TabPills({ value, onChange, overlay }: { value: HomeTab; onChange: (t: HomeTab) => void; overlay: boolean }) {
    return (
        <div
            role="tablist"
            dir="ltr"
            className={cn(
                "pointer-events-auto flex rounded-full p-1",
                overlay
                    ? "bg-black/30 backdrop-blur-md"
                    : "border border-[color:var(--hm-border)] bg-[color:var(--hm-muted)]"
            )}
        >
            {TABS.map((t) => {
                const active = t.key === value;
                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(t.key)}
                        className={cn(
                            "h-8 min-w-[84px] whitespace-nowrap rounded-full px-3 text-xs transition-colors",
                            active
                                ? "bg-white font-bold text-neutral-900 shadow-sm"
                                : overlay
                                    ? "text-white/90"
                                    : "text-[color:var(--hm-text-muted)]"
                        )}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * - تب «صفحه اصلی»: فقط قرص تب‌ها، شناور روی تصویر
 * - تب «فروشندگان من»: هدر کامل (MASS | تب‌ها | پیام‌ها)
 */
export function HomeHeader({ value, onChange }: { value: HomeTab; onChange: (t: HomeTab) => void }) {
    if (value === "explore") {
        return (
            <div className="pointer-events-none fixed inset-x-0 top-3 z-30 mx-auto flex max-w-md justify-center">
                <TabPills value={value} onChange={onChange} overlay />
            </div>
        );
    }

    return (
        <header className="sticky top-0 z-30 bg-[color:var(--hm-glass)] backdrop-blur-md">
            <div dir="ltr" className="flex items-center justify-between gap-2 px-4 py-3">
                <span className="select-none text-[22px] font-black tracking-tight text-[color:var(--hm-text)]">MASS</span>
                <TabPills value={value} onChange={onChange} overlay={false} />
                <button
                    type="button"
                    aria-label="پیام‌ها"
                    onClick={() => toast.info("پیام‌ها به‌زودی فعال می‌شود")}
                    className="relative flex size-10 items-center justify-center text-[color:var(--hm-text)]"
                >
                    <Send className="size-6" />
                    <span className="absolute bottom-2 right-1.5 size-1.5 rounded-full bg-[color:var(--hm-brand)]" />
                </button>
            </div>
        </header>
    );
}