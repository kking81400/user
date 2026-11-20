export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";

export interface OrderItem {
    id: string | number;
    name: string;
    image?: string;
    quantity: number;
    unitPrice: number;
    color?: string;
    size?: string;
    /** متن مشخصات سفارش (variant_text)، مثل «رنگ: کرم | سایز: M» */
    variantText?: string;
}

export interface Order {
    /** شناسه‌ی مسیر صفحه‌ی جزئیات (شماره‌ی سفارش یا id) */
    id: string;
    number: string;
    status: OrderStatus;
    statusLabel: string;
    total: number;
    date?: string;
    items: OrderItem[];
    itemsCount: number;
    addressId?: number | string;
    addressText?: string;
    addressTitle?: string;
    paymentMethod?: string;
    shippingMethod?: string;
}

export interface OrdersPage {
    items: Order[];
    page: number;
    limit: number;
    /** از meta.has_more (اگر سرور فرستاده باشد) */
    hasMore?: boolean;
}

/** یک بسته‌ی مرسوله (هر فروشنده یک بسته) در صفحه‌ی پیگیری */
export interface OrderPackage {
    index: number;
    total: number;
    shop: string;
    status: OrderStatus;
    trackingCode?: string;
    shippingMethod?: string;
    items: OrderItem[];
}

export interface OrderAddress {
    id?: number | string;
    title: string;
    text: string;
    phone?: string;
    postalCode?: string;
}

export type PaymentStatus = "paid" | "unpaid" | "failed";

/** خروجی GET /user/home/orders/{id} */
export interface OrderDetail {
    /** شناسه‌ی عددی سفارش (order_id) */
    id: string;
    number: string;
    /** شماره‌ی سفارش اصلی (master_order_number) */
    masterNumber?: string;
    paymentStatus: PaymentStatus;
    /** پرداخت شده؟ */
    paid: boolean;
    /** can_retry_payment از سرور */
    canRetry: boolean;
    paymentMethod?: string;
    date?: string;
    /** وضعیت کلی که از روی بسته‌ها محاسبه می‌شود */
    status: OrderStatus;
    packages: OrderPackage[];
    address?: OrderAddress;
    summary: { itemsTotal: number; shipping: number; discount: number; final: number };
}