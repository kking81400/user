import { http } from "@/lib/api/http";
import { toArray, unwrap } from "@/lib/api/profile";
import type { Address, AddressPayload } from "@/types/profile";

// پیشوند /api/v1 از قبل در baseURL فایل http.ts هست
const BASE = "/user/home/addresses";

/** پاسخ لیست به شکل { addresses: [...] } است؛ آرایه‌ی مستقیم هم پشتیبانی می‌شود */
function extractAddresses(raw: unknown): Address[] {
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        const list = (raw as { addresses?: unknown }).addresses;
        if (Array.isArray(list)) return list as Address[];
    }
    return toArray<Address>(raw);
}

export const addressApi = {
    list: async () => extractAddresses(unwrap<unknown>(await http.get(BASE))),
    get: async (id: number) => unwrap<Address>(await http.get(`${BASE}/${id}`)),
    create: async (payload: AddressPayload) =>
        unwrap<unknown>(await http.post(BASE, payload)),
    update: async (id: number, payload: AddressPayload) =>
        unwrap<unknown>(await http.put(`${BASE}/${id}`, payload)),
    remove: async (id: number) => unwrap<unknown>(await http.delete(`${BASE}/${id}`)),
};