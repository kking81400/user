"use client";

import * as React from "react";
import { useExplore, useFollowing } from "@/hooks/use-home";
import { useProductActions } from "@/hooks/use-product-actions";
import { HomeHeader, type HomeTab } from "@/components/home/home-header";
import { StoriesRow } from "@/components/home/stories-row";
import { FeedList } from "@/components/home/feed-list";
import { FeedCard, FeedSkeleton } from "@/components/home/feed-card";
import { PostCard, PostSkeleton } from "@/components/home/post-card";
import BottomNav from "@/components/layout/bottom-nav";
import type { ProductPost } from "@/types/home";
import "@/components/home/home.css";

const getKey = (p: ProductPost) => p.id;

/**
 * صفحه‌ی خانه با دو تب و دو طرح متفاوت:
 *  - «صفحه اصلی»: کارت‌های تمام‌عرض (explore)
 *  - «فروشندگان من»: استوری + کارت محصول (following)
 * هر دو فید هم‌زمان لود و mount می‌مانند و فقط hidden می‌شوند؛ پس تعویض تب فوری است
 * و جای اسکرول هر تب هم حفظ می‌شود.
 */
export default function HomePage() {
    const [tab, setTab] = React.useState<HomeTab>("explore");
    const scrollY = React.useRef<Record<HomeTab, number>>({ explore: 0, following: 0 });

    const explore = useExplore();
    const following = useFollowing();
    const { bookmark, like } = useProductActions();

    const { mutate: mutateLike } = like;
    const { mutate: mutateSave } = bookmark;
    const onLike = React.useCallback((id: ProductPost["id"], l: boolean) => mutateLike({ id, like: l }), [mutateLike]);
    const onSave = React.useCallback((id: ProductPost["id"], s: boolean) => mutateSave({ id, save: s }), [mutateSave]);

    const changeTab = React.useCallback(
        (next: HomeTab) => {
            if (next === tab) return;
            scrollY.current[tab] = window.scrollY;
            setTab(next);
        },
        [tab]
    );

    React.useLayoutEffect(() => {
        window.scrollTo(0, scrollY.current[tab]);
    }, [tab]);

    const renderExplore = React.useCallback(
        (p: ProductPost, i: number) => <FeedCard post={p} priority={i === 0} />,
        []
    );
    const renderFollowing = React.useCallback(
        (p: ProductPost, i: number) => <PostCard post={p} priority={i === 0} onLike={onLike} onSave={onSave} />,
        [onLike, onSave]
    );

    return (
        <main className="mx-auto min-h-dvh w-full max-w-md bg-[color:var(--hm-bg)] pb-24 text-[color:var(--hm-text)]">
            <HomeHeader value={tab} onChange={changeTab} />

            <section hidden={tab !== "explore"}>
                <FeedList
                    active={tab === "explore"}
                    items={explore.items}
                    getKey={getKey}
                    renderItem={renderExplore}
                    skeleton={<FeedSkeleton />}
                    isLoading={explore.isLoading}
                    isError={explore.isError}
                    onRetry={() => explore.refetch()}
                    hasNextPage={explore.hasNextPage}
                    isFetchingNextPage={explore.isFetchingNextPage}
                    fetchNextPage={() => explore.fetchNextPage()}
                    emptyText="هنوز محتوایی برای نمایش وجود ندارد."
                    suggestAfter={2}
                />
            </section>

            <section hidden={tab !== "following"}>
                <StoriesRow />
                <FeedList
                    active={tab === "following"}
                    items={following.items}
                    getKey={getKey}
                    renderItem={renderFollowing}
                    skeleton={<PostSkeleton />}
                    isLoading={following.isLoading}
                    isError={following.isError}
                    onRetry={() => following.refetch()}
                    hasNextPage={following.hasNextPage}
                    isFetchingNextPage={following.isFetchingNextPage}
                    fetchNextPage={() => following.fetchNextPage()}
                    emptyText="هنوز فروشگاهی را دنبال نکرده‌اید. از پیشنهادهای زیر شروع کنید."
                />
            </section>

            <BottomNav />
        </main>
    );
}