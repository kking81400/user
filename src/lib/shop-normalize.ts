// src/lib/shop-normalize.ts
import type { ShopCategory, ShopProduct, ShopProductsPage } from "@/types/shop";

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const num = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

/**
 * Expects the unwrapped body of products/search:
 * { items: [{ product_id, product_name, media: { main_image, blur_hash } }], meta: { page, has_more, total_count } }
 */
export function normalizeProducts(body: unknown, fallbackPage: number): ShopProductsPage {
    const b: Raw = isObj(body) ? body : {};
    const meta: Raw = isObj(b.meta) ? b.meta : {};
    const items: ShopProduct[] = [];

    for (const raw of Array.isArray(b.items) ? b.items : []) {
        if (!isObj(raw)) continue;
        const id = num(raw.product_id ?? raw.id);
        if (id === null) continue;

        const media: Raw = isObj(raw.media) ? raw.media : {};
        // shop-profile lists send `image: { url, blur_hash }`
        const img: Raw = isObj(raw.image) ? raw.image : {};
        const w = num(media.width);
        const h = num(media.height);

        items.push({
            id,
            title: str(raw.product_name ?? raw.name) ?? "",
            image: str(media.main_image ?? img.url ?? raw.main_image ?? raw.image),
            blurHash: str(media.blur_hash ?? img.blur_hash ?? raw.blur_hash),
            aspect: w && h ? w / h : null,
        });
    }

    return {
        items,
        page: num(meta.page) ?? fallbackPage,
        hasNext: meta.has_more === true,
        total: num(meta.total_count) ?? items.length,
    };
}

/* ---------- filters ---------- */

function unwrapList(payload: unknown, depth = 0): Raw[] {
    if (Array.isArray(payload)) return payload.filter(isObj);
    if (!isObj(payload) || depth > 3) return [];
    for (const key of ["data", "items", "results", "categories"]) {
        const list = unwrapList(payload[key], depth + 1);
        if (list.length) return list;
    }
    return [];
}

function pickImage(raw: Raw): string | null {
    const media = isObj(raw.media) ? raw.media.main_image : null;
    const c = raw.image ?? raw.icon ?? raw.image_url ?? raw.thumbnail ?? media;
    if (typeof c === "string") return c || null;
    if (isObj(c)) return str(c.url ?? c.src);
    return null;
}

/** level1 returns { parent_id, parent_name, children }, children may use id/name or category_id/category_name. */
function toCategory(raw: Raw): ShopCategory | null {
    const id = num(raw.id ?? raw.category_id ?? raw.child_id ?? raw.parent_id);
    if (id === null) return null;
    return {
        id,
        name:
            str(raw.name ?? raw.category_name ?? raw.child_name ?? raw.parent_name ?? raw.title) ?? "",
        image: pickImage(raw),
    };
}

const notNull = (c: ShopCategory | null): c is ShopCategory => c !== null;

/** level1: [{ parent_id, parent_name, children: [] }] */
export function normalizeCategories(payload: unknown): ShopCategory[] {
    return unwrapList(payload).map(toCategory).filter(notNull);
}

/** level2/{id}: accepts a plain list, { children: [] }, or [{ ..., children: [] }]. */
export function normalizeChildren(payload: unknown): ShopCategory[] {
    const data = isObj(payload) && "data" in payload ? payload.data : payload;
    let raws: Raw[];

    if (isObj(data) && Array.isArray(data.children)) {
        raws = data.children.filter(isObj);
    } else if (Array.isArray(data)) {
        const nested = data.flatMap((d) =>
            isObj(d) && Array.isArray(d.children) ? d.children.filter(isObj) : [],
        );
        raws = nested.length ? nested : data.filter(isObj);
    } else {
        raws = unwrapList(data);
    }

    return raws.map(toCategory).filter(notNull);
}