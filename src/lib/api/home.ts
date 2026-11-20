import { http } from "@/lib/api/http";
import { unwrap } from "@/lib/api/profile";
import { normalizeFeed, normalizeShops, normalizeStories } from "@/lib/home-normalize";

// پیشوند /api/v1 از قبل در baseURL فایل http.ts هست
export const homeApi = {
    explore: async () => normalizeFeed(unwrap<unknown>(await http.get("/user/explore"))),
    following: async () => normalizeFeed(unwrap<unknown>(await http.get("/user/home/following"))),
    stories: async () => normalizeStories(unwrap<unknown>(await http.get("/user/home/stories"))),
    suggestedShops: async () =>
        normalizeShops(unwrap<unknown>(await http.get("/user/suggested-shops"))),
};