// src/hooks/use-variant-selection.ts
"use client";

import { useCallback, useState } from "react";
import type { ProductDetail, ProductVariant } from "@/types/product-detail";

/** Keeps the chosen color/size and resolves them to a concrete variant (price + stock). */
export function useVariantSelection(product: ProductDetail) {
    const { variants, colors, sizes } = product;

    const [color, setColor] = useState<string | null>(() => {
        const first = variants.find((v) => v.stock > 0) ?? variants[0];
        return first?.color ?? colors[0]?.name ?? null;
    });
    const [size, setSize] = useState<string | null>(() => {
        const first = variants.find((v) => v.stock > 0) ?? variants[0];
        return first?.size ?? sizes[0] ?? null;
    });

    const variant: ProductVariant | null =
        variants.find((v) => v.color === color && v.size === size) ?? null;

    const isSizeAvailable = useCallback(
        (s: string) => variants.some((v) => v.color === color && v.size === s && v.stock > 0),
        [variants, color],
    );

    const selectColor = useCallback(
        (next: string) => {
            setColor(next);
            // keep the size when it exists in the new color, otherwise move to the first available one
            const keeps = variants.some((v) => v.color === next && v.size === size && v.stock > 0);
            if (!keeps) {
                const alt =
                    variants.find((v) => v.color === next && v.stock > 0) ??
                    variants.find((v) => v.color === next);
                setSize(alt?.size ?? null);
            }
        },
        [variants, size],
    );

    return { color, size, variant, selectColor, selectSize: setSize, isSizeAvailable };
}