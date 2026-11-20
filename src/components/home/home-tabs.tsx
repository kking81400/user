"use client";

import { cn } from "@/lib/utils";
import "./home.css";

export type HomeTab = "explore" | "following";

const TABS: { key: HomeTab; label: string }[] = [
    { key: "explore", label: "صفحه اصلی" },
    { key: "following", label: "دنبال می‌کنید" },
];

export function HomeTabs({ value, onChange }: { value: HomeTab; onChange: (t: HomeTab) => void }) {
    return (
        <div className="sticky top-0 z-30 border-b border-[color:var(--hm-border)] bg-[color:var(--hm-glass)] px-4 py-3 backdrop-blur-md">
            <div role="tablist" className="mx-auto flex w-full max-w-xs rounded-full bg-[color:var(--hm-muted)] p-1">
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
                                "h-9 flex-1 rounded-full text-sm transition-colors",
                                active
                                    ? "bg-[color:var(--hm-brand)] font-semibold text-[color:var(--hm-on-brand)]"
                                    : "text-[color:var(--hm-text-muted)]"
                            )}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}