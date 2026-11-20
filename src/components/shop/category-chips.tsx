"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ShopCategory } from "@/types/shop";

interface Props {
    categories: ShopCategory[];
    /** null = "همه" */
    selectedId: number | null;
    onSelect: (id: number | null) => void;
    loading?: boolean;
}

const chipBase =
    "shrink-0 rounded-full px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap";

function CategoryChipsImpl({ categories, selectedId, onSelect, loading }: Props) {
    return (
        <div
            className="-mx-4 flex gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="دسته‌بندی‌ها"
        >
            <button
                type="button"
                role="tab"
                aria-selected={selectedId === null}
                onClick={() => onSelect(null)}
                className={cn(
                    chipBase,
                    selectedId === null ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                )}
            >
                همه
            </button>

            {loading
                ? Array.from({ length: 4 }, (_, i) => (
                    <span key={i} className="h-9 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
                ))
                : categories.map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        role="tab"
                        aria-selected={selectedId === c.id}
                        onClick={() => onSelect(c.id)}
                        className={cn(
                            chipBase,
                            selectedId === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        )}
                    >
                        {c.name}
                    </button>
                ))}
        </div>
    );
}

export const CategoryChips = memo(CategoryChipsImpl);