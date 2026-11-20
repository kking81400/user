"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Order, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";
import "@/components/home/home.css";

export const fmt = (n: number) => n.toLocaleString("en-US");

const TONE: Record<OrderStatus, string> = {
    pending: "bg-amber-500/15 text-amber-600",
    processing: "bg-sky-500/15 text-sky-600",
    shipped: "bg-violet-500/15 text-violet-600",
    delivered: "bg-green-500/15 text-green-600",
    cancelled: "bg-rose-500/15 text-rose-500",
    returned: "bg-rose-500/15 text-rose-500",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
    return <span className={cn("rounded-full px-3 py-1 text-xs font-bold", TONE[status])}>{label}</span>;
}

function OrderCardBase({ order }: { order: Order }) {
    const shown = order.items.slice(0, 3);
    const more = Math.max(0, order.itemsCount - shown.length);
    return (
        <Link
            href={`/orders/${encodeURIComponent(order.id)}`}
            className="block rounded-[28px] bg-[color:var(--hm-muted)] p-4 transition-colors active:bg-[color:var(--hm-border)]"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-extrabold text-[color:var(--hm-text)]">سفارش #{order.number}</p>
                    {order.date && <p className="mt-0.5 text-xs text-[color:var(--hm-text-muted)]">{order.date}</p>}
                </div>
                <StatusBadge status={order.status} label={order.statusLabel} />
            </div>

            {shown.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                    {shown.map((it) => (
                        <span key={it.id} className="size-14 overflow-hidden rounded-2xl bg-[color:var(--hm-surface)]">
              {it.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt={it.name} loading="lazy" className="size-full object-cover" />
              )}
            </span>
                    ))}
                    {more > 0 && (
                        <span className="flex size-14 items-center justify-center rounded-2xl bg-[color:var(--hm-surface)] text-sm font-bold text-[color:var(--hm-text-muted)]">
              +{more}
            </span>
                    )}
                </div>
            )}

            <div className="mt-3 flex items-center justify-between border-t border-[color:var(--hm-border)] pt-3">
        <span className="flex items-center gap-1 text-xs font-semibold text-[color:var(--hm-brand)]">
          پیگیری سفارش
          <ChevronLeft className="size-4" />
        </span>
                <span className="flex items-baseline gap-1.5">
          <span className="text-xs text-[color:var(--hm-text-muted)]">تومان</span>
          <span className="text-lg font-extrabold text-[color:var(--hm-text)]">{fmt(order.total)}</span>
        </span>
            </div>
        </Link>
    );
}

export const OrderCard = React.memo(OrderCardBase);

export function OrdersSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[190px] animate-pulse rounded-[28px] bg-[color:var(--hm-muted)]" />
            ))}
        </div>
    );
}