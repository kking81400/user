// src/lib/api/shop-profile.ts
import { http, unwrap } from "./http";
import {
    normalizeCollections,
    normalizeProductList,
    normalizeReelsPage,
    normalizeReviews,
    normalizeShopProfile,
} from "@/lib/shop-profile-normalize";
import type { ShopProductsPage } from "@/types/shop";
import type { ShopCollection, ShopProfile, ShopReelsPage, ShopReview } from "@/types/shop-profile";

export const PROFILE_PAGE_SIZE = 18; // multiple of 3 → the 3-column grid never ends with a gap

const byId = (shopId: number) => `/user/shop-profile/id/${shopId}`;

export async function fetchShopProfile(shopName: string): Promise<ShopProfile> {
    const { data } = await http.get(`/user/shop-profile/${encodeURIComponent(shopName)}`);
    const profile = normalizeShopProfile(unwrap(data));
    if (!profile) throw new Error("Invalid shop profile response");
    return profile;
}

export async function fetchShopProfileProducts(params: {
    shopId: number;
    page: number;
    categoryId?: number;
    brandId?: number;
}): Promise<ShopProductsPage> {
    const { shopId, page, categoryId, brandId } = params;
    const { data } = await http.get(`${byId(shopId)}/products`, {
        params: {
            page,
            limit: PROFILE_PAGE_SIZE,
            ...(categoryId !== undefined && { category_id: categoryId }),
            ...(brandId !== undefined && { brand_id: brandId }),
        },
    });
    return normalizeProductList(unwrap(data), page);
}

export async function fetchShopReels(params: {
    shopId: number;
    page: number;
}): Promise<ShopReelsPage> {
    const { shopId, page } = params;
    const { data } = await http.get(`${byId(shopId)}/reels`, {
        params: { page, limit: PROFILE_PAGE_SIZE },
    });
    return normalizeReelsPage(unwrap(data), page);
}

export async function fetchShopCollections(shopId: number): Promise<ShopCollection[]> {
    const { data } = await http.get(`${byId(shopId)}/collections`);
    return normalizeCollections(unwrap(data));
}

export async function fetchCollectionProducts(
    shopId: number,
    collectionId: number,
): Promise<ShopProductsPage> {
    const { data } = await http.get(`${byId(shopId)}/collections/${collectionId}/products`);
    return normalizeProductList(unwrap(data), 1);
}

export async function fetchShopReviews(shopId: number): Promise<ShopReview[]> {
    const { data } = await http.get(`${byId(shopId)}/reviews`);
    return normalizeReviews(unwrap(data));
}