"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import "@/components/home/home.css";
import "./profile.css";

/** صفحه‌ی تمام‌قد که از پایین باز می‌شود (روی منوی پایین هم می‌افتد)؛ فقط وقتی باز است mount می‌شود */
export function ProfileSheet({
                                 title,
                                 onClose,
                                 children,
                             }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [onClose]);

    return (
        <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] flex justify-center bg-black/40">
            <div className="h-dvh w-full max-w-md overflow-y-auto overscroll-contain bg-[color:var(--hm-bg)] text-[color:var(--hm-text)]">
                <header dir="ltr" className="sticky top-0 z-10 flex items-center justify-between bg-[color:var(--hm-glass)] px-5 py-4 backdrop-blur-md">
                    <span className="size-9" />
                    <h2 className="text-xl font-extrabold">{title}</h2>
                    <button type="button" aria-label="بازگشت" onClick={onClose} className="flex size-9 items-center justify-center">
                        <ArrowRight className="size-6 -scale-x-100" />
                    </button>
                </header>
                <div className="px-4 pb-12 pt-2">{children}</div>
            </div>
        </div>
    );
}