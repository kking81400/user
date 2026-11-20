"use client";

import * as React from "react";
import { Check, CreditCard, Package, PackageCheck, Truck, type LucideIcon } from "lucide-react";
import type { OrderPackage, OrderStatus } from "@/types/order";
import { cn } from "@/lib/utils";
import "@/components/home/home.css";

const fmt = (n: number) => n.toLocaleString("en-US");

/** برچسب وضعیت بسته */
const LABEL: Record<OrderStatus, string> = {
    pending: "در انتظار پرداخت",
    processing: "در حال پردازش",
    shipped: "در حال ارسال",
    delivered: "تحویل شده",
    cancelled: "لغو شده",
    returned: "مرجوع شده",
};

const CHIP: Record<OrderStatus, string> = {
    pending: "bg-amber-500/15 text-amber-600",
    processing: "bg-sky-500/15 text-sky-600",
    shipped: "bg-orange-500/15 text-orange-600",
    delivered: "bg-green-500/15 text-green-600",
    cancelled: "bg-rose-500/15 text-rose-500",
    returned: "bg-rose-500/15 text-rose-500",
};

/** چند مرحله تمام شده است (۴ یعنی همه) */
const DONE: Record<OrderStatus, number> = {
    pending: 1,
    processing: 2,
    shipped: 2,
    delivered: 4,
    cancelled: 0,
    returned: 4,
};

const STEPS: { label: string; Icon: LucideIcon }[] = [
    { label: "ثبت", Icon: Package },
    { label: "پرداخت", Icon: CreditCard },
    { label: "ارسال", Icon: Truck },
    { label: "تحویل", Icon: PackageCheck },
];

function Stepper({ done }: { done: number }) {
    return (
        <ol className="flex items-start">
            {STEPS.map((s, i) => {
                const isDone = i < done;
                const isCurrent = i === done;
                const Icon = s.Icon;
                return (
                    <React.Fragment key={s.label}>
                        <li className="flex w-12 shrink-0 flex-col items-center gap-1.5">
              <span
                  className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      isDone && "bg-[color:var(--hm-brand)] text-[color:var(--hm-on-brand)]",
                      isCurrent && "bg-[color:var(--hm-surface)] text-[color:var(--hm-brand)] ring-2 ring-[color:var(--hm-brand)]",
                      !isDone && !isCurrent && "bg-[color:var(--hm-muted)] text-[color:var(--hm-text-faint)]"
                  )}
              >
                {isDone ? <Check className="size-4" strokeWidth={3} /> : <Icon className="size-4" />}
              </span>
                            <span
                                className={cn(
                                    "text-[11px]",
                                    isDone || isCurrent ? "font-bold text-[color:var(--hm-text)]" : "text-[color:var(--hm-text-faint)]"
                                )}
                            >
                {s.label}
              </span>
                        </li>
                        {i < STEPS.length - 1 && (
                            <span
                                aria-hidden
                                className={cn(
                                    "mt-[15px] h-0.5 flex-1",
                                    i + 1 <= done ? "bg-[color:var(--hm-brand)]" : "bg-[color:var(--hm-border)]"
                                )}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </ol>
    );
}

function PackageCardBase({ pkg }: { pkg: OrderPackage }) {
    const failed = pkg.status === "cancelled";
    const HeadIcon = pkg.status === "shipped" ? Truck : Package;

    return (
        <article className="rounded-3xl border border-[color:var(--hm-border)] bg-[color:var(--hm-surface)] p-4">
            <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--hm-muted)] text-[color:var(--hm-brand)]">
          <HeadIcon className="size-6" />
        </span>
                <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-[color:var(--hm-text)]">
                        بسته {pkg.index} از {pkg.total}
                    </h3>
                    {pkg.shop && (
                        <p className="mt-0.5 truncate text-xs text-[color:var(--hm-text-muted)]">
                            فروشنده: <span className="text-[color:var(--hm-brand)]">{pkg.shop}</span>
                        </p>
                    )}
                </div>
                <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold", CHIP[pkg.status])}>{LABEL[pkg.status]}</span>
            </div>

            {!failed && (
                <div className="mt-5 px-1">
                    <Stepper done={DONE[pkg.status]} />
                </div>
            )}

            {pkg.items.length > 0 && (
                <ul className="mt-4 space-y-2">
                    {pkg.items.map((it) => (
                        <li key={it.id} className="flex items-center gap-3 rounded-2xl border border-[color:var(--hm-border)] bg-[color:var(--hm-bg)] p-2.5">
              <span className="size-16 shrink-0 overflow-hidden rounded-full bg-[color:var(--hm-muted)]">
                {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.image} alt={it.name} loading="lazy" className="size-full object-cover" />
                )}
              </span>
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-sm font-bold text-[color:var(--hm-text)]">{it.name}</p>
                                {(it.variantText || it.size || it.color) && (
                                    <p className="mt-0.5 text-xs text-[color:var(--hm-text-muted)]">
                                        {it.variantText ||
                                            [it.size && `سایز: ${it.size}`, it.color && `رنگ: ${it.color}`].filter(Boolean).join(" | ")}
                                    </p>
                                )}
                                {it.unitPrice > 0 && (
                                    <p className="mt-0.5 text-sm font-extrabold text-[color:var(--hm-brand)]">
                                        {fmt(it.unitPrice)} تومان{it.quantity > 1 ? ` × ${it.quantity}` : ""}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {(pkg.shippingMethod || pkg.trackingCode) && (
                <div className="mt-4 flex items-center justify-between border-t border-[color:var(--hm-border)] pt-3 text-xs text-[color:var(--hm-text-muted)]">
                    <span>{pkg.shippingMethod}</span>
                    {pkg.trackingCode && (
                        <span dir="ltr" className="select-all font-semibold">
              {pkg.trackingCode}
            </span>
                    )}
                </div>
            )}
        </article>
    );
}

export const PackageCard = React.memo(PackageCardBase);