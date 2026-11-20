// src/app/(main)/shops/[shopname]/chat/page.tsx
import { ChatScreen } from "@/components/chat/chat-screen";

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export default function ShopChatPage({ params }: { params: { shopname: string } }) {
    return <ChatScreen shopName={safeDecode(params.shopname)} />;
}