"use client";

import { keepPreviousData, useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import {
    fetchShopCount,
    fetchShopLevel1,
    fetchShopLevel2,
    fetchShopProducts,
} from "@/lib/api/shop";
import type { ShopFilterGroup } from "@/types/shop";

const FILTERS_STALE_TIME = 10 * 60 * 1000;

export function useShopProducts(categoryId: number | null) {
    return useInfiniteQuery({
        queryKey: ["shop", "products", categoryId],
        queryFn: ({ pageParam }) => fetchShopProducts({ categoryId, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });
}

/** Level-1 categories, each with its level-2 children — fetched when the filter sheet opens. */
export function useShopFilterGroups(): { groups: ShopFilterGroup[]; isLoading: boolean } {
    const level1 = useQuery({
        queryKey: ["shop", "filters", "level1"],
        queryFn: fetchShopLevel1,
        staleTime: FILTERS_STALE_TIME,
    });

    const roots = level1.data ?? [];

    const level2 = useQueries({
        queries: roots.map((root) => ({
            queryKey: ["shop", "filters", "level2", root.id],
            queryFn: () => fetchShopLevel2(root.id),
            staleTime: FILTERS_STALE_TIME,
        })),
    });

    const groups = roots.map((root, i) => ({
        root,
        children: level2[i]?.data ?? [],
        loading: level2[i]?.isLoading ?? true,
    }));

    return { groups, isLoading: level1.isLoading };
}

/** Live result count for the filter sheet's draft selection. */
export function useShopCount(categoryId: number | null) {
    return useQuery({
        queryKey: ["shop", "count", categoryId],
        queryFn: () => fetchShopCount(categoryId),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });
}