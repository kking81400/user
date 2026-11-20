export interface ShopProduct {
    id: number;
    title: string;
    image: string | null;
    blurHash: string | null;
    /** width / height when the API provides it, otherwise null (image renders at natural height) */
    aspect: number | null;
}

export interface ShopProductsPage {
    items: ShopProduct[];
    page: number;
    hasNext: boolean;
    total: number;
}

export interface ShopCategory {
    id: number;
    name: string;
    image: string | null;
}

/** A level-1 category with its level-2 children (one block in the filter sheet). */
export interface ShopFilterGroup {
    root: ShopCategory;
    children: ShopCategory[];
    loading: boolean;
}