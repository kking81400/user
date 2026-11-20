import { memo } from "react";
import Link from "next/link";
import { BlurImage } from "./blur-image";
import type { ShopProduct } from "@/types/shop";

function ShopProductCardImpl({ product, priority = false }: { product: ShopProduct; priority?: boolean }) {
    return (
        <Link href={`/shop/${product.id}`} className="block active:opacity-90">
            <BlurImage
                src={product.image}
                alt={product.title}
                blurHash={product.blurHash}
                aspect={product.aspect}
                priority={priority}
            />
            <p className="mt-1.5 line-clamp-1 px-1 text-[11px] font-medium text-foreground">{product.title}</p>
        </Link>
    );
}

export const ShopProductCard = memo(ShopProductCardImpl);