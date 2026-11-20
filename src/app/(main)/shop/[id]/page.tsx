// src/app/(main)/shop/[id]/page.tsx
"use client";

import { notFound, useRouter } from "next/navigation";
import { ProductDetailSkeleton, ProductDetailView } from "@/components/product/product-detail-view";
import { useProductDetail } from "@/hooks/use-product-detail";

export default function ProductPage({ params }: { params: { id: string } }) {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) notFound();

    const router = useRouter();
    const { data, isPending, isError, refetch } = useProductDetail(id);

    if (isPending) return <ProductDetailSkeleton />;

    if (isError || !data) {
        return (
            <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 text-sm text-muted-foreground">
                <p>خطا در دریافت اطلاعات محصول</p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground"
                    >
                        تلاش مجدد
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-full bg-muted px-5 py-2 text-xs font-medium text-foreground"
                    >
                        بازگشت
                    </button>
                </div>
            </main>
        );
    }

    return <ProductDetailView product={data} />;
}