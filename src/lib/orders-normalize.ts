import { assetUrl } from "@/lib/media";
import { extractList } from "@/lib/home-normalize";
import type {
    Order,
    OrderAddress,
    OrderDetail,
    OrderItem,
    OrderPackage,
    OrderStatus,
    OrdersPage,
    PaymentStatus,
} from "@/types/order";

type R = Record<string, unknown>;
const isObj = (v: unknown): v is R => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : undefined);
const num = (v: unknown, d = 0) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : d;
};
const first = (o: R, keys: string[]) => {
    for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== "") return o[k];
    return undefined;
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "در انتظار پرداخت",
    processing: "در حال پردازش",
    shipped: "ارسال شده",
    delivered: "تحویل شده",
    cancelled: "لغو شده",
    returned: "مرجوع شده",
};

/** وضعیت خام سرور را (با نام‌های رایج انگلیسی/فارسی) به یکی از وضعیت‌های ثابت تبدیل می‌کند */
export function toStatus(raw: unknown): OrderStatus {
    const s = String(raw ?? "").toLowerCase();
    if (/(cancel|لغو)/.test(s)) return "cancelled";
    if (/(return|refund|مرجوع)/.test(s)) return "returned";
    if (/(deliver|complete|تحویل)/.test(s)) return "delivered";
    if (/(ship|sent|post|transit|ارسال)/.test(s)) return "shipped";
    if (/(pend|unpaid|wait|payment|انتظار|پرداخت)/.test(s)) return "pending";
    return "processing";
}

function formatDate(v: unknown): string | undefined {
    const s = str(v);
    if (!s) return undefined;
    const d = new Date(s);
    if (/^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(d.getTime())) {
        try {
            return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
        } catch {
            return s;
        }
    }
    return s; // مثلاً تاریخ شمسی که از سرور آماده می‌آید
}

function normalizeItem(r: unknown, i: number): OrderItem | null {
    if (!isObj(r)) return null;
    const attrs = isObj(r.attributes) ? r.attributes : isObj(r.variant_snapshot) ? r.variant_snapshot : {};
    return {
        id: (first(r, ["item_id", "id", "variant_id", "product_id"]) ?? `i${i}`) as string | number,
        name: str(first(r, ["product_name", "name", "title"])) ?? "",
        image: assetUrl(str(first(r, ["image_url", "image", "main_image"]))),
        quantity: Math.max(1, num(r.quantity, 1)),
        // قیمت واحد نهایی (پس از تخفیف) اولویت دارد
        unitPrice: num(first(r, ["final_unit_price", "unit_price", "price", "final_price"])),
        color: str(attrs.color ?? r.color),
        size: str(attrs.size ?? r.size),
        variantText: str(r.variant_text),
    };
}

export function normalizeOrder(r: unknown, i = 0): Order | null {
    if (!isObj(r)) return null;
    // order_number (مثل SOP-1106-1-3638) برای نمایش و retry-payment؛ id عددی برای GET جزئیات
    const number = str(first(r, ["order_number", "orderNumber", "number"])) ?? str(r.id) ?? `${i}`;
    const status = toStatus(first(r, ["status", "order_status", "state", "status_key"]));
    const list = ["items", "products", "order_items"].map((k) => r[k]).find(Array.isArray) as unknown[] | undefined;
    let items = (list ?? []).map(normalizeItem).filter((x): x is OrderItem => !!x);
    // لیست سفارش‌ها به‌جای items، فقط preview_images (آرایه‌ی آدرس تصویر) و more_items_count می‌دهد
    if (items.length === 0 && Array.isArray(r.preview_images)) {
        items = r.preview_images
            .map((p) => (isObj(p) ? str(first(p, ["image_url", "url", "image"])) : str(p)))
            .map((u, i): OrderItem | null => {
                const image = assetUrl(u);
                return image ? { id: `p${i}`, name: "", image, quantity: 1, unitPrice: 0 } : null;
            })
            .filter((x): x is OrderItem => !!x);
    }
    const moreCount = num(r.more_items_count);
    const addr = isObj(r.address) ? r.address : {};
    const addrText =
        str(r.address_text) ??
        str(r.full_address) ??
        (isObj(r.address)
            ? [addr.state ?? addr.province, addr.city, addr.full_address].map(str).filter(Boolean).join("، ")
            : str(r.address));

    return {
        id: str(first(r, ["id", "order_id"])) ?? number,
        number,
        status,
        statusLabel: str(first(r, ["status_label", "status_text", "status_fa", "status_title"])) ?? STATUS_LABEL[status],
        total: num(first(r, ["final_payable_amount", "total_price", "total_amount", "payable_amount", "total"])),
        date: formatDate(first(r, ["created_at", "jalali_date", "date", "order_date"])),
        items,
        itemsCount:
            r.more_items_count != null
                ? items.length + moreCount
                : num(first(r, ["items_count", "total_items", "quantity"]), items.reduce((s, x) => s + x.quantity, 0)),
        addressId: (addr.id ?? r.address_id) as number | string | undefined,
        addressText: addrText || undefined,
        addressTitle: str(addr.title),
        paymentMethod: str(r.payment_method),
        shippingMethod: str(r.shipping_method),
    };
}

export function normalizeOrdersPage(raw: unknown, page: number, limit: number): OrdersPage {
    const meta = isObj(raw) && isObj(raw.meta) ? raw.meta : {};
    const items = extractList(raw)
        .map((r, i) => normalizeOrder(r, i))
        .filter((o): o is Order => !!o);
    return {
        items,
        page: num(meta.current_page ?? meta.page, page),
        limit: num(meta.limit, limit) || limit,
        hasMore: typeof meta.has_more === "boolean" ? meta.has_more : undefined,
    };
}

/** payment_status سرور (paid / unpaid / failed ...) را به سه حالت ثابت تبدیل می‌کند */
export function toPaymentStatus(raw: unknown): PaymentStatus {
    const s = String(raw ?? "").toLowerCase();
    if (/(fail|error|ناموفق)/.test(s)) return "failed";
    if (/(unpaid|not_paid|pending|wait|نشده|انتظار)/.test(s)) return "unpaid";
    if (/(paid|success|complete|verified|settled|شده)/.test(s)) return "paid";
    return "unpaid";
}

/** وضعیت کلی سفارش از روی وضعیت بسته‌ها */
function overallStatus(pk: OrderPackage[]): OrderStatus {
    const st = pk.map((p) => p.status);
    if (st.length === 0) return "pending";
    if (st.every((s) => s === "cancelled")) return "cancelled";
    if (st.every((s) => s === "returned")) return "returned";
    if (st.every((s) => s === "delivered")) return "delivered";
    if (st.some((s) => s === "pending")) return "pending";
    if (st.some((s) => s === "shipped")) return "shipped";
    return "processing";
}

/**
 * پاسخ GET orders/{id}:
 * { order_id, order_number, master_order_number, payment_status, can_retry_payment, payment_method, created_at,
 *   packages: [{ package_index, total_packages, shop_name, timeline_status, tracking_code, shipping_method, items }],
 *   shipping_address: { id, title, state, city, full_address, phones, postal_code },
 *   summary: { total_items_price, shipping_cost, total_discount, final_amount } }
 */
export function normalizeOrderDetail(raw: unknown): OrderDetail | null {
    const root = isObj(raw) && isObj(raw.order) ? raw.order : raw;
    if (!isObj(root)) return null;

    const packages: OrderPackage[] = (Array.isArray(root.packages) ? root.packages : [])
        .map((p, i): OrderPackage | null => {
            if (!isObj(p)) return null;
            const items = (Array.isArray(p.items) ? p.items : []).map(normalizeItem).filter((x): x is OrderItem => !!x);
            return {
                index: num(p.package_index, i + 1),
                total: num(p.total_packages, 1),
                shop: str(p.shop_name) ?? "",
                status: toStatus(first(p, ["timeline_status", "status"])),
                trackingCode: str(p.tracking_code),
                shippingMethod: str(p.shipping_method),
                items,
            };
        })
        .filter((x): x is OrderPackage => !!x);

    const a = isObj(root.shipping_address) ? root.shipping_address : isObj(root.address) ? root.address : undefined;
    const address: OrderAddress | undefined = a
        ? {
            id: a.id as number | string | undefined,
            title: str(a.title) ?? "",
            text: [a.state, a.city, a.full_address].map(str).filter(Boolean).join("، "),
            phone: str(first(a, ["phones", "phone", "mobile"])),
            postalCode: str(a.postal_code),
        }
        : undefined;

    const sm = isObj(root.summary) ? root.summary : {};
    const itemsTotal = num(sm.total_items_price);
    const shipping = num(sm.shipping_cost);
    const discount = num(sm.total_discount);

    const paymentStatus = toPaymentStatus(root.payment_status);
    const paid = paymentStatus === "paid";
    const status = overallStatus(packages);

    return {
        id: str(first(root, ["order_id", "id"])) ?? "",
        number: str(root.order_number) ?? "",
        masterNumber: str(root.master_order_number),
        paymentStatus,
        paid,
        // اگر سرور can_retry_payment نفرستاد: پرداخت‌نشده و در انتظار = قابل پرداخت مجدد
        canRetry: typeof root.can_retry_payment === "boolean" ? root.can_retry_payment : !paid && status === "pending",
        paymentMethod: str(root.payment_method),
        date: formatDate(root.created_at),
        status,
        packages,
        address,
        summary: {
            itemsTotal,
            shipping,
            discount,
            final: sm.final_amount != null ? num(sm.final_amount) : Math.max(0, itemsTotal + shipping - discount),
        },
    };
}