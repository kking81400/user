"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useStories } from "@/hooks/use-home";
import type { Story } from "@/types/home";
import { cn } from "@/lib/utils";
import "./home.css";

const IMAGE_DURATION = 5000;

export function StoriesRow() {
    const { data, isLoading, isError } = useStories();
    const [openId, setOpenId] = React.useState<Story["id"] | null>(null);
    const [seen, setSeen] = React.useState<Set<Story["id"]>>(new Set());

    const stories = data ?? [];
    const startIndex = stories.findIndex((s) => s.id === openId);

    // خطا یا نبودنِ استوری نباید صفحه را خراب کند؛ فقط بخش را پنهان می‌کنیم
    if (isError || (!isLoading && stories.length === 0)) return null;

    return (
        <>
            <div className="hm-no-scrollbar flex gap-4 overflow-x-auto px-4 py-4" aria-label="استوری‌ها">
                {isLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex w-[68px] shrink-0 flex-col items-center gap-2">
                            <div className="size-[68px] animate-pulse rounded-full bg-[color:var(--hm-skeleton)]" />
                            <div className="h-2.5 w-12 animate-pulse rounded bg-[color:var(--hm-skeleton)]" />
                        </div>
                    ))
                    : stories.map((s) => {
                        const isSeen = s.seen || seen.has(s.id);
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setOpenId(s.id)}
                                className="flex w-[68px] shrink-0 flex-col items-center gap-2"
                            >
                  <span
                      className={cn(
                          "rounded-full p-[2.5px]",
                          isSeen
                              ? "bg-[color:var(--hm-border)]"
                              : "bg-gradient-to-tr from-[color:var(--hm-ring-from)] to-[color:var(--hm-ring-to)]"
                      )}
                  >
                    <span className="block rounded-full bg-[color:var(--hm-bg)] p-[2.5px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={s.avatar ?? s.media[0].url}
                            alt=""
                            loading="lazy"
                            className="size-[58px] rounded-full bg-[color:var(--hm-muted)] object-cover"
                        />
                    </span>
                  </span>
                                <span className="w-full truncate text-center text-[11px] text-[color:var(--hm-text-muted)]">
                    {s.name}
                  </span>
                            </button>
                        );
                    })}
            </div>

            {startIndex >= 0 && (
                <StoryViewer
                    key={String(openId)}
                    stories={stories}
                    startIndex={startIndex}
                    onSeen={(id) => setSeen((prev) => new Set(prev).add(id))}
                    onClose={() => setOpenId(null)}
                />
            )}
        </>
    );
}

function StoryViewer({
                         stories,
                         startIndex,
                         onSeen,
                         onClose,
                     }: {
    stories: Story[];
    startIndex: number;
    onSeen: (id: Story["id"]) => void;
    onClose: () => void;
}) {
    const [si, setSi] = React.useState(startIndex); // استوری فعلی
    const [mi, setMi] = React.useState(0); // آیتم فعلی داخل استوری
    const story = stories[si];
    const media = story.media[mi];

    const next = React.useCallback(() => {
        if (mi < story.media.length - 1) return setMi(mi + 1);
        if (si < stories.length - 1) {
            setSi(si + 1);
            setMi(0);
        } else onClose();
    }, [mi, si, story.media.length, stories.length, onClose]);

    const prev = () => {
        if (mi > 0) return setMi(mi - 1);
        if (si > 0) {
            setSi(si - 1);
            setMi(0);
        }
    };

    React.useEffect(() => onSeen(story.id), [story.id, onSeen]);

    // عکس‌ها بعد از چند ثانیه خودکار جلو می‌روند؛ ویدیو با پایان خودش
    React.useEffect(() => {
        if (media.type !== "image") return;
        const t = setTimeout(next, IMAGE_DURATION);
        return () => clearTimeout(t);
    }, [media, next]);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") next();
            if (e.key === "ArrowRight") prev();
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [next, onClose]);

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[110] flex items-center justify-center bg-black">
            <div className="relative h-full w-full max-w-md overflow-hidden bg-black">
                {media.type === "video" ? (
                    <video
                        key={media.url}
                        src={media.url}
                        autoPlay
                        playsInline
                        muted
                        onEnded={next}
                        className="size-full object-contain"
                    />
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={media.url} src={media.url} alt="" className="size-full object-contain" />
                )}

                {/* نوار پیشرفت */}
                <div className="absolute inset-x-3 top-3 flex gap-1" dir="ltr">
                    {story.media.map((_, i) => (
                        <span key={i} className="h-0.5 flex-1 overflow-hidden rounded bg-white/30">
              <span
                  className={cn("block h-full bg-white", i < mi && "w-full", i > mi && "w-0")}
                  style={
                      i === mi && media.type === "image"
                          ? { animation: `hm-progress ${IMAGE_DURATION}ms linear forwards` }
                          : i === mi
                              ? { width: "100%" }
                              : undefined
                  }
              />
            </span>
                    ))}
                </div>

                <div className="absolute inset-x-3 top-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        {story.avatar && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={story.avatar} alt="" className="size-8 rounded-full object-cover" />
                        )}
                        <span className="text-sm font-medium drop-shadow">{story.name}</span>
                    </div>
                    <button type="button" onClick={onClose} aria-label="بستن" className="rounded-full bg-black/40 p-1.5 text-white">
                        <X className="size-5" />
                    </button>
                </div>

                {/* نواحی لمسی: سمت چپ بعدی، سمت راست قبلی (مطابق جهت راست‌به‌چپ) */}
                <button type="button" aria-label="بعدی" onClick={next} className="absolute inset-y-16 start-0 w-1/2" />
                <button type="button" aria-label="قبلی" onClick={prev} className="absolute inset-y-16 end-0 w-1/2" />
            </div>

            <style>{`@keyframes hm-progress{from{width:0}to{width:100%}}`}</style>
        </div>
    );
}