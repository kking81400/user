"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cartApi } from "@/lib/api/cart";
import { recalc } from "@/lib/cart-normalize";
import type { Cart } from "@/types/cart";

export const CART_KEY = ["cart"] as const;

export const useCart = () => useQuery({ queryKey: CART_KEY, queryFn: cartApi.get, staleTime: 30_000 });

/** تغییر تعداد / حذف / افزودن؛ تعداد و حذف فوری در UI اعمال و در خطا برگردانده می‌شود */
export function useCartActions() {
    const qc = useQueryClient();
    const refresh = () => qc.invalidateQueries({ queryKey: CART_KEY });

    const patch = async (fn: (c: Cart) => Cart) => {
        await qc.cancelQueries({ queryKey: CART_KEY });
        const prev = qc.getQueryData<Cart>(CART_KEY);
        if (prev) qc.setQueryData<Cart>(CART_KEY, fn(prev));
        return { prev };
    };
    const rollback = (prev?: Cart) => {
        if (prev) qc.setQueryData(CART_KEY, prev);
    };

    const setQuantity = useMutation({
        mutationFn: ({ id, quantity }: { id: string | number; quantity: number }) => cartApi.update(id, quantity),
        onMutate: ({ id, quantity }) =>
            patch((c) => recalc(c.items.map((i) => (i.id === id ? { ...i, quantity } : i)), c.discount)),
        onError: (_e, _v, ctx) => {
            rollback(ctx?.prev);
            toast.error("تغییر تعداد انجام نشد");
        },
        onSettled: refresh,
    });

    const remove = useMutation({
        mutationFn: ({ id, quantity }: { id: string | number; quantity: number }) => cartApi.remove(id, quantity),
        onMutate: ({ id }) => patch((c) => recalc(c.items.filter((i) => i.id !== id), c.discount)),
        onError: (_e, _v, ctx) => {
            rollback(ctx?.prev);
            toast.error("حذف محصول انجام نشد");
        },
        onSettled: refresh,
    });

    const add = useMutation({
        mutationFn: cartApi.add,
        onSuccess: () => toast.success("به سبد خرید اضافه شد"),
        onError: () => toast.error("افزودن به سبد خرید انجام نشد"),
        onSettled: refresh,
    });

    return { setQuantity, remove, add };
}