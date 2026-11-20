import type { FeedItem, ShopRef, Story, StoryMedia, SuggestedShop } from "@/types/home";

/**
 * پاسخ‌های خانه را به مدل ثابت تبدیل می‌کند. چون اسم فیلدها در API ممکن است متفاوت باشد،
 * چند نام رایج بررسی می‌شود. اگر فیلدی جور درنیامد، فقط همین فایل را اصلاح کنید.
 */

type R = Record<string, unknown>;

const isObj = (v: unknown): v is R => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

function pick(o: R | undefined, keys: string[]): string | undefined {
    if (!o) return undefined;
    for (const k of keys) {
        const v = str(o[k]);
        if (v) return v;
    }
    return undefined;
}

const IMAGE_KEYS = [
    "image", "image_url", "media_url", "cover", "cover_url", "thumbnail", "thumbnail_url",
    "banner", "banner_url", "photo", "picture", "avatar_url", "logo", "url",
];

/** آدرس تصویر از خود آبجکت، یا از اولین عنصر media/images */
function imageOf(o: R | undefined): string | undefined {
    if (!o) return undefined;
    const direct = pick(o, IMAGE_KEYS);
    if (direct) return direct;
    for (const k of ["media", "images", "photos"]) {
        const list = o[k];
        if (Array.isArray(list) && list.length) {
            const first = list[0];
            const s = isObj(first) ? imageOf(first) : str(first);
            if (s) return s;
        }
    }
    return imageOf(isObj(o.image) ? o.image : undefined);
}

/** پیدا کردن آرایه در پاسخ: خود آرایه، یا اولین کلید آرایه‌ای شناخته‌شده */
export function extractList(v: unknown): unknown[] {
    if (Array.isArray(v)) return v;
    if (!isObj(v)) return [];
    for (const k of ["items", "results", "data", "list", "feed", "posts", "stories", "shops", "banners", "explore", "following"]) {
        if (Array.isArray(v[k])) return v[k] as unknown[];
    }
    const firstArray = Object.values(v).find(Array.isArray);
    return (firstArray as unknown[]) ?? [];
}

function toShop(o: R | undefined): ShopRef | undefined {
    if (!o) return undefined;
    const name = pick(o, ["name", "title", "shop_name", "store_name"]);
    if (!name) return undefined;
    const id = (o.id ?? o.shop_id ?? o.slug) as string | number | undefined;
    return {
        id,
        name,
        avatar: imageOf(o),
        description: pick(o, ["description", "bio", "about", "subtitle", "caption"]),
        href: pick(o, ["link", "href", "url_path"]) ?? (id != null ? `/shop?id=${id}` : undefined),
    };
}

export function normalizeFeed(raw: unknown): FeedItem[] {
    const out: FeedItem[] = [];
    extractList(raw).forEach((r, i) => {
        if (!isObj(r)) return;
        const image = imageOf(r);
        if (!image) return;
        const shopObj = isObj(r.shop) ? r.shop : isObj(r.store) ? r.store : isObj(r.owner) ? r.owner : undefined;
        const shop = toShop(shopObj);
        out.push({
            id: (r.id ?? `${i}`) as string | number,
            image,
            title: pick(r, ["title", "name", "caption"]),
            subtitle: pick(r, ["description", "subtitle", "text"]),
            href: pick(r, ["link", "href", "url_path"]),
            shop,
        });
    });
    return out;
}

export function normalizeStories(raw: unknown): Story[] {
    const out: Story[] = [];
    extractList(raw).forEach((r, i) => {
        if (!isObj(r)) return;
        const shop = isObj(r.shop) ? r.shop : isObj(r.store) ? r.store : undefined;
        const name = pick(r, ["name", "title", "shop_name", "username"]) ?? pick(shop, ["name", "title"]) ?? "";
        const avatar = pick(r, ["avatar", "avatar_url", "logo", "profile_image"]) ?? imageOf(shop) ?? imageOf(r);

        const media: StoryMedia[] = [];
        for (const k of ["items", "media", "stories", "slides"]) {
            const list = r[k];
            if (!Array.isArray(list)) continue;
            for (const m of list) {
                const url = isObj(m) ? imageOf(m) ?? pick(m, ["video_url", "video"]) : str(m);
                if (!url) continue;
                const type = isObj(m) && (m.type === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url)) ? "video" : "image";
                media.push({ url, type });
            }
            if (media.length) break;
        }
        if (!media.length) {
            const url = imageOf(r);
            if (url) media.push({ url, type: /\.(mp4|webm|mov)(\?|$)/i.test(url) ? "video" : "image" });
        }
        if (!media.length) return;

        out.push({
            id: (r.id ?? `${i}`) as string | number,
            name,
            avatar,
            media,
            seen: Boolean(r.seen ?? r.is_seen ?? r.viewed),
        });
    });
    return out;
}

export function normalizeShops(raw: unknown): SuggestedShop[] {
    const out: SuggestedShop[] = [];
    extractList(raw).forEach((r, i) => {
        if (!isObj(r)) return;
        const shop = toShop(r);
        if (!shop) return;
        out.push({ ...shop, id: shop.id ?? i });
    });
    return out;
}