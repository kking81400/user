import { http, unwrap } from './http';

export const exploreApi = {
    // دریافت گرید اکسپلور با استفاده از unwrap برای استخراج data
    getGrid: async (page = 1, limit = 18, seed?: string) => {
        const response = await http.get('/user/explore/grid', {
            params: { page, limit, ...(seed ? { seed } : {}) },
        });
        return unwrap(response.data);
    },

    // جستجوی فروشگاه‌ها با استفاده از unwrap
    searchShops: async (query: string) => {
        const response = await http.get('/user/explore/shops', {
            params: { q: query },
        });
        return unwrap(response.data);
    },
};