// src/lib/shop-profile-normalize.ts
import { normalizeProducts } from "@/lib/shop-normalize";
import type {
    ProfileHighlight,
    ShopCollection,
    ShopProfile,
    ShopReelsPage,
    ShopReview,
} from "@/types/shop-profile";
import type { ShopProductsPage } from "@/types/shop";

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const num = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

/** First key that has a real value. */
const pick = (raw: Raw, ...keys: string[]): unknown => {
    for (const k of keys) {
        const v = raw[k];
        if (v !== undefined && v !== null && v !== "") return v;
    }
    return undefined;
};

function imageOf(v: unknown): string | null {
    if (typeof v === "string") return v || null;
    if (isObj(v)) return str(pick(v, "main_image", "url", "src", "media_url", "thumbnail"));
    return null;
}

/** Finds the array of records however the API wraps it. */
function listOf(body: unknown, depth = 0): Raw[] {
    if (Array.isArray(body)) return body.filter(isObj);
    if (!isObj(body) || depth > 3) return [];
    for (const key of ["items", "data", "results", "reels", "collections", "reviews", "products"]) {
        const list = listOf(body[key], depth + 1);
        if (list.length) return list;
    }
    return [];
}

/* ---------- profile ---------- */

/** links may be a string, a list of strings, or a list of { url } objects. */
function firstLink(v: unknown): string | null {
    if (typeof v === "string") return v || null;
    if (Array.isArray(v)) {
        for (const x of v) {
            const l = firstLink(x);
            if (l) return l;
        }
        return null;
    }
    if (isObj(v)) return str(pick(v, "url", "href", "website"));
    return null;
}

const VIDEO_RE = /\.(mp4|webm|mov)(\?|#|$)/i;

function normalizeHighlights(v: unknown): ProfileHighlight[] {
    if (!Array.isArray(v)) return [];
    return v.filter(isObj).flatMap((raw) => {
        const id = num(raw.id);
        const cover = str(pick(raw, "cover_url", "cover", "image"));
        if (id === null || !cover) return [];
        return [{ id, title: str(raw.title) ?? "", cover, isVideo: VIDEO_RE.test(cover) }];
    });
}

/** Expects { shop_info, stats, interactions, highlights } (flat or { shop } shapes also work). */
export function normalizeShopProfile(body: unknown): ShopProfile | null {
    if (!isObj(body)) return null;
    const info = isObj(body.shop_info) ? body.shop_info : isObj(body.shop) ? body.shop : {};
    const stats = isObj(body.stats) ? body.stats : {};
    const interactions = isObj(body.interactions) ? body.interactions : {};
    const r: Raw = { ...body, ...info, ...stats, ...interactions };

    const id = num(pick(r, "shop_id", "id"));
    if (id === null) return null;

    const rating = num(pick(r, "average_rating", "rating", "avg_rating"));
    return {
        id,
        username: str(pick(r, "user_name", "username")) ?? "",
        name: str(pick(r, "shop_name", "name")) ?? "",
        slogan: str(r.slogan),
        bio: str(pick(r, "bio", "description")),
        location: str(pick(r, "address", "location", "city")),
        website: firstLink(r.links ?? r.website),
        avatar: imageOf(pick(r, "profile_image", "avatar", "logo")),
        verified: pick(r, "is_verified", "verified") === true,
        productsCount: num(pick(r, "products_count", "total_products")),
        followersCount: num(pick(r, "followers_count", "followers")),
        rating: rating !== null && rating > 0 ? rating : null, // 0 = not rated yet
        isFollowed: pick(r, "is_followed", "followed") === true,
        highlights: normalizeHighlights(r.highlights),
    };
}

/* ---------- lists ---------- */

/** Same item shape as products/search, but tolerant to a bare array or `pagination`. */
export function normalizeProductList(body: unknown, page: number): ShopProductsPage {
    const b: Raw = isObj(body) ? body : {};
    const items = Array.isArray(body) ? body : Array.isArray(b.items) ? b.items : listOf(body);
    return normalizeProducts({ items, meta: b.meta ?? b.pagination }, page);
}

/** Expects { items: [{ reel_id, cover_url, video_url, views_count, likes_count }], meta: { page, has_more } }. */
export function normalizeReelsPage(body: unknown, page: number): ShopReelsPage {
    const b: Raw = isObj(body) ? body : {};
    const meta: Raw = isObj(b.meta) ? b.meta : isObj(b.pagination) ? b.pagination : {};

    const items = listOf(body).flatMap((raw) => {
        const id = num(pick(raw, "reel_id", "id"));
        if (id === null) return [];
        return [
            {
                id,
                cover: imageOf(pick(raw, "cover_url", "thumbnail", "thumbnail_url", "cover", "poster")),
                videoUrl: str(pick(raw, "video_url", "video")),
                views: num(pick(raw, "views_count", "views", "view_count")),
                likes: num(pick(raw, "likes_count", "likes")),
            },
        ];
    });

    return { items, page: num(meta.page) ?? page, hasNext: meta.has_more === true };
}

export function normalizeCollections(body: unknown): ShopCollection[] {
    return listOf(body).flatMap((raw) => {
        const id = num(pick(raw, "id", "collection_id"));
        if (id === null) return [];
        return [
            {
                id,
                name: str(pick(raw, "name", "title", "collection_name")) ?? "",
                cover: imageOf(pick(raw, "image_url", "cover", "cover_image", "image", "thumbnail", "media")),
                productsCount: num(pick(raw, "items_count", "products_count", "product_count", "count")),
            },
        ];
    });
}

export function normalizeReviews(body: unknown): ShopReview[] {
    return listOf(body).flatMap((raw) => {
        const id = num(pick(raw, "id", "review_id"));
        if (id === null) return [];
        const user: Raw = isObj(raw.user) ? raw.user : {};
        return [
            {
                id,
                author:
                    str(pick(user, "name", "full_name", "username") ?? pick(raw, "user_name", "author")) ??
                    "کاربر",
                avatar: imageOf(pick(user, "profile_image", "avatar") ?? pick(raw, "user_avatar")),
                rating: num(pick(raw, "rating", "score", "stars")),
                text: str(pick(raw, "comment", "text", "body", "content")) ?? "",
                date: str(pick(raw, "created_at", "date")),
            },
        ];
    });
}