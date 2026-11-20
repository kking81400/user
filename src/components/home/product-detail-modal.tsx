'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { X, Heart, Flame, ShoppingBag, ChevronDown, Truck, ShieldCheck, MessageSquareText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { http, unwrap } from '@/lib/api/http';
import {
    CART_PAGE_URL,
    Toast,
    getCartErrorMessage,
    getVariantId,
    useAddToCart,
    useToast,
} from '@/components/cart/use-cart';

interface ProductDetailProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number | null;
    /** بعد از افزودن موفق به سبد صدا زده می‌شود */
    onAddedToCart?: (productId: number) => void;
}

/* ───────────── تنظیمات ظاهری و رفتاری شیت ───────────── */
const HALF_VISIBLE = 0.85; // مودال در حالت نیمه‌باز چند درصد ارتفاع صفحه را می‌گیرد
const SHEET_MS = 320;
const SHEET_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SHEET_RADIUS = 32; // px
const FLING_VELOCITY = 0.5; // px/ms

type Mode = 'half' | 'full';
type Target = Mode | 'closed';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// فرمت‌کننده فقط یک‌بار ساخته می‌شود
const priceFormatter = new Intl.NumberFormat('fa-IR');
const formatPrice = (price: number) => priceFormatter.format(price).replace(/٬/g, ',');

const EMPTY_ARRAY: never[] = [];

export default function ProductDetailModal({ isOpen, onClose, productId, onAddedToCart }: ProductDetailProps) {
    const router = useRouter();
    const addToCart = useAddToCart();
    const { toast, showToast } = useToast();
    // کلید: محصول + واریانت. با عوض شدن رنگ/سایز، دکمه دوباره «افزودن به سبد» می‌شود
    const [addedKeys, setAddedKeys] = useState<Set<string>>(() => new Set());
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [descOpen, setDescOpen] = useState(false);
    const [mode, setMode] = useState<Mode>('half');

    const sheetRef = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const modeRef = useRef<Mode>('half');
    const tyRef = useRef(0); // موقعیت فعلی شیت (translateY بر حسب px)
    const closingRef = useRef(false);
    const closeTimerRef = useRef<number | undefined>(undefined);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const { data: responseData, isLoading } = useQuery({
        queryKey: ['product-quick-view', productId],
        queryFn: async () => {
            const response = await http.get(`/user/products/${productId}/quick-view`);
            return unwrap(response.data);
        },
        enabled: isOpen && Boolean(productId),
        staleTime: 1000 * 60,
    });

    const dataObj = responseData?.data ?? responseData;
    const product = dataObj?.product;
    const gallery: string[] = Array.isArray(dataObj?.gallery) ? dataObj.gallery : EMPTY_ARRAY;
    const variants: any[] = Array.isArray(dataObj?.variants) ? dataObj.variants : EMPTY_ARRAY;
    const options = dataObj?.options ?? { colors: [], sizes: [] };

    useEffect(() => {
        setSelectedColor(null);
        setSelectedSize(null);
        setActiveImageIndex(0);
        setDescOpen(false);
    }, [productId]);

    /* ───────────── موتور شیت: جابه‌جایی با transform (بدون re-render حین کشیدن) ───────────── */
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

            // نوار پایین باید همیشه به لبه پایین صفحه بچسبد (تا وقتی شیت بسته نشده)
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
            if (target === 'half' && contentRef.current) contentRef.current.scrollTop = 0;
            applyTranslate(target === 'full' ? 0 : half, animate);
        },
        [applyTranslate, metrics]
    );

    // باز شدن: از پایین صفحه تا حالت نیمه‌باز
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

    // قفل اسکرول صفحه، Escape و تغییر اندازه پنجره
    useEffect(() => {
        if (!isOpen) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') snapTo('closed');
        };
        const onResize = () => {
            if (closingRef.current) return;
            applyTranslate(modeRef.current === 'full' ? 0 : metrics().half, false);
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', onResize);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('resize', onResize);
            window.clearTimeout(closeTimerRef.current);
        };
    }, [isOpen, snapTo, applyTranslate, metrics]);

    /* ───────────── منطق کشیدن (drag) ───────────── */
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
            // اگر وسط انیمیشن هستیم، از همان نقطه فعلی ادامه بده
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

    // کشیدن روی محتوا: در حالت نیمه‌باز همه جا؛ در حالت تمام‌صفحه فقط وقتی اسکرول در بالاست و به پایین می‌کشید
    useEffect(() => {
        const el = contentRef.current;
        if (!isOpen || !el) return;
        let axis: 'x' | 'y' | null = null;
        let sx = 0;
        let sy = 0;
        let taking = false;

        const onStart = (e: TouchEvent) => {
            const t = e.touches[0];
            sx = t.clientX;
            sy = t.clientY;
            axis = null;
            taking = false;
        };
        const onMove = (e: TouchEvent) => {
            const t = e.touches[0];
            const dx = t.clientX - sx;
            const dy = t.clientY - sy;
            if (!axis) {
                if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
                // روی خود اسلایدر، حرکت افقی اولویت دارد تا سوایپ کج به‌عنوان کشیدن مودال حساب نشود
                const inSlider = sliderRef.current?.contains(e.target as Node);
                const horizontal = inSlider ? Math.abs(dx) > Math.abs(dy) * 0.6 : Math.abs(dx) > Math.abs(dy);
                axis = horizontal ? 'x' : 'y';
            }
            if (axis === 'x') return; // سوایپ افقی مال اسلایدر است
            if (!taking) {
                const canTake = modeRef.current === 'half' || (el.scrollTop <= 0 && dy > 0);
                if (!canTake) return;
                taking = true;
                dragStart(t.clientY);
            }
            if (e.cancelable) e.preventDefault();
            dragMove(t.clientY);
        };
        const onEnd = () => {
            if (!taking) return;
            taking = false;
            dragEnd();
        };

        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd);
        el.addEventListener('touchcancel', onEnd);
        return () => {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onEnd);
            el.removeEventListener('touchcancel', onEnd);
        };
    }, [isOpen, dragStart, dragMove, dragEnd]);

    /* ───────────── اسلایدر تصاویر (scroll-snap بومی) ───────────── */
    const handleSliderScroll = useCallback(() => {
        const el = sliderRef.current;
        if (!el || !el.clientWidth) return;
        setActiveImageIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    }, []);

    const goToImage = useCallback((idx: number) => {
        const el = sliderRef.current;
        if (!el) return;
        const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
        el.scrollTo({ left: sign * idx * el.clientWidth, behavior: 'smooth' });
    }, []);

    // کشیدن با ماوس (روی موبایل خودِ scroll-snap سوایپ را انجام می‌دهد)
    const mouseDrag = useRef({ active: false, startX: 0, startScroll: 0 });

    const onSliderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const el = sliderRef.current;
        if (!el) return;
        mouseDrag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
        el.style.scrollSnapType = 'none'; // حین کشیدن snap خاموش باشد
        el.setPointerCapture(e.pointerId);
    };

    const onSliderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const d = mouseDrag.current;
        const el = sliderRef.current;
        if (!d.active || !el) return;
        el.scrollLeft = d.startScroll - (e.clientX - d.startX);
    };

    const endSliderDrag = () => {
        const d = mouseDrag.current;
        const el = sliderRef.current;
        if (!d.active || !el) return;
        d.active = false;

        const w = el.clientWidth;
        const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
        const moved = sign * (el.scrollLeft - d.startScroll); // مثبت = رفتن به عکس بعدی
        const startIdx = Math.round(Math.abs(d.startScroll) / w);
        let idx = startIdx;
        if (moved > w * 0.15) idx = startIdx + 1;
        else if (moved < -w * 0.15) idx = startIdx - 1;
        idx = clamp(idx, 0, Math.max(gallery.length - 1, 0));

        el.style.scrollSnapType = ''; // snap دوباره از کلاس‌ها اعمال شود
        goToImage(idx);
    };

    /* ───────────── داده‌های مشتق‌شده ───────────── */
    const colorHexMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const v of variants) {
            const name = v.attributes?.color;
            if (name && !map.has(name)) map.set(name, v.attributes?.color_code || '#333');
        }
        return map;
    }, [variants]);

    // طبق طرح، رنگ اول به‌صورت پیش‌فرض انتخاب است
    const activeColor: string | null = selectedColor ?? options.colors?.[0] ?? null;

    const isSizeAvailable = useCallback(
        (size: string) =>
            variants.length === 0 ||
            variants.some(
                (v) =>
                    v.attributes?.size === size &&
                    (!activeColor || v.attributes?.color === activeColor) &&
                    (typeof v.stock !== 'number' || v.stock > 0)
            ),
        [variants, activeColor]
    );

    const activeSize = selectedSize && isSizeAvailable(selectedSize) ? selectedSize : null;

    const currentVariant = useMemo(() => {
        // محصولی که فقط یک واریانت دارد و رنگ/سایز ندارد، همان واریانت است
        if (!activeColor && !activeSize) return variants.length === 1 ? variants[0] : undefined;
        return variants.find(
            (v) =>
                (!activeColor || v.attributes?.color === activeColor) &&
                (!activeSize || v.attributes?.size === activeSize)
        );
    }, [variants, activeColor, activeSize]);

    const finalPrice = product ? product.sell_price + (currentVariant?.price_adjustment || 0) : 0;
    const subtitle: string | undefined = product?.subtitle || product?.category;
    const description: string = product?.description || '';
    const inStock = product?.in_stock !== false;

    const variantId: number | null = currentVariant ? getVariantId(currentVariant) : null;
    const cartKey = `${productId}:${variantId ?? 0}`;
    const isAdded = addedKeys.has(cartKey);
    const isAdding = addToCart.isPending;

    const handleAddToCart = async () => {
        if (!product || productId == null || isAdding) return;

        if (options.sizes?.length > 0 && !activeSize) {
            showToast('error', 'لطفاً سایز را انتخاب کنید.');
            return;
        }
        if (variants.length > 0 && !currentVariant) {
            showToast('error', 'این ترکیب رنگ و سایز موجود نیست.');
            return;
        }
        if (variantId == null) {
            showToast('error', 'برای این محصول گزینه قابل خرید (واریانت) ثبت نشده است.');
            return;
        }

        try {
            await addToCart.mutateAsync({ product_id: productId, variant_id: variantId, quantity: 1 });
            setAddedKeys((prev) => new Set(prev).add(cartKey));
            showToast('success', 'محصول با موفقیت به سبد خرید اضافه شد.');
            onAddedToCart?.(productId);
        } catch (error) {
            showToast('error', getCartErrorMessage(error));
        }
    };

    const handleViewCart = () => router.push(CART_PAGE_URL);

    if (!isOpen || typeof document === 'undefined') return null;

    // رندر در body تا زیر منوی پایین یا هر stacking context دیگری نرود
    return createPortal(
        <div className="fixed inset-0 z-[110]" role="dialog" aria-modal="true" dir="rtl">
            {/* پس‌زمینه (بدون blur برای عملکرد بهتر روی موبایل‌های ضعیف) */}
            <div ref={backdropRef} className="absolute inset-0 bg-black/60" onClick={() => snapTo('closed')} />
            <Toast toast={toast} />

            {/* خود شیت: ارتفاع کامل صفحه، با transform پایین کشیده می‌شود تا حالت نیمه‌باز بسازد */}
            <div
                ref={sheetRef}
                className="absolute bottom-0 inset-x-0 mx-auto w-full max-w-md h-[100dvh] bg-white flex flex-col overflow-hidden shadow-2xl will-change-transform"
            >
                {/* دستگیره: کشیدن، یا کلیک برای تغییر بین نیمه‌باز و تمام‌صفحه */}
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={mode === 'half' ? 'تمام‌صفحه کردن' : 'کوچک کردن'}
                    className={`shrink-0 h-8 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none ${
                        mode === 'full' ? 'mt-[env(safe-area-inset-top)]' : ''
                    }`}
                    onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        dragStart(e.clientY);
                    }}
                    onPointerMove={(e) => dragMove(e.clientY)}
                    onPointerUp={() => {
                        const moved = dragEnd();
                        if (moved < 4) snapTo(modeRef.current === 'half' ? 'full' : 'half');
                    }}
                    onPointerCancel={dragEnd}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            snapTo(modeRef.current === 'half' ? 'full' : 'half');
                        }
                    }}
                >
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* دکمه بستن؛ فقط در حالت تمام‌صفحه که پس‌زمینه‌ای برای لمس‌کردن وجود ندارد */}
                {mode === 'full' && (
                    <button
                        type="button"
                        onClick={() => snapTo('closed')}
                        aria-label="بستن"
                        className="absolute left-4 top-[max(8px,env(safe-area-inset-top))] z-30 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* محتوا: در حالت نیمه‌باز اسکرول ندارد و کشیدن آن شیت را باز می‌کند */}
                <div
                    ref={contentRef}
                    onWheel={(e) => {
                        if (modeRef.current === 'half' && e.deltaY > 0) snapTo('full');
                    }}
                    className={`flex-1 min-h-0 px-6 pt-1 pb-32 space-y-6 overscroll-contain ${
                        mode === 'full' ? 'overflow-y-auto' : 'overflow-y-hidden'
                    }`}
                >
                    {isLoading ? (
                        <div className="w-full h-[35dvh] min-h-[200px] max-h-[380px] rounded-[28px] bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
                            در حال بارگذاری جزئیات محصول...
                        </div>
                    ) : product ? (
                        <>
                            {/* گالری */}
                            <div className="relative w-full h-[35dvh] min-h-[200px] max-h-[380px] rounded-[28px] overflow-hidden bg-slate-100">
                                <div
                                    ref={sliderRef}
                                    onScroll={handleSliderScroll}
                                    onPointerDown={onSliderPointerDown}
                                    onPointerMove={onSliderPointerMove}
                                    onPointerUp={endSliderDrag}
                                    onPointerCancel={endSliderDrag}
                                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                >
                                    {gallery.length > 0 ? (
                                        gallery.map((imgUrl, idx) => (
                                            <div
                                                key={imgUrl + idx}
                                                className="relative h-full w-full min-w-full shrink-0 snap-center snap-always bg-slate-100"
                                            >
                                                <Image
                                                    src={imgUrl}
                                                    alt={`${product.name} - ${idx + 1}`}
                                                    fill
                                                    sizes="(min-width: 448px) 400px, calc(100vw - 48px)"
                                                    priority={idx === 0}
                                                    loading={idx === 0 ? undefined : 'lazy'}
                                                    draggable={false}
                                                    className="object-cover pointer-events-none select-none"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="relative w-full h-full shrink-0 flex items-center justify-center">
                                            <ShoppingBag className="w-10 h-10 text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                {gallery.length > 1 && (
                                    <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-10 pointer-events-none">
                                        {gallery.map((_, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                aria-label={`تصویر ${idx + 1}`}
                                                onClick={() => goToImage(idx)}
                                                className={`pointer-events-auto w-2 h-2 rounded-full cursor-pointer transition-colors ${
                                                    activeImageIndex === idx ? 'bg-white' : 'bg-white/50'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* عنوان + علاقه‌مندی */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h1 className="text-xl font-extrabold text-slate-900 leading-snug">{product.name}</h1>
                                    {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
                                </div>
                                <button
                                    type="button"
                                    aria-label="افزودن به علاقه‌مندی‌ها"
                                    className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                                >
                                    <Heart className="w-6 h-6" strokeWidth={1.6} />
                                </button>
                            </div>

                            {/* قیمت */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-extrabold text-slate-900">{formatPrice(finalPrice)}</span>
                                <span className="text-sm text-slate-500">ریال</span>
                            </div>

                            {/* رنگ */}
                            {options.colors?.length > 0 && (
                                <div className="space-y-3">
                                    <span className="block text-sm font-semibold text-slate-700">انتخاب رنگ</span>
                                    <div className="flex flex-wrap gap-6 px-1 py-1">
                                        {options.colors.map((colorName: string) => (
                                            <button
                                                key={colorName}
                                                type="button"
                                                title={colorName}
                                                aria-label={colorName}
                                                aria-pressed={activeColor === colorName}
                                                onClick={() => setSelectedColor(colorName)}
                                                className={`w-9 h-9 rounded-full border border-black/10 cursor-pointer transition ${
                                                    activeColor === colorName
                                                        ? 'ring-2 ring-[#A87C61] ring-offset-2 ring-offset-white'
                                                        : ''
                                                }`}
                                                style={{ backgroundColor: colorHexMap.get(colorName) || '#333' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* سایز */}
                            {options.sizes?.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700">انتخاب سایز</span>
                                        <button
                                            type="button"
                                            className="text-xs text-[#A87C61] underline underline-offset-4 font-medium cursor-pointer"
                                        >
                                            راهنمای سایز
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {options.sizes.map((size: string) => {
                                            const available = isSizeAvailable(size);
                                            const selected = activeSize === size;
                                            return (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    disabled={!available}
                                                    aria-pressed={selected}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-12 h-10 px-4 rounded-full border text-sm font-bold transition flex items-center justify-center ${
                                                        selected
                                                            ? 'bg-[#A87C61] border-[#A87C61] text-white cursor-pointer'
                                                            : available
                                                                ? 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 cursor-pointer'
                                                                : 'bg-white border-slate-100 text-slate-300 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {size}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* پیام بازدید */}
                            <div className="flex items-center gap-1.5 text-xs font-medium text-orange-600">
                                <Flame className="w-4 h-4 shrink-0" />
                                <span>پرطرفدار: ۳ نفر همین الان در حال بازدید هستند</span>
                            </div>

                            {/* توضیحات (با کشیدن مودال به بالا دیده می‌شود) */}
                            {description && (
                                <div className="space-y-2 pt-2">
                                    <h2 className="text-sm font-bold text-slate-900">توضیحات</h2>
                                    <p
                                        className={`text-sm leading-7 text-slate-600 ${descOpen ? '' : 'line-clamp-3'}`}
                                    >
                                        {description}
                                    </p>
                                    {description.length > 120 && (
                                        <button
                                            type="button"
                                            onClick={() => setDescOpen((v) => !v)}
                                            className="flex items-center gap-1 text-sm font-medium text-slate-900 cursor-pointer"
                                        >
                                            <ChevronDown
                                                className={`w-4 h-4 transition-transform ${descOpen ? 'rotate-180' : ''}`}
                                            />
                                            <span>{descOpen ? 'مشاهده کمتر' : 'مشاهده بیشتر'}</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ارسال و ضمانت */}
                            <div className="divide-y divide-slate-100">
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <Truck className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                                        <span className="text-sm font-semibold text-slate-900">ارسال رایگان</span>
                                    </div>
                                    <span
                                        className={`text-sm font-semibold ${inStock ? 'text-emerald-600' : 'text-red-500'}`}
                                    >
                                        {inStock ? 'موجود' : 'ناموجود'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 py-4">
                                    <ShieldCheck className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                                    <span className="text-sm font-semibold text-slate-900">ضمانت اصالت کالا</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-64 flex items-center justify-center text-xs text-slate-400">
                            اطلاعاتی یافت نشد.
                        </div>
                    )}
                </div>

                {/* نوار پایین: همیشه به لبه پایین صفحه چسبیده است */}
                <div
                    ref={barRef}
                    className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] flex items-center gap-3"
                >
                    <button
                        type="button"
                        onClick={isAdded ? handleViewCart : handleAddToCart}
                        disabled={!product || isAdding}
                        className="flex-1 h-14 px-6 rounded-3xl bg-[#A87C61] hover:bg-[#966B52] active:scale-[0.98] disabled:opacity-60 transition text-white flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-[#A87C61]/25"
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-base font-bold">در حال افزودن...</span>
                            </>
                        ) : isAdded ? (
                            <>
                                <ShoppingBag className="w-5 h-5" />
                                <span className="text-base font-bold">مشاهده سبد خرید</span>
                            </>
                        ) : (
                            <>
                                <span className="text-base font-bold">افزودن به سبد</span>
                                <span className="w-px h-5 bg-white/30" />
                                <span className="text-sm text-white/85">{formatPrice(finalPrice)}</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        aria-label="گفتگو با فروشنده"
                        className="w-14 h-14 shrink-0 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                    >
                        <MessageSquareText className="w-6 h-6" strokeWidth={1.6} />
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}