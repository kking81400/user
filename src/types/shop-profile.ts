// src/types/shop-profile.ts
export interface ShopProfile {
    id: number;
    username: string;
    name: string;
    slogan: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    avatar: string | null;
    verified: boolean;
    productsCount: number | null;
    followersCount: number | null;
    rating: number | null;
    isFollowed: boolean;
    highlights: ProfileHighlight[];
}

export interface ProfileHighlight {
    id: number;
    title: string;
    cover: string;
    /** the cover can be a video file (shown as its first frame) */
    isVideo: boolean;
}

export interface ShopReel {
    id: number;
    cover: string | null;
    videoUrl: string | null;
    views: number | null;
    likes: number | null;
}

export interface ShopReelsPage {
    items: ShopReel[];
    page: number;
    hasNext: boolean;
}

export interface ShopCollection {
    id: number;
    name: string;
    cover: string | null;
    productsCount: number | null;
}

export interface ShopReview {
    id: number;
    author: string;
    avatar: string | null;
    rating: number | null;
    text: string;
    date: string | null;
}