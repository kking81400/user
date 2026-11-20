import { http, unwrap } from './http';

export const reelsApi = {
    // دریافت فید اکسپلور / ریلزها
    getExploreFeed: async (params: { category_id?: number; page?: number; limit?: number; exclude_id?: number; seed?: number }) => {
        const response = await http.get('/user/explore/feed', { params });
        return unwrap(response.data);
    },

    // لایک / آنلایک ریلز
    toggleLike: async (reelId: number, action: 'like' | 'unlike') => {
        const response = await http.post(`/user/home/reels/${reelId}/like`, { action });
        return unwrap(response.data);
    },

    // سیو / آنسیو ریلز
    toggleSave: async (reelId: number, action: 'save' | 'unsave') => {
        const response = await http.post(`/user/home/reels/${reelId}/save`, { action });
        return unwrap(response.data);
    },

    // دریافت نظرات ریلز
    getComments: async (reelId: number) => {
        const response = await http.get(`/user/reels/${reelId}/comments`);
        return unwrap(response.data);
    },

    // ارسال نظر جدید
    addComment: async (reelId: number, content: string, parentId = 0) => {
        const response = await http.post(`/user/home/reels/${reelId}/comments`, {
            content,
            parent_id: parentId,
        });
        return unwrap(response.data);
    },

    // دریافت پاسخ‌های یک کامنت
    getCommentReplies: async (commentId: number) => {
        const response = await http.get(`/user/reels/comments/${commentId}/replies`);
        return unwrap(response.data);
    },

    // دریافت محصولات مرتبط با ریلز
    getReelProducts: async (reelId: number) => {
        const response = await http.get(`/user/reels/${reelId}/products`);
        return unwrap(response.data);
    },

    // دریافت نمای سریع (Quick View) محصول
    getProductQuickView: async (productId: number) => {
        const response = await http.get(`/user/products/${productId}/quick-view`);
        return unwrap(response.data);
    },
};