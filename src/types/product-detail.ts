// src/types/product-detail.ts
export interface ProductVariant {
    id: number;
    stock: number;
    priceAdjustment: number;
    size: string | null;
    color: string | null;
    colorCode: string | null;
}

export interface ProductColor {
    name: string;
    code: string | null;
}

export interface ProductShop {
    id: number;
    name: string;
    profileImage: string | null;
    isFollowed: boolean;
}

export interface ProductDetail {
    id: number;
    name: string;
    category: string | null;
    sellPrice: number;
    /** final price after discount, null when there is no discount */
    discountPrice: number | null;
    shop: ProductShop | null;
    gallery: string[];
    colors: ProductColor[];
    sizes: string[];
    variants: ProductVariant[];
    /** not returned by the API yet — the section renders only when present */
    description: string | null;
    isLiked: boolean;
    isSaved: boolean;
}