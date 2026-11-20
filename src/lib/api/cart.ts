import { http } from "@/lib/api/http";
import { unwrap } from "@/lib/api/profile";
import { normalizeCart } from "@/lib/cart-normalize";

/**
 * کاربر مهمان: شناسه‌ی مهمان باید در هدر برود؛ کاربر لاگین‌شده فقط توکن.
 * ⚠️ اسم کلید localStorage و اسم هدر را مطابق بک‌اند خودتان تنظیم کنید.
 */
// const GUEST_STORAGE_KEY = "guest_id";
// const GUEST_HEADER = "x-guest-id";

function guestHeaders(): Record<string, string> | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const id = window.localStorage.getItem(GUEST_STORAGE_KEY);
        return id ? { [GUEST_HEADER]: id } : undefined;
    } catch {
        return undefined;
    }
}

// پیشوند /api/v1 از قبل در baseURL فایل http.ts هست
export const cartApi = {
    get: async () => normalizeCart(unwrap<unknown>(await http.get("/user/cart/", { headers: guestHeaders() }))),

    add: async (p: { product_id: number | string; variant_id: number | string; quantity: number }) =>
        unwrap<unknown>(await http.post("/user/cart/", p, { headers: guestHeaders() })),

    update: async (itemId: string | number, quantity: number) =>
        unwrap<unknown>(await http.put(`/user/cart/item/${itemId}`, { quantity }, { headers: guestHeaders() })),

    remove: async (itemId: string | number, quantity: number) =>
        unwrap<unknown>(
            await http.delete(`/user/cart/item/${itemId}`, { data: { quantity }, headers: guestHeaders() })
        ),
};