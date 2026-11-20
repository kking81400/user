'use client';

import React, { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useExploreGrid, useSearchShops } from '@/hooks/use-explore';

export default function SearchPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // دریافت دیتای گرید اکسپلور
    const { data: exploreData, isLoading: isGridLoading } = useExploreGrid(1, 18);

    // دریافت دیتای جستجوی فروشگاه‌ها
    const { data: shopsData, isLoading: isSearchLoading } = useSearchShops(searchQuery);

    // هدایت به صفحه ریلز همراه با category_id مخصوص همان آیتم و seed گرید
    const handleItemClick = (item: any) => {
        const params = new URLSearchParams({
            category_id: String(item.category_id),
        });

        const seed = exploreData?.meta?.seed;
        if (seed !== undefined && seed !== null) {
            params.set('seed', String(seed));
        }

        router.push(`/reels/${item.reel_id}?${params.toString()}`);
    };

    const items = exploreData?.items || [];

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-20">
            {/* هدر و فیلد جستجو */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-4 py-3 border-b border-zinc-100 dark:border-zinc-900">
                <div className="relative flex items-center">
                    <span className="absolute right-3.5 text-zinc-400 dark:text-zinc-500">
                        <SearchIcon className="w-5 h-5" />
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setIsSearching(e.target.value.trim().length > 0);
                        }}
                        placeholder="جستجو..."
                        className="w-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm rounded-2xl py-3 pr-11 pl-10 outline-none transition-all focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-700"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setIsSearching(false);
                            }}
                            className="absolute left-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* محتوا */}
            <div className="p-0.5">
                {isSearching ? (
                    <div className="p-4">
                        {isSearchLoading ? (
                            <div className="text-center py-10 text-zinc-400 text-sm">در حال جستجو...</div>
                        ) : shopsData?.length === 0 ? (
                            <div className="text-center py-10 text-zinc-400 text-sm">نتیجه‌ای یافت نشد.</div>
                        ) : (
                            <div className="space-y-3">
                                {shopsData?.map((shop: any) => (
                                    <div
                                        key={shop.id || shop.shop_id}
                                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                                    >
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                                            {shop.avatarUrl && (
                                                <Image src={shop.avatarUrl} alt={shop.name} fill className="object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">{shop.name}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        {isGridLoading ? (
                            <div className="grid grid-cols-3 gap-0.5 animate-pulse">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="aspect-[3/4] bg-zinc-200 dark:bg-zinc-900" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-0.5">
                                {items.map((item: any) => (
                                    <div
                                        key={item.reel_id}
                                        onClick={() => handleItemClick(item)}
                                        className="relative aspect-[3/4] bg-zinc-100 dark:bg-zinc-900 overflow-hidden cursor-pointer group"
                                    >
                                        <Image
                                            src={item.cover_url}
                                            alt={`Reel ${item.reel_id}`}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}