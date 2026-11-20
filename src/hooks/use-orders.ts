"use client";

import * as React from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderApi, type OrderPayload } from "@/lib/api/orders";
import { CART_KEY } from "@/hooks/use-cart";
import { normalizeOrderDetail, normalizeOrdersPage } from "@/lib/orders-normalize";
import type { Order } from "@/types/order";

const LIMIT = 10;

/** پیام خطای سرور (اگر بود) را برای نمایش درمی‌آورد */
export function apiErrorMessage(e: unknown, fallback: string): string {
    const msg = (e as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
    return typeof msg === "string" && msg ? msg : fallback;
}

export function useSubmitOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (p: OrderPayload) => orderApi.submit(p),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: CART_KEY });
            qc.invalidateQueries({ queryKey: ["orders"] });
        },
        onError: (e) => toast.error(apiErrorMessage(e, "ثبت سفارش انجام نشد")),
    });
}

/** لیست سفارش‌ها با اسکرول بی‌نهایت؛ tab خالی یعنی همه */
export function useOrders(tab: string) {
    const q = useInfiniteQuery({
        queryKey: ["orders", "list", tab],
        queryFn: async ({ pageParam }) =>
            normalizeOrdersPage(await orderApi.list({ page: pageParam, limit: LIMIT, tab: tab || undefined }), pageParam, LIMIT),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.items.length >= last.limit ? last.page + 1 : undefined),
        staleTime: 60_000,
    });

    const items = React.useMemo(() => {
        const seen = new Set<string>();
        const out: Order[] = [];
        for (const p of q.data?.pages ?? []) {
            for (const o of p.items) {
                if (seen.has(o.id)) continue;
                seen.add(o.id);
                out.push(o);
            }
        }
        return out;
    }, [q.data]);

    return {
        items,
        isLoading: q.isLoading,
        isError: q.isError,
        refetch: q.refetch,
        hasNextPage: q.hasNextPage,
        isFetchingNextPage: q.isFetchingNextPage,
        fetchNextPage: q.fetchNextPage,
    };
}

export function useOrder(id: string) {
    return useQuery({
        queryKey: ["orders", "detail", id],
        queryFn: async () => normalizeOrderDetail(await orderApi.get(id)),
        enabled: !!id,
        staleTime: 30_000,
    });
}

export function useRetryPayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: OrderPayload }) => orderApi.retryPayment(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
        onError: (e) => toast.error(apiErrorMessage(e, "پرداخت مجدد انجام نشد")),
    });
}