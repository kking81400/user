// src/lib/product-detail-normalize.ts
import type { ProductDetail, ProductShop, ProductVariant } from "@/types/product-detail";

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null;
const num = (v: unknown): number | null => {
    const n = typeof v === "string" ? Number(v) : v;
    return typeof n === "number" && Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const strList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x !== "") : [];
const unique = <T,>(list: T[]) => Array.from(new Set(list));

function toVariant(raw: Raw): ProductVariant | null {
    const id = num(raw.variant_id ?? raw.id);
    if (id === null) return null;
    const attrs: Raw = isObj(raw.attributes) ? raw.attributes : {};
    return {
        id,
        stock: num(raw.stock) ?? 0,
        priceAdjustment: num(raw.price_adjustment) ?? 0,
        size: str(attrs.size),
        color: str(attrs.color),
        colorCode: str(attrs.color_code),
    };
}

function toShop(raw: unknown): ProductShop | null {
    if (!isObj(raw)) return null;
    const id = num(raw.id);
    if (id === null) return null;
    return {
        id,
        name: str(raw.shop_name ?? raw.name) ?? "",    profileImage: str(raw.profile_image),
        isFollowed: raw.is_followed === true,
    };
}

/** gallery: ["url"] or media: [{ media_url, is_main }] (main image first). */
function toGallery(body: Raw): string[] {
    const plain = strList(body.gallery);
    if (plain.length) return plain;

    const media = Array.isArray(body.media) ? body.media.filter(isObj) : [];
    return media
        .flatMap((m) => {
            const url = str(m.media_url ?? m.url);
            return url ? [{ url, main: m.is_main === true }] : [];
        })
        .sort((a, b) => Number(b.main) - Number(a.main))
        .map((m) => m.url);
}

/** Expects the unwrapped body: { media, variants, product, shop } (older shape: options/gallery also works). */
export function normalizeProductDetail(body: unknown): ProductDetail | null {
    if (!isObj(body) || !isObj(body.product)) return null;
    const p = body.product;
    const id = num(p.id);
    if (id === null) return null;

    const variants = (Array.isArray(body.variants) ? body.variants : [])
        .filter(isObj)
        .map(toVariant)
        .filter((v): v is ProductVariant => v !== null);

    const options: Raw = isObj(body.options) ? body.options : {};
    const colorNames = strList(options.colors);
    const sizeNames = strList(options.sizes);

    const colors = (
        colorNames.length
            ? colorNames
            : unique(variants.map((v) => v.color).filter((c): c is string => c !== null))
    ).map((name) => ({
        name,
        code: variants.find((v) => v.color === name && v.colorCode)?.colorCode ?? null,
    }));

    const sizes = sizeNames.length
        ? sizeNames
        : unique(variants.map((v) => v.size).filter((s): s is string => s !== null));

    return {
        id,
        name: str(p.name) ?? "",
        category: str(p.category),
        sellPrice: num(p.sell_price) ?? 0,
        discountPrice: num(p.discount_price),
        shop: toShop(body.shop ?? p.shop),
        gallery: toGallery(body),
        colors,
        sizes,
        variants,
        description: str(p.description),
        isLiked: (p.is_liked ?? p.liked) === true,
        isSaved: (p.is_saved ?? p.is_bookmarked) === true,
    };
}