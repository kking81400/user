export interface CartItem {
    /** شناسه‌ی آیتم داخل سبد (cart_item_id؛ برای PUT/DELETE) */
    id: string | number;
    productId?: string | number;
    variantId?: string | number;
    name: string;
    image?: string;
    color?: string;
    colorCode?: string;
    size?: string;
    /** قیمت واحد (پس از تخفیف) */
    unitPrice: number;
    /** قیمت واحد قبل از تخفیف */
    originalPrice?: number;
    quantity: number;
    stock?: number;
    /** false یعنی محصول دیگر قابل خرید نیست؛ پیام در error */
    available: boolean;
    error?: string;
}

export interface Cart {
    items: CartItem[];
    /** مجموع قیمت کل */
    total: number;
    discount: number;
    /** مبلغ قابل پرداخت */
    payable: number;
}