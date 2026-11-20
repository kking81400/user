// src/components/product/product-gallery.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    images: string[];
    alt: string;
    /** overlay content (shop badge, follow button) */
    children?: React.ReactNode;
}

const DRAG_THRESHOLD = 40; // px a mouse drag must travel to change slide

/**
 * Image slider built on CSS scroll-snap (no library):
 * touch swipe, mouse drag, clickable dots, arrow buttons (hover devices), keyboard arrows. RTL-aware.
 */
export function ProductGallery({ images, alt, children }: Props) {
    const trackRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{ startX: number; startScroll: number; moved: number } | null>(null);
    const [index, setIndex] = useState(0);
    const [dragging, setDragging] = useState(false);

    const count = images.length;
    const isRtl = () => !!trackRef.current && getComputedStyle(trackRef.current).direction === "rtl";

    const currentIndex = useCallback(() => {
        const el = trackRef.current;
        if (!el || !el.clientWidth) return 0;
        return Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    }, []);

    const goTo = useCallback(
        (target: number) => {
            const el = trackRef.current;
            if (!el) return;
            const i = Math.max(0, Math.min(count - 1, target));
            const sign = getComputedStyle(el).direction === "rtl" ? -1 : 1; // scrollLeft is negative in RTL
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            el.scrollTo({ left: sign * i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
        },
        [count],
    );

    const onScroll = useCallback(() => {
        const next = currentIndex();
        setIndex((prev) => (prev === next ? prev : next));
    }, [currentIndex]);

    /* ---- mouse drag (touch already scrolls natively) ---- */
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== "mouse" || e.button !== 0 || count < 2) return;
        const el = trackRef.current;
        if (!el) return;
        drag.current = { startX: e.clientX, startScroll: el.scrollLeft, moved: 0 };
        el.setPointerCapture(e.pointerId);
        el.style.scrollSnapType = "none"; // let it follow the cursor freely
        setDragging(true);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        const el = trackRef.current;
        if (!d || !el) return;
        d.moved = e.clientX - d.startX;
        el.scrollLeft = d.startScroll - d.moved;
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        const el = trackRef.current;
        if (!d || !el) return;
        drag.current = null;
        el.releasePointerCapture(e.pointerId);
        el.style.scrollSnapType = "";
        setDragging(false);

        // LTR: dragging left → next slide. RTL is mirrored: dragging right → next slide.
        const startIndex = Math.round(Math.abs(d.startScroll) / el.clientWidth);
        if (Math.abs(d.moved) < DRAG_THRESHOLD) return goTo(startIndex);
        const draggedLeft = d.moved < 0;
        goTo(startIndex + (draggedLeft !== isRtl() ? 1 : -1));
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const toRight = e.key === "ArrowRight";
        // in RTL the next slide lies to the left
        goTo(index + (toRight === isRtl() ? -1 : 1));
    };

    if (count === 0) return <div className="aspect-[5/7] w-full bg-muted" />;

    return (
        <div className="group relative bg-muted">
            <div
                ref={trackRef}
                tabIndex={0}
                role="group"
                aria-roledescription="carousel"
                aria-label={alt}
                onScroll={onScroll}
                onKeyDown={onKeyDown}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cn(
                    "flex aspect-[5/7] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                    count > 1 && (dragging ? "cursor-grabbing" : "cursor-grab"),
                )}
            >
                {images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={src}
                        src={src}
                        alt={`${alt} (${i + 1}/${count})`}
                        loading={i < 2 ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                        className="h-full w-full shrink-0 select-none snap-center snap-always object-cover"
                    />
                ))}
            </div>

            {children}

            {count > 1 && (
                <>
                    {/* arrows — only on devices with hover (desktop) */}
                    <button
                        type="button"
                        aria-label="تصویر چپ"
                        onClick={() => goTo(index + (isRtl() ? 1 : -1))}
                        disabled={isRtl() ? index === count - 1 : index === 0}
                        className="absolute left-2 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black shadow disabled:opacity-0 [@media(hover:hover)]:grid"
                    >
                        <ChevronLeft className="size-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="تصویر راست"
                        onClick={() => goTo(index + (isRtl() ? -1 : 1))}
                        disabled={isRtl() ? index === 0 : index === count - 1}
                        className="absolute right-2 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black shadow disabled:opacity-0 [@media(hover:hover)]:grid"
                    >
                        <ChevronRight className="size-5" />
                    </button>

                    {/* dots */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
                        {images.map((src, i) => (
                            <button
                                key={src}
                                type="button"
                                aria-label={`تصویر ${i + 1}`}
                                aria-current={i === index}
                                onClick={() => goTo(i)}
                                className="pointer-events-auto flex h-4 items-center"
                            >
                <span
                    className={cn(
                        "h-1.5 rounded-full bg-white shadow-sm transition-all duration-300",
                        i === index ? "w-8" : "w-3 opacity-60",
                    )}
                />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}