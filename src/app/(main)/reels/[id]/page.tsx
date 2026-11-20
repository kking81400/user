'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { http, unwrap } from '@/lib/api/http';
import ReelPlayerFeed from '@/components/home/reel-player-feed';
import CommentsModal from '@/components/home/comments-modal';
import ProductsModal from '@/components/home/products-modal';
import QuickViewModal from '@/components/home/quick-view-modal';

// ⚠️ آدرس دریافت یک ریل با شناسه. اگر در بک‌اند آدرس دیگری دارد همین‌جا عوض کنید.
const reelDetailUrl = (id: number) => `/user/reels/${id}`;

export default function ReelDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const reelId = Number(params.id);

    // category_id مخصوص همان ریلی است که در گرید کلیک شده
    const categoryId = Number(searchParams.get('category_id'));
    const isValidCategory = Number.isInteger(categoryId) && categoryId > 0;
    // seed بزرگ‌تر از بیشینه عدد امن JS است، پس به‌صورت رشته نگه داشته می‌شود
    const seed = searchParams.get('seed') ?? '';

    const [activeCommentsReelId, setActiveCommentsReelId] = useState<number | null>(null);
    const [activeProductsReelId, setActiveProductsReelId] = useState<number | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    // ریلی که کاربر روی آن کلیک کرده (فید آن را exclude می‌کند، پس جدا گرفته می‌شود)
    const { data: currentReel, isLoading: isReelLoading } = useQuery({
        queryKey: ['reel-detail', reelId],
        queryFn: async () => {
            const response = await http.get(reelDetailUrl(reelId));
            const payload: any = unwrap(response.data);
            return payload?.item ?? payload?.reel ?? payload;
        },
        enabled: Number.isInteger(reelId) && reelId > 0,
        retry: false,
    });

    // بقیه ویدیوهای هم‌دسته برای اسکرول (به جز ریل انتخاب‌شده)
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['explore-feed-reels', categoryId, seed, reelId],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await http.get('/user/explore/feed', {
                params: {
                    category_id: categoryId,
                    page: pageParam,
                    limit: 10,
                    // ارسال شناسه ویدیو به عنوان exclude_id برای جلوگیری از تکرار
                    exclude_id: reelId,
                    ...(seed ? { seed } : {}),
                },
            });
            return unwrap(response.data);
        },
        getNextPageParam: (lastPage) =>
            lastPage?.meta?.has_more ? lastPage.meta.page + 1 : undefined,
        initialPageParam: 1,
        enabled: isValidCategory && Number.isInteger(reelId),
    });

    // ریل انتخاب‌شده اول لیست، بعد فید؛ بدون ویدیوی تکراری
    const allItems = useMemo(() => {
        const seen = new Set<number>();
        const list: any[] = [];
        const push = (item: any) => {
            if (item?.reel_id && item.video_url && !seen.has(item.reel_id)) {
                seen.add(item.reel_id);
                list.push(item);
            }
        };
        push(currentReel);
        for (const page of data?.pages ?? []) {
            for (const item of page?.items ?? []) push(item);
        }
        return list;
    }, [currentReel, data]);

    if (!isValidCategory) {
        return (
            <div className="w-full h-[calc(100dvh-4rem)] bg-black flex items-center justify-center text-white text-sm">
                category_id در آدرس صفحه ارسال نشده است
            </div>
        );
    }

    if (isLoading || isReelLoading) {
        return (
            <div className="w-full h-[calc(100dvh-4rem)] bg-black flex items-center justify-center text-white text-sm">
                در حال بارگذاری فید ویدیوها...
            </div>
        );
    }

    return (
        <div className="relative w-full h-[calc(100dvh-4rem)] bg-black overflow-hidden">
            <button
                onClick={() => router.back()}
                aria-label="بستن"
                className="absolute top-4 right-4 z-40 p-2 rounded-full bg-black/40 backdrop-blur-md text-white cursor-pointer"
            >
                <X className="w-5 h-5" />
            </button>

            {allItems.length > 0 ? (
                <ReelPlayerFeed
                    initialReels={allItems}
                    currentIndex={0}
                    onOpenComments={setActiveCommentsReelId}
                    onOpenProducts={setActiveProductsReelId}
                    onLoadMore={() => {
                        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    }}
                    hasMore={!!hasNextPage}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm">
                    ویدیویی برای نمایش وجود ندارد
                </div>
            )}

            <CommentsModal
                isOpen={!!activeCommentsReelId}
                onClose={() => setActiveCommentsReelId(null)}
                reelId={activeCommentsReelId || reelId}
            />

            <ProductsModal
                isOpen={!!activeProductsReelId}
                onClose={() => setActiveProductsReelId(null)}
                reelId={activeProductsReelId || reelId}
                onSelectProduct={(id) => setSelectedProductId(id)}
            />

            <QuickViewModal
                productId={selectedProductId}
                onClose={() => setSelectedProductId(null)}
            />
        </div>
    );
}