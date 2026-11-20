/** مدل‌های نرمال‌شده‌ی صفحه‌ی خانه (خروجی src/lib/home-normalize.ts) */

export interface ShopRef {
    id?: string | number;
    name: string;
    avatar?: string;
    description?: string;
    href?: string;
}

export interface FeedItem {
    id: string | number;
    image: string;
    title?: string;
    subtitle?: string;
    href?: string;
    /** اگر پست متعلق به یک فروشگاه باشد */
    shop?: ShopRef;
}

export interface StoryMedia {
    url: string;
    type: "image" | "video";
}

export interface Story {
    id: string | number;
    name: string;
    avatar?: string;
    media: StoryMedia[];
    seen: boolean;
}

export type SuggestedShop = ShopRef & { id: string | number };