'use client';

import React, { useState } from 'react';
import { X, Heart, Bookmark } from 'lucide-react';
import Image from 'next/image';
import { useProductQuickView } from '@/hooks/use-reels';

interface QuickViewModalProps {
    productId: number | null;
    onClose: () => void;
}

export default function QuickViewModal({ productId, onClose }: QuickViewModalProps) {
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const { data: product, isLoading } = useProductQuickView(productId);

    if (!productId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="relative p-4 border-b border-zinc-100 dark:border-zinc-800 text-center">
                    <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-2" />
                    <button onClick={onClose} className="absolute left-4 top-4 text-zinc-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-zinc-400 text-sm">در حال بارگذاری جزئیات...</div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                        {/* تصویر محصول */}
                        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            {product?.cover_url && (
                                <Image src={product.cover_url} alt={product.title} fill className="object-cover" />
                            )}
                        </div>

                        {/* عنوان و قیمت */}
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{product?.title}</h3>
                            <p className="text-xs text-zinc-400">{product?.subtitle}</p>
                            <p className="text-sm font-extrabold text-amber-800 dark:text-amber-500 pt-1">
                                {product?.price?.toLocaleString()} ریال
                            </p>
                        </div>

                        {/* انتخاب رنگ */}
                        {product?.colors?.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">انتخاب رنگ</span>
                                <div className="flex gap-2">
                                    {product.colors.map((color: any) => (
                                        <button
                                            key={color.code}
                                            onClick={() => setSelectedColor(color.code)}
                                            className={`w-7 h-7 rounded-full border-2 transition ${
                                                selectedColor === color.code ? 'border-amber-800 scale-110' : 'border-transparent'
                                            }`}
                                            style={{ backgroundColor: color.hex }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* انتخاب سایز */}
                        {product?.sizes?.length > 0 && (
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">انتخاب سایز</span>
                                <div className="flex gap-2">
                                    {product.sizes.map((size: string) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-9 h-9 rounded-full text-xs font-bold border transition ${
                                                selectedSize === size
                                                    ? 'bg-amber-800 text-white border-amber-800'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-transparent'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* دکمه افزودن به سبد */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <button className="w-full py-3.5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold transition shadow-lg">
                        افزودن به سبد خرید
                    </button>
                </div>
            </div>
        </div>
    );
}