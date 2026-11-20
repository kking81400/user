// src/components/shop-profile/profile-tabs.tsx
"use client";

import { memo } from "react";
import { Clapperboard, Layers, LayoutGrid, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileTabId = "products" | "reels" | "collections" | "reviews";

// RTL: the first item is rendered on the right (same order as the design)
const TABS = [
    { id: "products", label: "محصولات", Icon: LayoutGrid },
    { id: "reels", label: "ریلز", Icon: Clapperboard },
    { id: "collections", label: "کالکشن‌ها", Icon: Layers },
    { id: "reviews", label: "نظرات", Icon: MessageSquare },
] as const satisfies readonly { id: ProfileTabId; label: string; Icon: typeof LayoutGrid }[];

interface Props {
    active: ProfileTabId;
    onChange: (id: ProfileTabId) => void;
}

function ProfileTabsImpl({ active, onChange }: Props) {
    return (
        <div
            role="tablist"
            aria-label="بخش‌های پروفایل"
            className="sticky top-0 z-10 flex border-b border-border bg-background"
        >
            {TABS.map(({ id, label, Icon }) => {
                const selected = id === active;
                return (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        id={`profile-tab-${id}`}
                        aria-selected={selected}
                        aria-controls="profile-panel"
                        aria-label={label}
                        onClick={() => onChange(id)}
                        className={cn(
                            "relative grid h-12 flex-1 place-items-center transition-colors",
                            selected ? "text-primary" : "text-muted-foreground",
                        )}
                    >
                        <Icon className="size-6" strokeWidth={selected ? 2.2 : 1.7} />
                        <span
                            className={cn(
                                "absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-primary transition-opacity",
                                selected ? "opacity-100" : "opacity-0",
                            )}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export const ProfileTabs = memo(ProfileTabsImpl);