// types/explore.ts (یا در همان فایل)
export interface ExploreItem {
    id: string;
    imageUrl: string;
    title?: string;
    // سایر فیلدهای احتمالی ریلز یا محتوا
}

export interface ShopItem {
    id: string;
    name: string;
    avatarUrl: string;
    // سایر فیلدهای مربوط به جستجوی shops
}

export interface ExploreGridItem {
    reel_id: number;
    cover_url: string;
    views_count: number;
    category_id: number;
    shop: {
        shop_id: number;
        user_name: string;
    };
}