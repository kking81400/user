// src/lib/api/product-detail.ts
import { http, unwrap } from "./http";
import { normalizeProductDetail } from "@/lib/product-detail-normalize";
import type { ProductDetail } from "@/types/product-detail";

export async function fetchProductDetail(id: number): Promise<ProductDetail> {
    const { data } = await http.get(`/user/products/${id}`);
    const product = normalizeProductDetail(unwrap(data));
    if (!product) throw new Error("Invalid product response");
    return product;
}

export function setProductLike(id: number, like: boolean) {
    return http.post(`/user/products/${id}/like`, { action: like ? "like" : "unlike" });
}

export function setShopFollow(shopId: number, follow: boolean) {
    return http.post(`/user/shops/${shopId}/follow`, { action: follow ? "follow" : "unfollow" });
}

export function setProductBookmark(id: number, save: boolean) {
    return http.post(`/user/products/${id}/bookmark`, { action: save ? "save" : "unsave" });
}