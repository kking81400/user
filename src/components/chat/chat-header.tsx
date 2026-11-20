// src/components/chat/chat-header.tsx
import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { ShopLink } from "@/components/shop-profile/shop-link";
import type { ChatConnectionStatus } from "@/types/chat";
import type { ShopProfile } from "@/types/shop-profile";

interface Props {
    shop: ShopProfile;
    status: ChatConnectionStatus;
    onBack: () => void;
}

function ChatHeaderImpl({ shop, status, onBack }: Props) {
    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
            <button
                type="button"
                onClick={onBack}
                aria-label="بازگشت"
                className="grid size-9 shrink-0 place-items-center rounded-full text-foreground active:bg-muted"
            >
                <ChevronRight className="size-6" />
            </button>

            <ShopLink shopName={shop.name} className="flex min-w-0 items-center gap-2.5">
        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
          {shop.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.avatar} alt="" className="size-full object-cover" />
          ) : (
              <span className="grid size-full place-items-center text-sm font-bold text-muted-foreground">
              {shop.name.charAt(0)}
            </span>
          )}
        </span>
                <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-foreground">{shop.name}</span>
                    {/* only shown while the connection is not healthy */}
                    {status !== "open" && (
                        <span className="block text-[11px] text-muted-foreground">
              {status === "closed" ? "اتصال برقرار نیست" : "در حال اتصال…"}
            </span>
                    )}
        </span>
            </ShopLink>
        </header>
    );
}

export const ChatHeader = memo(ChatHeaderImpl);