import { assetUrl } from "@/lib/media";
import { extractList } from "@/lib/home-normalize";
import type { Cart, CartItem } from "@/types/cart";

type R = Record<string, unknown>;
const isObj = (v: unknown): v is R => !!v && typeof v === "object" && !Array.isArray(v);

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: unknown, d = 0) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : d;
};

/** جمع کل را از روی آیتم‌ها دوباره حساب می‌کند (برای به‌روزرسانی فوری UI) */
export function recalc(items: CartItem[], discount: number): Cart {
    const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    return { items, total, discount, payable: Math.max(0, total - discount) };
}

/**
 * پاسخ GET /user/cart:
 * { summary: { total_price, total_discount, final_payable_amount },
 *   items: [{ cart_item_id, product_id, variant_id, product_name, image_url,
 *             attributes: { color, color_code, size }, unit_price, original_price,
 *             quantity, stock, is_available, error_message }] }
 */
export function normalizeCart(raw: unknown): Cart {
    const root: R = isObj(raw) ? raw : {};
    const summary: R = isObj(root.summary) ? root.summary : {};
    const items: CartItem[] = [];

    extractList(root).forEach((r, i) => {
        if (!isObj(r)) return;
        const attrs: R = isObj(r.attributes) ? r.attributes : {};
        const unit = num(r.unit_price);
        const original = r.original_price == null ? undefined : num(r.original_price);

        items.push({
            id: (r.cart_item_id ?? r.item_id ?? r.id ?? `i${i}`) as string | number,
            productId: r.product_id as string | number | undefined,
            variantId: r.variant_id as string | number | undefined,
            name: str(r.product_name) ?? str(r.name) ?? "",
            image: assetUrl(str(r.image_url) ?? str(r.image)),
            color: str(attrs.color),
            colorCode: str(attrs.color_code),
            size: str(attrs.size),
            unitPrice: unit,
            originalPrice: original != null && original > unit ? original : undefined,
            quantity: Math.max(1, num(r.quantity, 1)),
            stock: r.stock == null ? undefined : num(r.stock),
            available: r.is_available !== false,
            error: str(r.error_message),
        });
    });

    const cart = recalc(items, num(summary.total_discount));
    // اگر سرور جمع‌ها را فرستاده، همان را نشان بده
    if (summary.total_price != null) cart.total = num(summary.total_price, cart.total);
    if (summary.final_payable_amount != null) cart.payable = num(summary.final_payable_amount, cart.payable);
    return cart;
}