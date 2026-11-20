"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types/cart";
import "@/components/home/home.css";

const fmt = (n: number) => n.toLocaleString("en-US");

interface Props {
    item: CartItem;
    onQuantity: (item: CartItem, quantity: number) => void;
    onRemove: (item: CartItem) => void;
}

function CartItemCardBase({ item, onQuantity, onRemove }: Props) {
    const maxed = item.stock != null && item.quantity >= item.stock;
    const canBuy = item.available;

    return (
        <article className="flex gap-4 rounded-[28px] bg-[color:var(--hm-muted)] p-3.5">
            {/* تصویر (راست) */}
            <div className="size-28 shrink-0 overflow-hidden rounded-3xl bg-[color:var(--hm-surface)]">
                {item.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className={canBuy ? "size-full object-cover" : "size-full object-cover opacity-50 grayscale"}
                    />
                )}
            </div>

            <div className="relative flex min-w-0 flex-1 flex-col">
                <button
                    type="button"
                    aria-label="حذف از سبد"
                    onClick={() => onRemove(item)}
                    className="absolute left-0 top-0 flex size-8 items-center justify-center text-[color:var(--hm-text-faint)] active:text-[color:var(--hm-brand)]"
                >
                    <Trash2 className="size-5" />
                </button>

                <h3 className="line-clamp-2 ps-9 text-start text-base font-bold leading-6 text-[color:var(--hm-text)]">
                    {item.name}
                </h3>

                <div className="mt-1.5 space-y-1 text-xs">
                    {item.color && (
                        <p className="flex items-center gap-1.5 text-[color:var(--hm-text-muted)]">
                            رنگ:
                            {item.colorCode && (
                                <span
                                    aria-hidden
                                    className="size-3 rounded-full border border-[color:var(--hm-border)]"
                                    style={{ backgroundColor: item.colorCode }}
                                />
                            )}
                            <span className="text-[color:var(--hm-text)]">{item.color}</span>
                        </p>
                    )}
                    {item.size && (
                        <p className="text-[color:var(--hm-text-muted)]">
                            سایز: <span className="text-[color:var(--hm-text)]">{item.size}</span>
                        </p>
                    )}
                    {!canBuy && (
                        <p className="font-semibold text-rose-500">{item.error || "این محصول در حال حاضر موجود نیست"}</p>
                    )}
                </div>

                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    {/* قیمت (راست) */}
                    <p className="leading-tight">
                        {item.originalPrice && (
                            <span className="block text-[11px] text-[color:var(--hm-text-faint)] line-through">
                {fmt(item.originalPrice)}
              </span>
                        )}
                        <span className="block text-lg font-extrabold text-[color:var(--hm-text)]">{fmt(item.unitPrice)}</span>
                        <span className="block text-xs text-[color:var(--hm-text-muted)]">تومان</span>
                    </p>

                    {/* تعداد (چپ) */}
                    <div dir="ltr" className="flex items-center rounded-2xl bg-[color:var(--hm-surface)] p-1">
                        <button
                            type="button"
                            aria-label="کاهش"
                            disabled={item.quantity <= 1}
                            onClick={() => onQuantity(item, item.quantity - 1)}
                            className="flex size-8 items-center justify-center text-[color:var(--hm-text-muted)] disabled:opacity-40"
                        >
                            <Minus className="size-4" />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold text-[color:var(--hm-text)]">{item.quantity}</span>
                        <button
                            type="button"
                            aria-label="افزایش"
                            disabled={maxed || !canBuy}
                            onClick={() => onQuantity(item, item.quantity + 1)}
                            className="flex size-9 items-center justify-center rounded-xl bg-[color:var(--hm-brand)] text-[color:var(--hm-on-brand)] disabled:opacity-40"
                        >
                            <Plus className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
}

export const CartItemCard = React.memo(CartItemCardBase);

export function CartSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[168px] animate-pulse rounded-[28px] bg-[color:var(--hm-muted)]" />
            ))}
        </div>
    );
}