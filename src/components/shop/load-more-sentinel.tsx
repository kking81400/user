"use client";

import { useEffect, useRef } from "react";

interface Props {
    onVisible: () => void;
    disabled?: boolean;
}

/** Fires onVisible when scrolled near the bottom (infinite scroll). */
export function LoadMoreSentinel({ onVisible, disabled }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const cb = useRef(onVisible);
    cb.current = onVisible;

    useEffect(() => {
        const el = ref.current;
        if (!el || disabled) return;
        const io = new IntersectionObserver(
            (entries) => entries[0]?.isIntersecting && cb.current(),
            { rootMargin: "400px 0px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [disabled]);

    return <div ref={ref} className="h-px w-full" aria-hidden />;
}