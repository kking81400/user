import { http } from "@/lib/api/http";
import type {
  Avatar,
  FinancialInfoPayload,
  PersonalInfoPayload,
  ProfileData,
} from "@/types/profile";

// پیشوند /api/v1 از قبل در baseURL فایل http.ts هست
const BASE = "/user/home/profile";

/**
 * پاسخ‌ها به شکل { code, message, data, error } هستند.
 * چه interceptor پاسخ را باز کرده باشد چه نه، لایه‌ها را تا رسیدن به data اصلی کنار می‌زنیم.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unwrap<T>(res: any): T {
  let v = res;
  for (let i = 0; i < 3; i++) {
    if (
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        "data" in v &&
        (i === 0 || "code" in v || "status" in v)
    ) {
      v = v.data;
    } else break;
  }
  return v as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toArray = <T,>(v: any): T[] =>
    Array.isArray(v) ? v : Array.isArray(v?.items) ? v.items : Array.isArray(v?.results) ? v.results : [];

export const profileApi = {
  get: async () => unwrap<ProfileData>(await http.get(`${BASE}/`)),
  settings: async () =>
      unwrap<Record<string, unknown>>(await http.get(`${BASE}/settings`)),
  recommendations: async () =>
      unwrap<unknown>(await http.get(`${BASE}/recommendations`)),
  avatars: async () =>
      toArray<Avatar>(unwrap<unknown>(await http.get(`${BASE}/avatars`))),
  updateAvatar: async (avatar_id: number) =>
      unwrap<unknown>(await http.put(`${BASE}/avatar`, { avatar_id })),
  updatePersonalInfo: async (payload: PersonalInfoPayload) =>
      unwrap<unknown>(await http.put(`${BASE}/personal-info`, payload)),
  updateFinancialInfo: async (payload: FinancialInfoPayload) =>
      unwrap<unknown>(await http.put(`${BASE}/financial-info`, payload)),
};