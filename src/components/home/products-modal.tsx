'use client';

import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { http, unwrap } from '@/lib/api/http';
import {
    CART_PAGE_URL,
    Toast,
    getCartErrorMessage,
    getProductVariants,
    getVariantId,
    useAddToCart,
    useToast,
} from '@/components/cart/use-cart';

// مدال جزئیات فقط وقتی لازم شد بارگذاری می‌شود (code-splitting)
const loadDetailModal = () => import('./product-detail-modal');
const ProductDetailModal = dynamic(loadDetailModal, { ssr: false, loading: () => null });

interface ProductItem {
    product_id: number;
    product_name: string;
    category_name?: string;
    sell_price: number;
    discount_price?: number | null;
    variant_id?: number | null; // اگر API واریانت پیش‌فرض بدهد، همراه درخواست سبد ارسال می‌شود
    image_url: string;
}

interface ProductMeta {
    total_bundle_price: number;
    total_items: number;
}

interface ProductsApiResponse {
    items: ProductItem[];
    meta: ProductMeta;
}

interface ProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reelId: number;
    /** اگر داده نشود، دکمه «مشاهده همه» مودال را تمام‌صفحه می‌کند */
    onViewAll?: () => void;
}

/* ───────────── تنظیمات شیت ───────────── */
const HALF_VISIBLE = 0.65; // در حالت نیمه‌باز چند درصد ارتفاع صفحه را می‌گیرد
const SHEET_MS = 320;
const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SHEET_RADIUS = 28; // px
const FLING_VELOCITY = 0.5; // px/ms
const HALF_OFFSET_DVH = Math.round((1 - HALF_VISIBLE) * 100);

type Mode = 'half' | 'full';
type Target = Mode | 'closed';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const priceFormatter = new Intl.NumberFormat('fa-IR');
const formatPrice = (price: number) => priceFormatter.format(price).replace(/٬/g, ',');

const EMPTY_ITEMS: ProductItem[] = [];
const EMPTY_META: ProductMeta = { total_bundle_price: 0, total_items: 0 };

/* ───────────── ردیف محصول (memo: با تغییر state مدال دوباره رندر نمی‌شود) ───────────── */
const ProductRow = memo(function ProductRow({
                                                item,
                                                isFirst,
                                                onSelect,
                                            }: {
    item: ProductItem;
    isFirst: boolean;
    onSelect: (id: number) => void;
}) {
    return (
        <li>
            {!isFirst && <div className="ms-6 me-20 border-t border-slate-100" />}
            <button
                type="button"
                onClick={() => onSelect(item.product_id)}
                className="w-full flex items-center gap-4 px-6 py-4 text-start cursor-pointer active:bg-slate-50 transition-colors"
            >
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-sm">
                    {item.image_url ? (
                        <Image src={item.image_url} alt={item.product_name} fill sizes="64px" className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <ShoppingBag className="w-5 h-5 text-slate-400" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {item.category_name && (
                        <span className="block text-xs font-bold text-[#A87C61]">{item.category_name}</span>
                    )}
                    <h3 className="mt-0.5 text-base font-bold text-slate-900 line-clamp-1">{item.product_name}</h3>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-slate-900">{formatPrice(item.sell_price)}</span>
                        <span className="text-xs text-slate-500">ریال</span>
                    </div>
                </div>

                <span
                    aria-hidden
                    className="w-11 h-11 shrink-0 rounded-full bg-[#EEF2F8] text-slate-400 shadow-sm flex items-center justify-center"
                >
                    <ChevronLeft className="w-5 h-5" />
                </span>
            </button>
        </li>
    );
});

function ListSkeleton() {
    return (
        <ul className="px-6 py-4 space-y-6" aria-hidden>
            {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-12 rounded bg-slate-100" />
                        <div className="h-4 w-2/3 rounded bg-slate-100" />
                        <div className="h-4 w-1/3 rounded bg-slate-100" />
                    </div>
                    <div className="w-11 h-11 rounded-full bg-slate-100 shrink-0" />
                </li>
            ))}
        </ul>
    );
}

export default function ProductsModal({ isOpen, onClose, reelId, onViewAll }: ProductsModalProps) {
    const router = useRouter();
    const addToCart = useAddToCart();
    const { toast, showToast } = useToast();
    const queryClient = useQueryClient();
    const [addedIds, setAddedIds] = useState<Set<number>>(() => new Set());
    const [isAdding, setIsAdding] = useState(false);

    // با عوض شدن ویدیو، وضعیت «اضافه شده» ریست شود
    useEffect(() => {
        setAddedIds(new Set());
    }, [reelId]);

    // وقتی از مدال جزئیات محصولی به سبد اضافه شد، در «افزودن همه» دوباره اضافه نشود
    const handleDetailAdded = useCallback((id: number) => {
        setAddedIds((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [mode, setMode] = useState<Mode>('half');

    const sheetRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const modeRef = useRef<Mode>('half');
    const tyRef = useRef(0);
    const closingRef = useRef(false);
    const closeTimerRef = useRef<number | undefined>(undefined);
    const tapOnHandleRef = useRef(false);

    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const selectedRef = useRef<number | null>(null);
    selectedRef.current = selectedProductId;

    const { data: responseData, isLoading } = useQuery({
        queryKey: ['reel-products', reelId],
        queryFn: async () => {
            const response = await http.get(`/user/reels/${reelId}/products`);
            return unwrap(response.data);
        },
        enabled: isOpen && Boolean(reelId),
        staleTime: 1000 * 60,
    });

    const { items: products, meta }: ProductsApiResponse = useMemo(() => {
        if (!responseData) return { items: EMPTY_ITEMS, meta: EMPTY_META };
        const dataObj = responseData.data ?? responseData;
        const items: ProductItem[] = Array.isArray(dataObj.items) ? dataObj.items : EMPTY_ITEMS;
        return {
            items,
            meta: dataObj.meta ?? { total_bundle_price: 0, total_items: items.length },
        };
    }, [responseData]);

    const handleSelectProduct = useCallback((id: number) => setSelectedProductId(id), []);
    const handleCloseDetail = useCallback(() => setSelectedProductId(null), []);

    const allAdded = products.length > 0 && products.every((p) => addedIds.has(p.product_id));

    const handleViewCart = () => router.push(CART_PAGE_URL);

    // ارسال پشت‌سرهم (برای کاربر مهمان، ساخت سبد در درخواست اول باید کامل شود)
    const handleAddAllToCart = async () => {
        if (isAdding || products.length === 0) return;
        const pending = products.filter((p) => !addedIds.has(p.product_id));
        if (pending.length === 0) return;

        setIsAdding(true);
        const succeeded: number[] = [];
        const needsChoice: ProductItem[] = []; // محصولاتی که کاربر باید رنگ/سایزشان را انتخاب کند
        let firstError: string | undefined;

        for (const p of pending) {
            try {
                // سرور VariantID را اجباری می‌داند: اگر لیست نداد، از جزئیات محصول می‌گیریم
                let variantId = p.variant_id ?? null;
                if (variantId == null) {
                    const variants = await getProductVariants(queryClient, p.product_id);
                    // فقط وقتی یک واریانت دارد خودکار انتخاب می‌شود؛ در غیر این صورت انتخاب با کاربر است
                    variantId = variants.length === 1 ? getVariantId(variants[0]) : null;
                }
                if (variantId == null) {
                    needsChoice.push(p);
                    continue;
                }
                await addToCart.mutateAsync({ product_id: p.product_id, variant_id: variantId, quantity: 1 });
                succeeded.push(p.product_id);
            } catch (error) {
                firstError ??= getCartErrorMessage(error);
            }
        }

        if (succeeded.length > 0) {
            setAddedIds((prev) => {
                const next = new Set(prev);
                succeeded.forEach((id) => next.add(id));
                return next;
            });
        }
        setIsAdding(false);

        const attempted = pending.length - needsChoice.length;

        if (needsChoice.length > 0) {
            // مدال جزئیات اولین محصول باز می‌شود تا رنگ و سایز را انتخاب کند
            const choiceMsg =
                needsChoice.length === 1
                    ? `برای «${needsChoice[0].product_name}» رنگ و سایز را انتخاب کنید.`
                    : `برای ${formatPrice(needsChoice.length)} محصول باید رنگ و سایز را انتخاب کنید.`;
            showToast(
                'error',
                succeeded.length > 0 ? `${formatPrice(succeeded.length)} محصول اضافه شد. ${choiceMsg}` : choiceMsg
            );
            setSelectedProductId(needsChoice[0].product_id);
        } else if (succeeded.length === attempted) {
            showToast(
                'success',
                attempted > 1 ? 'همه محصولات با موفقیت به سبد خرید اضافه شدند.' : 'محصول با موفقیت به سبد خرید اضافه شد.'
            );
        } else if (succeeded.length > 0) {
            showToast(
                'error',
                `${formatPrice(succeeded.length)} از ${formatPrice(attempted)} محصول اضافه شد. ${firstError ?? ''}`.trim()
            );
        } else {
            showToast('error', firstError ?? 'افزودن به سبد خرید ناموفق بود.');
        }
    };

    /* ───────────── موتور شیت (transform، بدون re-render حین کشیدن) ───────────── */
    const metrics = useCallback(() => {
        const H = sheetRef.current?.offsetHeight ?? window.innerHeight;
        return { H, half: Math.round(H * (1 - HALF_VISIBLE)) };
    }, []);

    const applyTranslate = useCallback(
        (ty: number, animate: boolean) => {
            const sheet = sheetRef.current;
            if (!sheet) return;
            const { H, half } = metrics();
            const radius = clamp(ty / Math.max(half, 1), 0, 1) * SHEET_RADIUS;

            sheet.style.transition = animate
                ? `transform ${SHEET_MS}ms ${SHEET_EASE}, border-radius ${SHEET_MS}ms ${SHEET_EASE}`
                : 'none';
            sheet.style.transform = `translate3d(0, ${ty}px, 0)`;
            sheet.style.borderRadius = `${radius}px ${radius}px 0 0`;

            if (barRef.current) {
                barRef.current.style.transition = animate ? `transform ${SHEET_MS}ms ${SHEET_EASE}` : 'none';
                barRef.current.style.transform = `translate3d(0, ${-Math.min(ty, half)}px, 0)`;
            }
            if (backdropRef.current) {
                backdropRef.current.style.transition = animate ? `opacity ${SHEET_MS}ms ease` : 'none';
                backdropRef.current.style.opacity = String(1 - clamp((ty - half) / Math.max(H - half, 1), 0, 1));
            }
            tyRef.current = ty;
        },
        [metrics]
    );

    const snapTo = useCallback(
        (target: Target, animate = true) => {
            const { H, half } = metrics();
            if (target === 'closed') {
                if (closingRef.current) return;
                closingRef.current = true;
                applyTranslate(H, true);
                closeTimerRef.current = window.setTimeout(() => {
                    closingRef.current = false;
                    onCloseRef.current();
                }, SHEET_MS - 40);
                return;
            }
            modeRef.current = target;
            setMode(target);
            applyTranslate(target === 'full' ? 0 : half, animate);
        },
        [applyTranslate, metrics]
    );

    useIsoLayoutEffect(() => {
        if (!isOpen) return;
        closingRef.current = false;
        modeRef.current = 'half';
        setMode('half');
        const { H, half } = metrics();
        applyTranslate(H, false);
        sheetRef.current?.getBoundingClientRect(); // reflow تا انیمیشن اجرا شود
        applyTranslate(half, true);
    }, [isOpen, applyTranslate, metrics]);

    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // فایل مدال جزئیات را در زمان بیکاری از قبل بگیر تا کلیک روی محصول فوری باشد
        const warm = window.setTimeout(() => {
            loadDetailModal().catch(() => {});
        }, 600);

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedRef.current == null) snapTo('closed');
        };
        const onResize = () => {
            if (closingRef.current) return;
            applyTranslate(modeRef.current === 'full' ? 0 : metrics().half, false);
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', onResize);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.clearTimeout(warm);
            window.clearTimeout(closeTimerRef.current);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onResize);
        };
    }, [isOpen, snapTo, applyTranslate, metrics]);

    /* ───────────── کشیدن از ناحیه دستگیره و هدر ───────────── */
    const dragRef = useRef({ active: false, startY: 0, startTy: 0, lastY: 0, lastT: 0, vy: 0, moved: 0 });

    const dragStart = useCallback(
        (y: number) => {
            const d = dragRef.current;
            d.active = true;
            d.startY = y;
            d.lastY = y;
            d.lastT = performance.now();
            d.vy = 0;
            d.moved = 0;
            const sheet = sheetRef.current;
            const current = sheet ? new DOMMatrixReadOnly(getComputedStyle(sheet).transform).m42 : tyRef.current;
            d.startTy = current;
            applyTranslate(current, false);
        },
        [applyTranslate]
    );

    const dragMove = useCallback(
        (y: number) => {
            const d = dragRef.current;
            if (!d.active) return;
            const { H } = metrics();
            const now = performance.now();
            const dt = now - d.lastT;
            if (dt > 0) d.vy = 0.7 * d.vy + 0.3 * ((y - d.lastY) / dt);
            d.lastY = y;
            d.lastT = now;
            d.moved = Math.max(d.moved, Math.abs(y - d.startY));
            applyTranslate(clamp(d.startTy + (y - d.startY), 0, H), false);
        },
        [applyTranslate, metrics]
    );

    const dragEnd = useCallback((): number => {
        const d = dragRef.current;
        if (!d.active) return 0;
        d.active = false;
        const { H, half } = metrics();
        const ty = tyRef.current;
        const vy = performance.now() - d.lastT > 100 ? 0 : d.vy;

        let target: Target;
        if (Math.abs(vy) > FLING_VELOCITY) {
            target = vy < 0 ? 'full' : modeRef.current === 'full' ? 'half' : 'closed';
        } else if (ty < half / 2) {
            target = 'full';
        } else if (ty < half + (H - half) * 0.25) {
            target = 'half';
        } else {
            target = 'closed';
        }
        snapTo(target);
        return d.moved;
    }, [snapTo, metrics]);

    const onZonePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        const t = e.target as HTMLElement;
        if (t.closest('button')) {
            tapOnHandleRef.current = false;
            return; // کلیک روی دکمه‌ها نباید کشیدن شروع کند
        }
        tapOnHandleRef.current = Boolean(t.closest('[data-handle]'));
        e.currentTarget.setPointerCapture(e.pointerId);
        dragStart(e.clientY);
    };

    const onZonePointerUp = () => {
        const wasActive = dragRef.current.active;
        const moved = dragEnd();
        if (wasActive && moved < 4 && tapOnHandleRef.current) {
            snapTo(modeRef.current === 'half' ? 'full' : 'half');
        }
    };

    const handleViewAll = () => {
        if (onViewAll) onViewAll();
        else snapTo('full');
    };

    if (!isOpen || typeof document === 'undefined') return null;

    // رندر در body تا زیر منوی پایین یا هر stacking context دیگری نرود
    return createPortal(
        <>
            <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" dir="rtl">
                <div ref={backdropRef} className="absolute inset-0 bg-black/60" onClick={() => snapTo('closed')} />
                <Toast toast={toast} />

                <div
                    ref={sheetRef}
                    className="absolute bottom-0 inset-x-0 mx-auto w-full max-w-md h-[100dvh] bg-white flex flex-col overflow-hidden shadow-2xl will-change-transform"
                >
                    {/* ناحیه قابل کشیدن: دستگیره + هدر */}
                    <div
                        className={`shrink-0 touch-none select-none cursor-grab active:cursor-grabbing ${
                            mode === 'full' ? 'pt-[env(safe-area-inset-top)]' : ''
                        }`}
                        onPointerDown={onZonePointerDown}
                        onPointerMove={(e) => dragMove(e.clientY)}
                        onPointerUp={onZonePointerUp}
                        onPointerCancel={dragEnd}
                    >
                        <div data-handle className="h-8 flex items-center justify-center">
                            <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                        </div>

                        <div className="px-6 pt-1 pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-xl font-extrabold text-slate-900">تکمیل استایل</h2>
                                <p className="mt-1 text-sm text-slate-500">{formatPrice(meta.total_items)} محصول در این ویدیو</p>
                            </div>

                            {mode === 'full' ? (
                                <button
                                    type="button"
                                    onClick={() => snapTo('closed')}
                                    aria-label="بستن"
                                    className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                                >
                                    <X className="w-4 h-4 text-slate-700" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleViewAll}
                                    className="shrink-0 h-11 px-5 rounded-full bg-[#F6EFEA] text-[#A87C61] text-sm font-bold hover:bg-[#F0E5DD] transition cursor-pointer"
                                >
                                    مشاهده همه
                                </button>
                            )}
                        </div>
                    </div>

                    {/* لیست محصولات: همیشه اسکرول بومی دارد.
                        در حالت نیمه‌باز، بخشی از پایین شیت خارج از صفحه است، پس همان مقدار پدینگ اضافه می‌شود */}
                    <div
                        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
                        style={{
                            paddingBottom:
                                mode === 'half' ? `calc(8rem + ${HALF_OFFSET_DVH}dvh)` : 'calc(8rem + env(safe-area-inset-bottom))',
                        }}
                    >
                        {isLoading ? (
                            <ListSkeleton />
                        ) : products.length > 0 ? (
                            <ul>
                                {products.map((item, idx) => (
                                    <ProductRow
                                        key={item.product_id}
                                        item={item}
                                        isFirst={idx === 0}
                                        onSelect={handleSelectProduct}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <div className="w-full flex items-center justify-center text-xs text-slate-400 py-16">
                                محصولی برای این ویدیو ثبت نشده است.
                            </div>
                        )}
                    </div>

                    {/* دکمه ثابت پایین */}
                    <div
                        ref={barRef}
                        className="absolute bottom-0 inset-x-0 bg-white px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.08)]"
                    >
                        <button
                            type="button"
                            onClick={allAdded ? handleViewCart : handleAddAllToCart}
                            disabled={products.length === 0 || isAdding}
                            className="w-full h-14 px-6 rounded-3xl bg-[#A87C61] hover:bg-[#966B52] active:scale-[0.98] transition text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#A87C61]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdding ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-base font-bold">در حال افزودن...</span>
                                </>
                            ) : allAdded ? (
                                <>
                                    <ShoppingBag className="w-5 h-5" />
                                    <span className="text-base font-bold">مشاهده سبد خرید</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-base font-bold">افزودن همه به سبد</span>
                                    <span className="text-sm text-white/75 font-normal">
                                        ({formatPrice(meta.total_bundle_price)} ریال)
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* مدال جزئیات سریع محصول: فقط وقتی انتخاب شده رندر و بارگذاری می‌شود */}
            {selectedProductId != null && (
                <ProductDetailModal
                    isOpen
                    onClose={handleCloseDetail}
                    productId={selectedProductId}
                    onAddedToCart={handleDetailAdded}
                />
            )}
        </>,
        document.body
    );
}