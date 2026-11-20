// src/components/product/product-options.tsx
"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ProductColor } from "@/types/product-detail";

interface ColorsProps {
    colors: ProductColor[];
    selected: string | null;
    onSelect: (name: string) => void;
}

export const ColorPicker = memo(function ColorPicker({ colors, selected, onSelect }: ColorsProps) {
    if (!colors.length) return null;
    return (
        <section>
            <h3 className="text-sm font-medium text-foreground">انتخاب رنگ</h3>
            <div className="mt-3 flex flex-wrap gap-3" role="radiogroup" aria-label="رنگ">
                {colors.map((c) => {
                    const active = selected === c.name;
                    return (
                        <button
                            key={c.name}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={c.name}
                            title={c.name}
                            onClick={() => onSelect(c.name)}
                            className={cn(
                                "grid size-11 place-items-center rounded-full border-2 p-0.5 transition-colors",
                                active ? "border-foreground" : "border-transparent",
                            )}
                        >
              <span
                  className="block size-full rounded-full border border-border bg-muted"
                  style={c.code ? { backgroundColor: c.code } : undefined}
              />
                        </button>
                    );
                })}
            </div>
        </section>
    );
});

interface SizesProps {
    sizes: string[];
    selected: string | null;
    isAvailable: (size: string) => boolean;
    onSelect: (size: string) => void;
}

export const SizePicker = memo(function SizePicker({ sizes, selected, isAvailable, onSelect }: SizesProps) {
    if (!sizes.length) return null;
    return (
        <section>
            <h3 className="text-sm font-medium text-foreground">انتخاب سایز</h3>
            <div
                className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="radiogroup"
                aria-label="سایز"
            >
                {sizes.map((s) => {
                    const active = selected === s;
                    const available = isAvailable(s);
                    return (
                        <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={!available}
                            onClick={() => onSelect(s)}
                            className={cn(
                                "h-11 min-w-14 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                                active ? "border-primary bg-card text-primary" : "border-border text-foreground",
                                !available && "cursor-not-allowed text-muted-foreground line-through opacity-50",
                            )}
                        >
                            {s}
                        </button>
                    );
                })}
            </div>
        </section>
    );
});