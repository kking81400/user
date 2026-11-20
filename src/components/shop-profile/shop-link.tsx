// src/components/shop-profile/shop-link.tsx
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/** Single source of truth for the profile URL. */
export function shopProfileHref(shopName: string): string {
    return `/shops/${encodeURIComponent(shopName)}`;
}

/** Opens a shop reel in the full-screen viewer. */
export function shopReelHref(shopName: string, reelId: number): string {
    return `${shopProfileHref(shopName)}/reels/${reelId}`;
}

type Props = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & {
    /** the shop's name (`shop_name`) — the {shopname} in GET /user/shop-profile/{shopname} */
    shopName: string;
};

/**
 * Drop-in link to a shop's profile page. Wrap any card/avatar/name with it:
 *
 *   <ShopLink shopName={shop.shop_name} className="flex items-center gap-2">
 *     <Avatar … /> {shop.shop_name}
 *   </ShopLink>
 */
export function ShopLink({ shopName, ...props }: Props) {
    return <Link href={shopProfileHref(shopName)} {...props} />;
}