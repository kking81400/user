import { http } from "@/lib/api/http";

/**
 * API مسیر تصویرها را نسبی می‌دهد (مثلاً /uploads/products/x.webp).
 * این تابع آن را به آدرس کامل سرور تبدیل می‌کند. ترتیب تشخیص آدرس سرور:
 *  1) متغیر محیطی NEXT_PUBLIC_MEDIA_URL (مثلاً http://127.0.0.1:3000)
 *  2) origin مربوط به baseURL فایل http.ts (اگر کامل باشد)
 *  3) http://127.0.0.1:3000
 */
const DEFAULT_ORIGIN = "http://127.0.0.1:3000";

function mediaOrigin(): string {
    const env = process.env.NEXT_PUBLIC_MEDIA_URL;
    if (env) return env.replace(/\/$/, "");
    const base = (http as unknown as { defaults?: { baseURL?: string } }).defaults?.baseURL;
    if (base && /^https?:\/\//i.test(base)) {
        try {
            return new URL(base).origin;
        } catch {
            /* ادامه با مقدار پیش‌فرض */
        }
    }
    return DEFAULT_ORIGIN;
}

export function assetUrl(path?: string | null): string | undefined {
    if (!path || !path.trim()) return undefined;
    const p = path.trim();
    if (/^(https?:|data:|blob:)/i.test(p)) return p;
    return mediaOrigin() + (p.startsWith("/") ? p : `/${p}`);
}