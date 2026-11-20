"use client";

import * as React from "react";
import Link from "next/link";
import type { ProductPost } from "@/types/home";
import "./home.css";

/**
 * کارت تمام‌عرض تب «صفحه اصلی».
 * فروشگاه‌دار: آواتار + نام + توضیح بالا-چپ؛ بدون فروشگاه: عنوان درشت وسط + «مشاهده بیشتر».
 * متن همیشه سفید روی گرادیان تیره است تا در لایت و دارک خوانا بماند.
 */
function FeedCardBase({ post, priority = false }: { post: ProductPost; priority?: boolean }) {
    const { shop } = post;
    const href = shop.href;
    const hasShop = Boolean(shop.name);

    return (
        <article className="relative aspect-[5/8] w-full overflow-hidden bg-[color:var(--hm-skeleton)]">
            {post.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={post.image}
                    alt={post.name}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    className="absolute inset-0 size-full object-cover"
                />
            )}
            <div
                aria-hidden
                className={
                    hasShop
                        ? "absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent"
                        : "absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                }
            />
            <Link href={href} aria-label={post.name || shop.name} className="absolute inset-0" />

            {hasShop ? (
                <div className="pointer-events-none absolute left-5 top-14 flex max-w-[55%] flex-col items-start gap-2 text-white">
                    {shop.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shop.avatar} alt="" className="size-14 rounded-full border border-white/40 object-cover" />
                    ) : (
                        <span className="flex size-14 items-center justify-center rounded-full bg-black/45 text-base font-bold">
              {shop.name[0]}
            </span>
                    )}
                    <span className="block text-start">
            <span className="block text-sm font-bold drop-shadow">{shop.name}</span>
                        {post.description && (
                            <span className="mt-0.5 line-clamp-2 block text-[11px] leading-5 text-white/90 drop-shadow">
                {post.description}
              </span>
                        )}
          </span>
                </div>
            ) : (
                <div className="pointer-events-none absolute inset-x-6 bottom-10 flex flex-col items-center gap-2 text-center text-white">
                    <h3 className="text-3xl font-bold leading-10 drop-shadow-md">{post.name}</h3>
                    <span className="text-xs text-white/90">مشاهده بیشتر</span>
                </div>
            )}
        </article>
    );
}

export const FeedCard = React.memo(FeedCardBase);

export function FeedSkeleton({ count = 2 }: { count?: number }) {
    return (
        <div>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="aspect-[5/8] w-full animate-pulse bg-[color:var(--hm-skeleton)]" />
            ))}
        </div>
    );
}