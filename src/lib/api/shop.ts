// src/lib/api/shop.ts
import { http, unwrap } from "./http";
import { normalizeCategories, normalizeChildren, normalizeProducts } from "@/lib/shop-normalize";
import type { ShopCategory, ShopProductsPage } from "@/types/shop";

export const SHOP_PAGE_SIZE = 10;

/** categoryId = null → all products (no category_id param). */
export async function fetchShopProducts(params: {
    categoryId: number | null;
    page: number;
    limit?: number;
}): Promise<ShopProductsPage> {
    const { categoryId, page, limit = SHOP_PAGE_SIZE } = params;
    const { data } = await http.get("/user/products/search", {
        params: { page, limit, ...(categoryId !== null && { category_id: categoryId }) },
    });
    return normalizeProducts(unwrap(data), page);
}

/** Result count for the "نمایش N نتیجه" button — asks for one item and reads meta.total_count. */
export async function fetchShopCount(categoryId: number | null): Promise<number> {
    const res = await fetchShopProducts({ categoryId, page: 1, limit: 1 });
    return res.total;
}

export async function fetchShopLevel1(): Promise<ShopCategory[]> {
    const { data } = await http.get("/user/filters/level1");
    return normalizeCategories(data);
}

export async function fetchShopLevel2(parentId: number): Promise<ShopCategory[]> {
    const { data } = await http.get(`/user/filters/level2/${parentId}`);
    return normalizeChildren(data);
}