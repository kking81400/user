'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { http, unwrap } from '@/lib/api/http';
import { useAuthStore } from '@/store/auth-store';

/* ───────────── تنظیمات (اگر با پروژه شما فرق دارد فقط همین‌جا عوض کنید) ───────────── */
export const CART_PAGE_URL = '/cart'; // آدرس «صفحه» سبد خرید در اپ
const GUEST_ID_HEADER = 'X-Guest-Id'; // نام هدر شناسه کاربر مهمان
const GUEST_ID_STORAGE_KEY = 'guest_id'; // کلید ذخیره شناسه مهمان در localStorage
const CART_QUERY_KEY = ['cart'];
const TOAST_MS = 2800;

/* ───────────── هدرها: لاگین => فقط توکن (توسط http اضافه می‌شود)، مهمان => شناسه مهمان ───────────── */
function getGuestId(): string | null {
    const state = useAuthStore.getState() as unknown as Record<string, unknown>;
    const fromStore = state.guestId ?? state.guest_id;
    if (fromStore != null && fromStore !== '') return String(fromStore);
    try {
        return window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
    } catch {
        return null;
    }
}

function buildCartHeaders(): Record<string, string> | undefined {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) return undefined;
    const guestId = getGuestId();
    return guestId ? { [GUEST_ID_HEADER]: guestId } : undefined;
}

/* ───────────── API ───────────── */
export interface AddToCartPayload {
    product_id: number;
    variant_id?: number | null;
    quantity?: number;
}

/** POST /user/cart/ */
export async function addToCart({ product_id, variant_id, quantity = 1 }: AddToCartPayload) {
    const body: Record<string, number> = { product_id, quantity };
    if (variant_id != null) body.variant_id = variant_id;
    const response = await http.post('/user/cart/', body, { headers: buildCartHeaders() });
    return unwrap(response.data);
}

/** PUT /user/cart/item/{item_id} ، برای تغییر تعداد (مثلاً در صفحه سبد خرید) */
export async function updateCartItem(itemId: number | string, quantity: number) {
    const response = await http.put(`/user/cart/item/${itemId}`, { quantity }, { headers: buildCartHeaders() });
    return unwrap(response.data);
}

export function useAddToCart() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addToCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
        },
    });
}

export function useUpdateCartItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, quantity }: { itemId: number | string; quantity: number }) =>
            updateCartItem(itemId, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
        },
    });
}

/** شناسه واریانت، با هر نام فیلدی که API برگرداند */
export function getVariantId(variant: any): number | null {
    const id = variant?.id ?? variant?.variant_id ?? variant?.variantId ?? variant?.ID;
    if (id == null || id === '') return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
}

export async function fetchQuickView(productId: number) {
    const response = await http.get(`/user/products/${productId}/quick-view`);
    return unwrap(response.data);
}

/** واریانت‌های یک محصول؛ از همان کشِ مدال جزئیات استفاده می‌کند، پس درخواست تکراری نمی‌رود */
export async function getProductVariants(queryClient: QueryClient, productId: number): Promise<any[]> {
    const res = await queryClient.fetchQuery({
        queryKey: ['product-quick-view', productId],
        queryFn: () => fetchQuickView(productId),
        staleTime: 1000 * 60,
    });
    const dataObj = res?.data ?? res;
    return Array.isArray(dataObj?.variants) ? dataObj.variants : [];
}

/** استخراج پیام خطای قابل‌نمایش از پاسخ سرور */
export function getCartErrorMessage(error: unknown): string {
    const err = error as { response?: { data?: any } } | undefined;
    if (!err?.response) return 'ارتباط با سرور برقرار نشد. اینترنت خود را بررسی کنید.';

    const data = err.response.data;

    // فرمت سرور: { message, error: [{ field, message }] }
    if (Array.isArray(data?.error) && data.error.length > 0) {
        const msgs = data.error.map((e: any) => e?.message).filter((m: unknown) => typeof m === 'string' && m);
        if (msgs.length > 0) return msgs.join('، ');
    }

    const direct = data?.message ?? data?.detail ?? data?.error;
    if (typeof direct === 'string' && direct.trim()) return direct;

    if (data?.errors && typeof data.errors === 'object') {
        const first = Object.values(data.errors).flat()[0];
        if (typeof first === 'string' && first.trim()) return first;
    }
    if (typeof data === 'string' && data.trim() && data.length < 200) return data;
    return 'افزودن به سبد خرید ناموفق بود. دوباره تلاش کنید.';
}

/* ───────────── اعلان (Toast) سبک و بدون وابستگی ───────────── */
export interface ToastState {
    id: number;
    type: 'success' | 'error';
    message: string;
}

export function useToast() {
    const [toast, setToast] = useState<ToastState | null>(null);
    const timerRef = useRef<number | undefined>(undefined);

    const showToast = useCallback((type: ToastState['type'], message: string) => {
        window.clearTimeout(timerRef.current);
        setToast({ id: Date.now(), type, message });
        timerRef.current = window.setTimeout(() => setToast(null), TOAST_MS);
    }, []);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    return { toast, showToast };
}

/** باید بیرون از عنصرِ دارای transform (مثل خود شیت) رندر شود */
export function Toast({ toast }: { toast: ToastState | null }) {
    if (!toast) return null;
    const isSuccess = toast.type === 'success';
    return (
        <div
            key={toast.id}
            role="status"
            aria-live="polite"
            dir="rtl"
            className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex justify-center px-4 pt-[env(safe-area-inset-top)]"
        >
            <div
                className={`animate-fade-in max-w-sm flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
                    isSuccess ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
            >
                {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span>{toast.message}</span>
            </div>
        </div>
    );
}