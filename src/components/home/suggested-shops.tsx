"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { useSuggestedShops } from "@/hooks/use-home";
import "./home.css";

export function SuggestedShops({ title = "فروشگاه‌های پیشنهادی" }: { title?: string }) {
    const { data, isLoading, isError } = useSuggestedShops();
    const shops = data ?? [];

    if (isError || (!isLoading && shops.length === 0)) return null;

    return (
        <section className="py-5" aria-label={title}>
            <h2 className="mb-3 px-4 text-sm font-semibold text-[color:var(--hm-text)]">{title}</h2>
            <div className="hm-no-scrollbar flex snap-x gap-3 overflow-x-auto px-4">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-44 w-36 shrink-0 animate-pulse rounded-2xl bg-[color:var(--hm-skeleton)]" />
                    ))
                    : shops.map((s) => (
                        <Link
                            key={s.id}
                            href={s.href ?? "#"}
                            className="flex w-36 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-[color:var(--hm-border)] bg-[color:var(--hm-surface)] p-3 text-center transition-colors active:bg-[color:var(--hm-muted)]"
                        >
                            {s.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={s.avatar}
                                    alt=""
                                    loading="lazy"
                                    className="size-16 rounded-full border border-[color:var(--hm-border)] object-cover"
                                />
                            ) : (
                                <span className="flex size-16 items-center justify-center rounded-full bg-[color:var(--hm-brand-soft)] text-[color:var(--hm-brand)]">
                    <Store className="size-6" />
                  </span>
                            )}
                            <span className="line-clamp-1 w-full text-sm font-semibold text-[color:var(--hm-text)]">{s.name}</span>
                            {s.description && (
                                <span className="line-clamp-2 text-[11px] leading-5 text-[color:var(--hm-text-muted)]">
                    {s.description}
                  </span>
                            )}
                        </Link>
                    ))}
            </div>
        </section>
    );
}