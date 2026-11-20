// src/components/shop-profile/highlight-viewer.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Volume2, VolumeX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProfileHighlight } from "@/types/shop-profile";

const IMAGE_DURATION_MS = 5000;
const HOLD_MS = 200; // press longer than this = "hold to pause"
const MOVE_TOLERANCE_PX = 10;
const SWIPE_CLOSE_PX = 90;

const isRtl = () => getComputedStyle(document.body).direction === "rtl";

interface Gesture {
    x: number;
    y: number;
    held: boolean;
    moved: boolean;
    timer: number;
}

interface Props {
    items: ProfileHighlight[];
    startIndex: number;
    shopName: string;
    shopAvatar: string | null;
    /** called whenever a highlight is shown (used for the "seen" ring) */
    onViewed?: (id: number) => void;
    onClose: () => void;
}

/**
 * Instagram-style full-screen viewer for story highlights (image or video).
 * - segmented progress bar, images last 5s, videos play to the end
 * - tap the start third = previous, the rest = next (mirrored in RTL)
 * - press and hold = pause (UI hides), swipe down = close
 * - mute toggle for videos, next image is preloaded, Esc / arrow keys work
 */
export function HighlightViewer({ items, startIndex, shopName, shopAvatar, onViewed, onClose }: Props) {
    const [index, setIndex] = useState(startIndex);
    const [loadedId, setLoadedId] = useState<number | null>(null);
    const [failedId, setFailedId] = useState<number | null>(null);
    const [muted, setMuted] = useState(false);
    const [holding, setHolding] = useState(false);
    const [dragY, setDragY] = useState(0);

    const item = items[index];
    const loading = loadedId !== item.id;
    const failed = failedId === item.id;

    const videoRef = useRef<HTMLVideoElement>(null);
    const fillRef = useRef<HTMLSpanElement>(null);
    const progress = useRef(0);
    const pausedRef = useRef(false);
    const gesture = useRef<Gesture | null>(null);

    /* ---------- navigation ---------- */

    const go = useCallback(
        (to: number) => {
            if (to >= items.length) return onClose();
            if (to < 0) {
                // first item: "previous" restarts it
                progress.current = 0;
                if (videoRef.current) videoRef.current.currentTime = 0;
                return;
            }
            setIndex(to);
        },
        [items.length, onClose],
    );
    const next = useCallback(() => go(index + 1), [go, index]);
    const prev = useCallback(() => go(index - 1), [go, index]);

    /* ---------- progress (no re-render per frame) ---------- */

    useEffect(() => {
        if (loading) return;
        const useVideo = item.isVideo && !failed;
        progress.current = 0;
        let raf = 0;
        let last = performance.now();

        const tick = (now: number) => {
            const dt = now - last;
            last = now;
            if (!pausedRef.current) {
                if (useVideo) {
                    const v = videoRef.current;
                    if (v && v.duration) progress.current = v.currentTime / v.duration;
                } else {
                    progress.current += dt / IMAGE_DURATION_MS;
                }
                if (fillRef.current) fillRef.current.style.transform = `scaleX(${Math.min(progress.current, 1)})`;
                if (progress.current >= 1) {
                    next();
                    return;
                }
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [loading, failed, item.isVideo, next]);

    /* ---------- side effects ---------- */

    useEffect(() => {
        onViewed?.(item.id);
    }, [item.id, onViewed]);

    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = muted;
    }, [muted, index]);

    // preload the next image so the transition is instant
    useEffect(() => {
        const upcoming = items[index + 1];
        if (upcoming && !upcoming.isVideo) new Image().src = upcoming.cover;
    }, [items, index]);

    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") return onClose();
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            const forward = isRtl() ? e.key === "ArrowLeft" : e.key === "ArrowRight";
            forward ? next() : prev();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [next, prev, onClose]);

    /* ---------- gestures ---------- */

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const g: Gesture = { x: e.clientX, y: e.clientY, held: false, moved: false, timer: 0 };
        g.timer = window.setTimeout(() => {
            g.held = true;
            pausedRef.current = true;
            videoRef.current?.pause();
            setHolding(true);
        }, HOLD_MS);
        gesture.current = g;
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const g = gesture.current;
        if (!g) return;
        const dy = e.clientY - g.y;
        if (!g.moved && (Math.abs(dy) > MOVE_TOLERANCE_PX || Math.abs(e.clientX - g.x) > MOVE_TOLERANCE_PX)) {
            g.moved = true;
            window.clearTimeout(g.timer);
        }
        if (g.moved && !g.held && dy > 0) setDragY(dy);
    };

    const endGesture = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
        const g = gesture.current;
        if (!g) return;
        gesture.current = null;
        window.clearTimeout(g.timer);
        setDragY(0);

        if (g.held) {
            pausedRef.current = false;
            setHolding(false);
            void videoRef.current?.play().catch(() => {});
            return;
        }
        if (cancelled) return;
        if (g.moved) {
            if (e.clientY - g.y > SWIPE_CLOSE_PX) onClose();
            return;
        }

        // plain tap
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const onStartSide = isRtl() ? x > (rect.width * 2) / 3 : x < rect.width / 3;
        if (onStartSide) prev();
        else next();
    };

    /* ---------- media ---------- */

    const onVideoReady = () => {
        setLoadedId(item.id);
        const v = videoRef.current;
        if (!v) return;
        v.muted = muted;
        // autoplay with sound can be blocked → fall back to muted
        v.play().catch(() => {
            setMuted(true);
            v.muted = true;
            v.play().catch(() => {});
        });
    };

    const onMediaError = () => {
        setFailedId(item.id);
        setLoadedId(item.id);
    };

    const dragging = dragY > 0;

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-black" role="dialog" aria-modal="true" aria-label={item.title}>
            <div
                className="relative mx-auto h-full w-full max-w-md overflow-hidden bg-black"
                style={{
                    transform: dragging ? `translateY(${dragY}px) scale(${1 - Math.min(dragY / 1200, 0.1)})` : undefined,
                    opacity: dragging ? 1 - Math.min(dragY / 500, 0.5) : 1,
                    transition: dragging ? "none" : "transform 200ms, opacity 200ms",
                }}
            >
                {/* media + gesture layer */}
                <div
                    className="absolute inset-0 touch-none select-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={(e) => endGesture(e)}
                    onPointerCancel={(e) => endGesture(e, true)}
                >
                    {item.isVideo && !failed ? (
                        <video
                            key={item.id}
                            ref={videoRef}
                            src={item.cover}
                            playsInline
                            preload="auto"
                            onLoadedData={onVideoReady}
                            onError={onMediaError}
                            className="size-full object-contain"
                        />
                    ) : (
                        !failed && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                key={item.id}
                                src={item.cover}
                                alt={item.title}
                                draggable={false}
                                decoding="async"
                                onLoad={() => setLoadedId(item.id)}
                                onError={onMediaError}
                                ref={(el) => {
                                    // cached images can finish before React attaches onLoad
                                    if (el?.complete && el.naturalWidth > 0) setLoadedId(item.id);
                                }}
                                className="size-full object-contain"
                            />
                        )
                    )}

                    {loading && (
                        <span className="absolute inset-0 grid place-items-center">
              <span className="size-9 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
                    )}
                    {failed && (
                        <span className="absolute inset-0 grid place-items-center text-sm text-white/80">
              بارگذاری نشد
            </span>
                    )}
                </div>

                {/* top overlay: progress bars + header (hidden while holding) */}
                <div
                    className={cn(
                        "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] transition-opacity duration-150",
                        holding && "opacity-0",
                    )}
                >
                    <div className="flex gap-1" aria-hidden>
                        {items.map((h, i) => (
                            <span key={h.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                <span
                    ref={i === index ? fillRef : undefined}
                    className="block size-full origin-left bg-white rtl:origin-right"
                    style={{ transform: `scaleX(${i < index ? 1 : 0})` }}
                />
              </span>
                        ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
              <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-white/20">
                {shopAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shopAvatar} alt="" className="size-full object-cover" />
                ) : (
                    <span className="grid size-full place-items-center text-sm font-bold text-white">
                    {shopName.charAt(0)}
                  </span>
                )}
              </span>
                            <span className="min-w-0 text-white">
                <span className="block truncate text-sm font-bold">{shopName}</span>
                <span className="block truncate text-xs text-white/80">{item.title}</span>
              </span>
                        </div>

                        <div className="pointer-events-auto flex shrink-0 items-center gap-1">
                            {item.isVideo && !failed && (
                                <button
                                    type="button"
                                    onClick={() => setMuted((m) => !m)}
                                    aria-label={muted ? "پخش صدا" : "بی‌صدا"}
                                    className="grid size-9 place-items-center rounded-full text-white active:bg-white/20"
                                >
                                    {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="بستن"
                                className="grid size-9 place-items-center rounded-full text-white active:bg-white/20"
                            >
                                <X className="size-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}