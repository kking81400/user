// src/hooks/use-shop-profile.ts
"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
    fetchCollectionProducts,
    fetchShopCollections,
    fetchShopProfile,
    fetchShopProfileProducts,
    fetchShopReels,
    fetchShopReviews,
} from "@/lib/api/shop-profile";

const STALE = 60 * 1000;

/**
 * Tab data is only requested when its tab is opened (`enabled`) and then stays in the
 * React Query cache, so switching tabs back and forth is instant — like Instagram.
 */

export function useShopProfile(shopName: string) {
    return useQuery({
        queryKey: ["shop-profile", shopName],
        queryFn: () => fetchShopProfile(shopName),
        staleTime: STALE,
    });
}

export function useShopProfileProducts(shopId: number) {
    return useInfiniteQuery({
        queryKey: ["shop-profile", shopId, "products"],
        queryFn: ({ pageParam }) => fetchShopProfileProducts({ shopId, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
        staleTime: STALE,
    });
}

/** Shared by the profile grid and the reel viewer page, so both read the same cache. */
export function useShopReels(shopId: number) {
    return useInfiniteQuery({
        queryKey: ["shop-profile", shopId, "reels"],
        queryFn: ({ pageParam }) => fetchShopReels({ shopId, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
        enabled: shopId > 0,
        staleTime: STALE,
    });
}

export function useShopCollections(shopId: number) {
    return useQuery({
        queryKey: ["shop-profile", shopId, "collections"],
        queryFn: () => fetchShopCollections(shopId),
        staleTime: STALE,
    });
}

export function useCollectionProducts(shopId: number, collectionId: number) {
    return useQuery({
        queryKey: ["shop-profile", shopId, "collections", collectionId],
        queryFn: () => fetchCollectionProducts(shopId, collectionId),
        staleTime: STALE,
    });
}

export function useShopReviews(shopId: number) {
    return useQuery({
        queryKey: ["shop-profile", shopId, "reviews"],
        queryFn: () => fetchShopReviews(shopId),
        staleTime: STALE,
    });
}