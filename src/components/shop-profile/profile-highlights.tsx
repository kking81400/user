// src/components/shop-profile/profile-highlights.tsx
"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HighlightViewer } from "@/components/shop-profile/highlight-viewer";
import { useShopProfile } from "@/hooks/use-shop-profile";
import { cn } from "@/lib/utils";
import type { ProfileHighlight } from "@/types/shop-profile";

const SEEN_KEY = "shop-highlights-seen";

function readSeen(): Set<number> {
    try {
        const raw = localStorage.getItem(SEEN_KEY);
        const list: unknown = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(list) ? list.filter((n): n is number => typeof n === "number") : []);
    } catch {
        return new Set();
    }
}

function writeSeen(seen: Set<number>) {
    try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen).slice(-200)));
    } catch {
        /* storage unavailable */
    }
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

/**
 * Story highlights row. Tapping a circle opens the Instagram-style viewer.
 * The shop's name/avatar come from the already-cached profile query, so the page needs no extra props.
 */
function ProfileHighlightsImpl({ items }: { items: ProfileHighlight[] }) {
    const params = useParams<{ shopname: string }>();
    const { data: shop } = useShopProfile(safeDecode(params?.shopname ?? ""));

    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [seen, setSeen] = useState<Set<number>>(() => new Set());

    // read after mount so server and client markup match
    useEffect(() => setSeen(readSeen()), []);

    const markSeen = useCallback((id: number) => {
        setSeen((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            writeSeen(next);
            return next;
        });
    }, []);
    const closeViewer = useCallback(() => setOpenIndex(null), []);

    if (!items.length) return null;

    return (
        <>
            <ul className="mt-4 flex gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((h, i) => (
                    <li key={h.id} className="shrink-0">
                        <button
                            type="button"
                            onClick={() => setOpenIndex(i)}
                            aria-label={`مشاهده هایلایت ${h.title}`}
                            className="flex w-[72px] flex-col items-center gap-1.5 active:opacity-80"
                        >
              <span
                  className={cn(
                      "relative block size-[72px] rounded-full border-2 bg-muted p-0.5",
                      seen.has(h.id) ? "border-border" : "border-primary",
                  )}
              >
                <span className="relative block size-full overflow-hidden rounded-full bg-muted">
                  {h.isVideo ? (
                      <video
                          src={`${h.cover}#t=0.1`}
                          muted
                          playsInline
                          preload="metadata"
                          className="absolute inset-0 size-full object-cover"
                      />
                  ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                          src={h.cover}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="absolute inset-0 size-full object-cover"
                      />
                  )}
                </span>
              </span>
                            <span className="line-clamp-1 w-full text-center text-xs text-foreground">{h.title}</span>
                        </button>
                    </li>
                ))}
            </ul>

            {openIndex !== null && (
                <HighlightViewer
                    items={items}
                    startIndex={openIndex}
                    shopName={shop?.name ?? ""}
                    shopAvatar={shop?.avatar ?? null}
                    onViewed={markSeen}
                    onClose={closeViewer}
                />
            )}
        </>
    );
}

export const ProfileHighlights = memo(ProfileHighlightsImpl);