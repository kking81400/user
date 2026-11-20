// src/hooks/use-product-detail.ts
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchProductDetail } from "@/lib/api/product-detail";
import { useAuthStore } from "@/store/auth-store";

export function useProductDetail(id: number) {
    return useQuery({
        queryKey: ["product", id],
        queryFn: () => fetchProductDetail(id),
        staleTime: 60 * 1000,
    });
}

/**
 * Optimistic on/off toggle (like, bookmark). Rolls back and shows a toast on failure.
 * Not-logged-in users are sent to the auth page.
 */
export function useProductToggle(initial: boolean, request: (next: boolean) => Promise<unknown>) {
    const router = useRouter();
    const accessToken = useAuthStore((s) => s.accessToken);
    const [active, setActive] = useState(initial);

    const mutation = useMutation({
        mutationFn: request,
        onMutate: (next) => setActive(next),
        onError: (_err, next) => {
            setActive(!next);
            toast.error("خطا در انجام عملیات، دوباره تلاش کنید");
        },
    });

    const toggle = () => {
        if (mutation.isPending) return;
        if (!accessToken) {
            toast("برای این کار ابتدا وارد شوید");
            router.push("/auth");
            return;
        }
        mutation.mutate(!active);
    };

    return { active, toggle };
}