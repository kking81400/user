// src/components/shop/shop-filter-sheet.tsx
"use client";

import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Check, LayoutGrid, Shirt, X } from "lucide-react";
import { useShopCount, useShopFilterGroups } from "@/hooks/use-shop";
import { cn } from "@/lib/utils";
import type { ShopCategory } from "@/types/shop";

type Tab = "category" | "brand" | "price";

const TABS: { id: Tab; label: string }[] = [
    { id: "category", label: "دسته‌بندی" },
    { id: "brand", label: "برند" },
    { id: "price", label: "قیمت" },
];

interface Props {
    /** currently applied category (null = all) */
    appliedId: number | null;
    onApply: (categoryId: number | null) => void;
    onClose: () => void;
}

/**
 * Bottom sheet constrained to the mobile column (max-w-md).
 * The layer stops above the bottom nav (`bottom-24` — keep in sync with the nav height),
 * so the menu stays visible and the sheet sits right on top of it.
 */
export function ShopFilterSheet({ appliedId, onApply, onClose }: Props) {
    const [draft, setDraft] = useState<number | null>(appliedId);
    const [tab, setTab] = useState<Tab>("category");

    const { groups, isLoading } = useShopFilterGroups();
    const { data: count } = useShopCount(draft);

    // lock body scroll + close on Escape
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    const toggle = (id: number) => setDraft((prev) => (prev === id ? null : id));

    return createPortal(
        <div className="fixed inset-x-0 top-0 bottom-24 z-50" role="dialog" aria-modal="true" aria-label="فیلترها">
            <button
                type="button"
                aria-label="بستن"
                onClick={onClose}
                className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            />

            <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88%] w-full max-w-md flex-col rounded-t-3xl border-t border-border bg-background shadow-2xl animate-in slide-in-from-bottom duration-300">
                {/* header */}
                <div className="shrink-0 border-b border-border px-5 pb-3 pt-2.5">
                    <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" aria-hidden />
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-foreground">فیلترها</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="بستن"
                            className="grid size-8 place-items-center rounded-full text-foreground active:bg-muted"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* tabs */}
                <div className="shrink-0 border-b border-border px-5 py-3">
                    <div className="flex rounded-xl bg-muted p-1" role="tablist">
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    "flex-1 rounded-lg py-2 text-xs transition-colors",
                                    tab === t.id
                                        ? "bg-background font-medium text-foreground shadow-sm"
                                        : "text-muted-foreground",
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* content */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {tab === "category" ? (
                        isLoading ? (
                            <GroupsSkeleton />
                        ) : (
                            groups.map(({ root, children, loading }) => (
                                <section key={root.id} className="border-b border-border py-4 last:border-b-0">
                                    <h3 className="px-5 text-base font-medium text-foreground">{root.name}</h3>
                                    <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        {loading ? (
                                            <TilesSkeleton />
                                        ) : (
                                            <>
                                                {children.map((c) => (
                                                    <FilterTile
                                                        key={c.id}
                                                        category={c}
                                                        selected={draft === c.id}
                                                        onToggle={toggle}
                                                    />
                                                ))}
                                                <FilterTile
                                                    category={{ id: root.id, name: "مشاهده همه", image: null }}
                                                    selected={draft === root.id}
                                                    onToggle={toggle}
                                                    icon={<LayoutGrid className="size-7" />}
                                                    bold
                                                />
                                            </>
                                        )}
                                    </div>
                                </section>
                            ))
                        )
                    ) : (
                        <p className="px-5 py-12 text-center text-sm text-muted-foreground">به‌زودی</p>
                    )}
                </div>

                {/* footer */}
                <div className="shrink-0 border-t border-border bg-background p-3">
                    <button
                        type="button"
                        onClick={() => onApply(draft)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground active:opacity-90"
                    >
                        <ArrowLeft className="size-4" aria-hidden />
                        {count === undefined ? "نمایش نتایج" : `نمایش ${count.toLocaleString("fa-IR")} نتیجه`}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

/* ---------- pieces ---------- */

interface TileProps {
    category: ShopCategory;
    selected: boolean;
    onToggle: (id: number) => void;
    icon?: React.ReactNode;
    bold?: boolean;
}

const FilterTile = memo(function FilterTile({ category, selected, onToggle, icon, bold }: TileProps) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(category.id)}
            className="flex w-20 shrink-0 flex-col items-center gap-1.5"
        >
      <span
          className={cn(
              "relative grid size-20 place-items-center overflow-hidden rounded-2xl bg-muted text-muted-foreground",
              selected && "ring-2 ring-primary",
          )}
      >
        {category.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={category.image}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
            />
        ) : (
            (icon ?? <Shirt className="size-7" />)
        )}
          {selected && (
              <span className="absolute left-1 top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" strokeWidth={3} />
          </span>
          )}
      </span>
            <span
                className={cn(
                    "line-clamp-1 text-[11px]",
                    bold && "font-bold",
                    selected ? "text-primary" : "text-foreground",
                )}
            >
        {category.name}
      </span>
        </button>
    );
});

function TilesSkeleton() {
    return (
        <>
            {Array.from({ length: 4 }, (_, i) => (
                <span key={i} className="size-20 shrink-0 animate-pulse rounded-2xl bg-muted" />
            ))}
        </>
    );
}

function GroupsSkeleton() {
    return (
        <div className="space-y-6 px-5 py-4" aria-hidden>
            {[0, 1].map((g) => (
                <div key={g}>
                    <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                    <div className="mt-3 flex gap-3 overflow-hidden">
                        <TilesSkeleton />
                    </div>
                </div>
            ))}
        </div>
    );
}