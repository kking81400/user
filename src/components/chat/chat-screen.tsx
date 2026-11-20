// src/components/chat/chat-screen.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatEmpty, ChatMessageList } from "@/components/chat/chat-message-list";
import { useChat } from "@/hooks/use-chat";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useShopProfile } from "@/hooks/use-shop-profile";
import { useAuthStore } from "@/store/auth-store";

/** Full-screen chat with a shop (covers the bottom nav, like the design). */
export function ChatScreen({ shopName }: { shopName: string }) {
    const router = useRouter();

    // the auth store is read on the client only → avoids an SSR/hydration mismatch
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const token = useAuthStore((s) => s.accessToken);

    const { data: shop, isPending, isError, refetch } = useShopProfile(shopName);
    const activeShopId = token && shop ? shop.id : 0;

    const { messages, status, send } = useChat(activeShopId);
    const history = useChatHistory(activeShopId);

    if (!mounted) return null;

    let body: React.ReactNode;
    if (!token) {
        body = (
            <Centered>
                <p>برای ارسال پیام ابتدا وارد شوید</p>
                <Link href="/auth" className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground">
                    ورود / ثبت‌نام
                </Link>
            </Centered>
        );
    } else if (isPending) {
        body = <Centered>در حال بارگذاری...</Centered>;
    } else if (isError || !shop) {
        body = (
            <Centered>
                <p>خطا در دریافت اطلاعات فروشگاه</p>
                <RetryButton onClick={() => refetch()} />
            </Centered>
        );
    } else {
        let content: React.ReactNode;
        if (messages.length) {
            content = (
                <ChatMessageList
                    messages={messages}
                    hasOlder={history.hasOlder}
                    loadingOlder={history.loadingOlder}
                    onLoadOlder={history.loadOlder}
                />
            );
        } else if (history.isLoading) {
            content = <Centered>در حال بارگذاری پیام‌ها...</Centered>;
        } else if (history.isError) {
            content = (
                <Centered>
                    <p>خطا در دریافت پیام‌ها</p>
                    <RetryButton onClick={history.retry} />
                </Centered>
            );
        } else {
            content = <ChatEmpty />;
        }

        body = (
            <>
                <ChatHeader shop={shop} status={status} onBack={() => router.back()} />
                {content}
                <ChatComposer onSend={send} />
            </>
        );
    }

    return (
        <div className="fixed inset-0 z-[55] bg-background">
            <div className="mx-auto flex h-full w-full max-w-md flex-col">{body}</div>
        </div>
    );
}

function Centered({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
            {children}
        </div>
    );
}

function RetryButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground"
        >
            تلاش مجدد
        </button>
    );
}