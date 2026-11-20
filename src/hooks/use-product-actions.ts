"use client";

import { useMutation, useQueryClient, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productApi } from "@/lib/api/products";
import type { FeedPage, ProductPost } from "@/types/home";

type Id = ProductPost["id"];

/** یک محصول را در همه‌ی کش‌های فید (explore / following) به‌روز می‌کند */
function patchPost(qc: QueryClient, id: Id, patch: (p: ProductPost) => ProductPost) {
    qc.setQueriesData<unknown>({ queryKey: ["home"] }, (old: unknown) => {
        const data = old as InfiniteData<FeedPage> | undefined;
        if (!data || !Array.isArray(data.pages)) return old; // استوری‌ها و فروشگاه‌ها صفحه‌بندی ندارند
        return {
            ...data,
            pages: data.pages.map((pg) => ({
                ...pg,
                items: pg.items.map((it) => (it.id === id ? patch(it) : it)),
            })),
        };
    });
}

const withSaved = (saved: boolean) => (p: ProductPost): ProductPost => ({ ...p, isSaved: saved });
const withLiked = (liked: boolean) => (p: ProductPost): ProductPost => ({
    ...p,
    isLiked: liked,
    likesCount: p.likesCount == null ? undefined : Math.max(0, p.likesCount + (liked ? 1 : -1)),
});

/** ذخیره و لایک با به‌روزرسانی فوری UI؛ در صورت خطا به حالت قبل برمی‌گردد */
export function useProductActions() {
    const qc = useQueryClient();

    const bookmark = useMutation({
        mutationFn: ({ id, save }: { id: Id; save: boolean }) =>
            productApi.bookmark(id, save ? "save" : "unsave"),
        onMutate: ({ id, save }) => patchPost(qc, id, withSaved(save)),
        onError: (_e, { id, save }) => {
            patchPost(qc, id, withSaved(!save));
            toast.error("ذخیره‌ی محصول انجام نشد");
        },
    });

    const like = useMutation({
        mutationFn: ({ id, like }: { id: Id; like: boolean }) =>
            productApi.like(id, like ? "like" : "unlike"),
        onMutate: ({ id, like }) => patchPost(qc, id, withLiked(like)),
        onError: (_e, { id, like }) => {
            patchPost(qc, id, withLiked(!like));
            toast.error("ثبت پسند انجام نشد");
        },
    });

    return { bookmark, like };
}