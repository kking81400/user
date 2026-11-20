// src/components/chat/message-shop-button.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

export function shopChatHref(shopName: string): string {
    return `/shops/${encodeURIComponent(shopName)}/chat`;
}

/** "پیام" button: drop it anywhere a shop is shown to start a conversation with it. */
export function MessageShopButton({ shopName, className }: { shopName: string; className?: string }) {
    return (
        <Link
            href={shopChatHref(shopName)}
            className={cn(
                "grid h-10 flex-1 place-items-center rounded-xl border border-border bg-background text-sm font-medium text-foreground active:opacity-80",
                className,
            )}
        >
            پیام
        </Link>
    );
}