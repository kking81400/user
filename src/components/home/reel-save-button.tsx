'use client';

import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { http, unwrap } from '@/lib/api/http';
import { useAuthStore } from '@/store/auth-store';

interface ReelSaveButtonProps {
    reelId: number;
    initialIsSaved?: boolean;
    savedCount?: number;
}

export default function ReelSaveButton({
                                           reelId,
                                           initialIsSaved = false,
                                           savedCount = 0,
                                       }: ReelSaveButtonProps) {
    const [isSaved, setIsSaved] = useState(initialIsSaved);
    const [count, setCount] = useState(savedCount);
    const { accessToken } = useAuthStore();

    // متد POST برای ذخیره یا لغو ذخیره ریلز
    const saveMutation = useMutation({
        mutationFn: async (action: 'save' | 'unsave') => {
            const response = await http.post(`/user/home/reels/${reelId}/save`, {
                action: action,
            });
            return unwrap(response.data);
        },
        onMutate: (action) => {
            // آپدیت آنی UI (Optimistic Update)
            const newSavedState = action === 'save';
            setIsSaved(newSavedState);
            setCount((prev) => Math.max(0, prev + (newSavedState ? 1 : -1)));
        },
        onError: () => {
            // بازگشت به حالت قبل در صورت بروز خطا
            setIsSaved((prev) => !prev);
            setCount((prev) => Math.max(0, prev + (isSaved ? 1 : -1)));
            alert('خطا در انجام عملیات. لطفاً دوباره تلاش کنید.');
        },
    });

    const handleToggleSave = () => {
        if (!accessToken) {
            alert('لطفاً برای ذخیره ویدیو وارد حساب کاربری خود شوید.');
            return;
        }

        const nextAction = isSaved ? 'unsave' : 'save';
        saveMutation.mutate(nextAction);
    };

    return (
        <button
            type="button"
            onClick={handleToggleSave}
            disabled={saveMutation.isPending}
            className="flex flex-col items-center gap-1 group cursor-pointer"
        >
            <div className="p-3 rounded-full bg-black/30 backdrop-blur-md transition group-hover:scale-110 group-active:scale-90">
                <Bookmark
                    className={`w-5 h-5 transition-colors ${
                        isSaved ? 'text-white fill-white' : 'text-white'
                    }`}
                />
            </div>
            {count > 0 && <span className="text-xs font-medium text-white">{count}</span>}
        </button>
    );
}