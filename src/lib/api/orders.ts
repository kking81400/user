import { http } from "@/lib/api/http";
import { unwrap } from "@/lib/api/profile";

export type PaymentMethod = "online" | "wallet";
export type ShippingMethod = "post";

export interface OrderPayload {
    address_id: number | string;
    payment_method: PaymentMethod;
    shipping_method: ShippingMethod;
}

// پیشوند /api/v1 از قبل در baseURL فایل http.ts هست
const BASE = "/user/home/orders";

export const orderApi = {
    submit: async (p: OrderPayload) => unwrap<unknown>(await http.post(`${BASE}/submit`, p)),
    retryPayment: async (orderNumber: string | number, p: OrderPayload) =>
        unwrap<unknown>(await http.post(`${BASE}/${orderNumber}/retry-payment`, p)),
    list: async (params: { page?: number; limit?: number; tab?: string } = {}) =>
        unwrap<unknown>(await http.get(`${BASE}/list`, { params: { page: 1, limit: 10, ...params } })),
    get: async (id: string | number) => unwrap<unknown>(await http.get(`${BASE}/${id}`)),
};

/** از پاسخ ثبت سفارش، لینک درگاه و شماره‌ی سفارش را (با نام‌های رایج) پیدا می‌کند */
export function readSubmitResult(raw: unknown): { paymentUrl?: string; orderNumber?: string } {
    const pick = (o: unknown, keys: string[]): string | undefined => {
        if (!o || typeof o !== "object") return undefined;
        for (const k of keys) {
            const v = (o as Record<string, unknown>)[k];
            if (typeof v === "string" && v) return v;
            if (typeof v === "number") return String(v);
        }
        return undefined;
    };
    const nested = raw && typeof raw === "object" ? (raw as Record<string, unknown>).payment : undefined;
    return {
        paymentUrl:
            pick(raw, ["payment_url", "pay_url", "redirect_url", "gateway_url", "payment_link", "url"]) ??
            pick(nested, ["payment_url", "pay_url", "redirect_url", "gateway_url", "payment_link", "url"]),
        orderNumber: pick(raw, ["order_number", "orderNumber", "order_id", "id"]),
    };
}