'use client';

import React, { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, ShoppingBag, Volume2, VolumeX, Play } from 'lucide-react';
import Hls from 'hls.js';
import { useLikeReel } from '@/hooks/use-reels';
import { useAuthStore } from '@/store/auth-store';
import ReelSaveButton from './reel-save-button'; // ۱. ایمپورت کامپوننت ذخیره

interface ReelItem {
    reel_id: number;
    category_id: number;
    video_url: string;
    cover_url: string;
    caption: string;
    interactions: {
        likes_count: number;
        comments_count: number;
        views_count: number;
        is_liked: boolean;
        is_saved: boolean;
        saves_count?: number;
    };
    shop: {
        shop_id: number;
        user_name: string;
        profile_image?: string;
        is_followed: boolean;
    };
}

interface ReelPlayerFeedProps {
    initialReels?: ReelItem[];
    currentIndex?: number;
    onOpenComments: (reelId: number) => void;
    onOpenProducts: (reelId: number) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

const safeUrl = (url?: string) => {
    if (!url) return '';
    try {
        return encodeURI(decodeURI(url));
    } catch {
        return url;
    }
};

export default function ReelPlayerFeed({
                                           initialReels = [],
                                           currentIndex = 0,
                                           onOpenComments,
                                           onOpenProducts,
                                           onLoadMore,
                                           hasMore,
                                       }: ReelPlayerFeedProps) {
    const [activeIdx, setActiveIdx] = useState<number>(currentIndex);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const requestedLengthRef = useRef<number>(0);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container || initialReels.length === 0) return;
        const targetIndex = Math.min(currentIndex, initialReels.length - 1);
        container.scrollTop = targetIndex * container.clientHeight;
        setActiveIdx(targetIndex);
    }, [currentIndex, initialReels.length]);

    const handleScroll = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const container = containerRef.current;
            if (!container || !container.clientHeight || initialReels.length === 0) return;

            const rawIndex = Math.round(container.scrollTop / container.clientHeight);
            const reelsLen = initialReels.length;

            let index = rawIndex;
            if (rawIndex >= reelsLen) {
                index = 0;
                container.scrollTop = 0;
            }

            setActiveIdx((prev) => (index !== prev && index >= 0 && index < reelsLen ? index : prev));
        });
    }, [initialReels.length]);

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    useEffect(() => {
        if (!hasMore || !onLoadMore) return;
        const reelsLen = initialReels?.length || 0;
        if (activeIdx >= reelsLen - 3 && requestedLengthRef.current !== reelsLen) {
            requestedLengthRef.current = reelsLen;
            onLoadMore();
        }
    }, [activeIdx, initialReels?.length, hasMore, onLoadMore]);

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute top-0 left-0 right-0 w-full overflow-y-scroll bg-black select-none z-30 [&::-webkit-scrollbar]:hidden"
            style={{
                height: 'calc(100dvh - 4rem)',
                scrollSnapType: 'y mandatory',
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}
        >
            {initialReels.map((reel, idx) => {
                const isActive = idx === activeIdx;
                const isNearActive = idx >= activeIdx && idx <= activeIdx + 3;
                const shouldPreload = idx === activeIdx + 1 || idx === activeIdx + 2 || idx === activeIdx + 3;

                return (
                    <div
                        key={`${reel.reel_id}-${idx}`}
                        className="w-full shrink-0 bg-black flex justify-center overflow-hidden"
                        style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', height: 'calc(100dvh - 4rem)' }}
                    >
                        <ReelSlide
                            reel={reel}
                            isActive={isActive}
                            isNearActive={isNearActive}
                            shouldPreload={shouldPreload}
                            isMuted={isMuted}
                            onToggleMute={() => setIsMuted((m) => !m)}
                            onForceMute={() => setIsMuted(true)}
                            onOpenComments={onOpenComments}
                            onOpenProducts={onOpenProducts}
                        />
                    </div>
                );
            })}
        </div>
    );
}

interface ReelSlideProps {
    reel: ReelItem;
    isActive: boolean;
    isNearActive: boolean;
    shouldPreload: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
    onForceMute: () => void;
    onOpenComments: (reelId: number) => void;
    onOpenProducts: (reelId: number) => void;
}

const ReelSlide = memo(function ReelSlide({
                                              reel,
                                              isActive,
                                              isNearActive,
                                              shouldPreload,
                                              isMuted,
                                              onToggleMute,
                                              onForceMute,
                                              onOpenComments,
                                              onOpenProducts,
                                          }: ReelSlideProps) {
    const videoUrl = safeUrl(reel.video_url);
    const coverUrl = safeUrl(reel.cover_url);

    const [isLiked, setIsLiked] = useState(reel.interactions.is_liked);
    const [likesCount, setLikesCount] = useState(reel.interactions.likes_count);
    const [showHeart, setShowHeart] = useState(false);
    const likeMutation = useLikeReel();
    const heartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const applyLike = useCallback(
        (like: boolean) => {
            const token = useAuthStore.getState().accessToken;
            if (!token) {
                alert('لطفاً برای لایک کردن ویدیو وارد حساب کاربری خود شوید.');
                return;
            }

            setIsLiked(like);
            setLikesCount((prev) => Math.max(0, prev + (like ? 1 : -1)));
            likeMutation.mutate({ reelId: reel.reel_id, action: like ? 'like' : 'unlike' });
        },
        [likeMutation, reel.reel_id],
    );

    const handleLikeClick = () => applyLike(!isLiked);

    const handleDoubleTap = () => {
        const token = useAuthStore.getState().accessToken;
        if (!token) return;

        if (!isLiked) applyLike(true);
        setShowHeart(true);
        if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
        heartTimerRef.current = setTimeout(() => setShowHeart(false), 800);
    };

    useEffect(() => {
        return () => {
            if (heartTimerRef.current) clearTimeout(heartTimerRef.current);
        };
    }, []);

    const handleShare = async () => {
        const url = `${window.location.origin}${window.location.pathname.replace(/\/[^/]+\/?$/, `/${reel.reel_id}`)}`;
        try {
            if (navigator.share) {
                await navigator.share({ title: reel.shop?.user_name, text: reel.caption, url });
            } else {
                await navigator.clipboard.writeText(url);
            }
        } catch {}
    };

    return (
        <div className="relative h-full w-full max-w-[460px] overflow-hidden bg-black">
            {isNearActive ? (
                <ReelVideo
                    videoUrl={videoUrl}
                    coverUrl={coverUrl}
                    isActive={isActive}
                    shouldPreload={shouldPreload}
                    isMuted={isMuted}
                    onForceMute={onForceMute}
                    onDoubleTap={handleDoubleTap}
                />
            ) : (
                coverUrl && (
                    <Image src={coverUrl} alt="Reel cover" fill unoptimized className="object-cover" />
                )
            )}

            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

            {showHeart && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <Heart className="w-24 h-24 text-white fill-white drop-shadow-xl animate-ping" />
                </div>
            )}

            <button
                onClick={onToggleMute}
                aria-label={isMuted ? 'فعال‌سازی صدا' : 'قطع صدا'}
                className="absolute top-4 left-4 p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white z-20 cursor-pointer"
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <div className="absolute bottom-4 left-4 right-20 z-20 flex flex-col gap-2 text-white">
                <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-zinc-800">
                        {reel.shop?.profile_image && (
                            <Image
                                src={safeUrl(reel.shop.profile_image)}
                                alt={reel.shop.user_name}
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        )}
                    </div>
                    <span className="text-xs font-semibold">{reel.shop?.user_name}</span>
                </div>

                {reel.caption && (
                    <p className="text-xs text-white/90 line-clamp-2 leading-relaxed">{reel.caption}</p>
                )}

                <div
                    onClick={() => onOpenProducts(reel.reel_id)}
                    className="flex items-center justify-between bg-white/15 backdrop-blur-md border border-white/10 p-2.5 rounded-2xl cursor-pointer hover:bg-white/20 transition max-w-xs"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-white/80">محصول متصل به ویدیو</p>
                            <p className="text-xs font-bold">مشاهده جزئیات و خرید</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ۲. منوی دکمه‌های اکشن سمت راست */}
            <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5 text-white">
                {/* دکمه لایک */}
                <button onClick={handleLikeClick} className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="p-3 rounded-full bg-black/30 backdrop-blur-md transition group-hover:scale-110 group-active:scale-90">
                        <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                    </div>
                    <span className="text-xs font-medium">{likesCount}</span>
                </button>

                {/* دکمه کامنت */}
                <button
                    onClick={() => {
                        const token = useAuthStore.getState().accessToken;
                        if (!token) {
                            alert('لطفاً برای ثبت کامنت وارد حساب کاربری خود شوید.');
                            return;
                        }
                        onOpenComments(reel.reel_id);
                    }}
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                    <div className="p-3 rounded-full bg-black/30 backdrop-blur-md transition group-hover:scale-110">
                        <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{reel.interactions.comments_count}</span>
                </button>

                {/* ۳. قرارگیری دکمه ذخیره (Save) دقیقا در این قسمت */}
                <ReelSaveButton
                    reelId={reel.reel_id}
                    initialIsSaved={reel.interactions.is_saved}
                    savedCount={reel.interactions.saves_count ?? 0}
                />

                {/* دکمه اشتراک‌گذاری */}
                <button onClick={handleShare} className="flex flex-col items-center gap-1 group cursor-pointer">
                    <div className="p-3 rounded-full bg-black/30 backdrop-blur-md transition group-hover:scale-110">
                        <Share2 className="w-5 h-5" />
                    </div>
                </button>
            </div>
        </div>
    );
});

interface ReelVideoProps {
    videoUrl: string;
    coverUrl: string;
    isActive: boolean;
    shouldPreload: boolean;
    isMuted: boolean;
    onForceMute: () => void;
    onDoubleTap: () => void;
}

function ReelVideo({ videoUrl, coverUrl, isActive, shouldPreload, isMuted, onForceMute, onDoubleTap }: ReelVideoProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const progressRef = useRef<HTMLDivElement | null>(null);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    const isHls = videoUrl.includes('.m3u8');

    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = isMuted;
    }, [isMuted]);

    const safePlay = useCallback(
        async (video: HTMLVideoElement) => {
            try {
                await video.play();
            } catch {
                if (!video.muted) {
                    video.muted = true;
                    onForceMute();
                    video.play().catch(() => {});
                }
            }
        },
        [onForceMute],
    );

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoUrl) return;

        if (isActive) {
            setIsPaused(false);

            if (isHls) {
                if (Hls.isSupported()) {
                    if (!hlsRef.current) {
                        const hls = new Hls({
                            enableWorker: true,
                            maxBufferLength: 30,
                            maxMaxBufferLength: 60
                        });
                        hlsRef.current = hls;
                        hls.loadSource(videoUrl);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, () => safePlay(video));
                    } else {
                        safePlay(video);
                    }
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    if (!video.src) video.src = videoUrl;
                    safePlay(video);
                }
            } else {
                if (!video.getAttribute('src')) video.src = videoUrl;
                safePlay(video);
            }
        } else {
            if (shouldPreload && !isHls) {
                if (!video.getAttribute('src')) {
                    video.preload = 'auto';
                    video.src = videoUrl;
                }
            } else if (!isActive) {
                video.pause();
                video.currentTime = 0;
                if (hlsRef.current && !shouldPreload) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                    video.removeAttribute('src');
                    video.load();
                }
            }
        }
    }, [isActive, shouldPreload, videoUrl, isHls, safePlay]);

    useEffect(() => {
        const video = videoRef.current;
        return () => {
            if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
            if (video) {
                video.pause();
                video.removeAttribute('src');
                video.load();
            }
        };
    }, []);

    const handleTap = () => {
        if (tapTimerRef.current) {
            clearTimeout(tapTimerRef.current);
            tapTimerRef.current = null;
            onDoubleTap();
            return;
        }
        tapTimerRef.current = setTimeout(() => {
            tapTimerRef.current = null;
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) {
                safePlay(video);
                setIsPaused(false);
            } else {
                video.pause();
                setIsPaused(true);
            }
        }, 250);
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video && progressRef.current && video.duration) {
            progressRef.current.style.width = `${(video.currentTime / video.duration) * 100}%`;
        }
    };

    return (
        <>
            <video
                ref={videoRef}
                poster={coverUrl}
                className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                loop
                playsInline
                preload="metadata"
                onClick={handleTap}
                onTimeUpdate={handleTimeUpdate}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
            />

            {isPaused && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="p-5 rounded-full bg-black/40 backdrop-blur-md">
                        <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                </div>
            )}

            {isActive && isBuffering && !isPaused && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-9 h-9 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
            )}

            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-white/20 z-20 pointer-events-none">
                <div ref={progressRef} className="h-full w-0 bg-white" />
            </div>
        </>
    );
}