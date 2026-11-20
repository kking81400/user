import { http } from "@/lib/api/http";
import { unwrap } from "@/lib/api/profile";

// پیشوند /api/v1 از قبل در baseURL فایل http.ts هست
export const productApi = {
    bookmark: async (id: string | number, action: "save" | "unsave") =>
        unwrap<unknown>(await http.post(`/user/products/${id}/bookmark`, { action })),
    like: async (id: string | number, action: "like" | "unlike") =>
        unwrap<unknown>(await http.post(`/user/products/${id}/like`, { action })),
};