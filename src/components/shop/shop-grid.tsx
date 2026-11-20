"use client";

import { memo, useMemo } from "react";
import { ShopProductCard } from "./shop-product-card";
import type { ShopProduct } from "@/types/shop";

const FALLBACK_ASPECT = 0.75;
const TITLE_HEIGHT = 0.12; // relative units, only used for balancing

/**
 * Two-column masonry. Greedy by estimated height, so items already placed never move
 * when the next page is appended (CSS `columns` would reshuffle everything).
 * In RTL the first column is on the right, matching the design.
 */
function splitColumns(items: ShopProduct[]): ShopProduct[][] {
    const cols: ShopProduct[][] = [[], []];
    const heights = [0, 0];
    for (const item of items) {
        const i = heights[0] <= heights[1] ? 0 : 1;
        cols[i].push(item);
        heights[i] += 1 / (item.aspect ?? FALLBACK_ASPECT) + TITLE_HEIGHT;
    }
    return cols;
}

function ShopGridImpl({ items }: { items: ShopProduct[] }) {
    const columns = useMemo(() => splitColumns(items), [items]);

    return (
        <div className="flex items-start gap-3">
            {columns.map((col, ci) => (
                <div key={ci} className="flex min-w-0 flex-1 flex-col gap-3">
                    {col.map((p, idx) => (
                        <ShopProductCard key={p.id} product={p} priority={ci === 0 && idx === 0} />
                    ))}
                </div>
            ))}
        </div>
    );
}

export const ShopGrid = memo(ShopGridImpl);

export function ShopGridSkeleton() {
    const heights = ["h-56", "h-44", "h-40", "h-60", "h-52", "h-44"];
    return (
        <div className="flex items-start gap-3" aria-hidden>
            {[0, 1].map((c) => (
                <div key={c} className="flex flex-1 flex-col gap-3">
                    {heights.slice(c * 3, c * 3 + 3).map((h, i) => (
                        <div key={i} className={`${h} animate-pulse rounded-3xl bg-muted`} />
                    ))}
                </div>
            ))}
        </div>
    );
}