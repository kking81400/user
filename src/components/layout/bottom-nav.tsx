"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, ShoppingCart, User } from "lucide-react";

// مسیرهای واقعی Next.js
const NAV_ITEMS = [
    { href: "/", icon: Home },
    { href: "/search", icon: Search },
    { href: "/shop", icon: ShoppingBag },
    { href: "/cart", icon: ShoppingCart },
    { href: "/profile", icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        // fixed و bottom-0 باعث می‌شود نوار همیشه پایین صفحه ثابت بماند
        <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-16 w-full max-w-md items-center justify-around border-t border-neutral-800 bg-neutral-950/90 px-2 backdrop-blur-lg">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                // بررسی اینکه آیا کاربر در این مسیر قرار دارد یا خیر
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        // غیرفعال کردن اسکرول پیش‌فرض به بالا (اختیاری)
                        scroll={false}
                        className="relative flex flex-1 items-center justify-center py-4 transition-transform active:scale-90"
                    >
                        <Icon
                            className={`h-[26px] w-[26px] transition-all duration-200 ${
                                isActive
                                    ? "text-[#A87B51] stroke-[2.5]" // رنگ برنزی طرح شما
                                    : "text-neutral-400 stroke-[2]" // حالت غیرفعال
                            }`}
                        />
                    </Link>
                );
            })}
        </nav>
    );
}