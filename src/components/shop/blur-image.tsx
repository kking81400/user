"use client";

import { useEffect, useRef, useState } from "react";
import { decode } from "blurhash";
import { cn } from "@/lib/utils";

const FALLBACK_ASPECT = 0.75;
const HASH_SIZE = 32;

interface Props {
    src: string | null;
    alt: string;
    blurHash: string | null;
    /** width / height; null = unknown, image takes its natural height once loaded */
    aspect: number | null;
    priority?: boolean;
}

export function BlurImage({ src, alt, blurHash, aspect, priority = false }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [loaded, setLoaded] = useState(false);

    // draw the blur-hash placeholder
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!blurHash || !canvas) return;
        try {
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const data = ctx.createImageData(HASH_SIZE, HASH_SIZE);
            data.data.set(decode(blurHash, HASH_SIZE, HASH_SIZE));
            ctx.putImageData(data, 0, 0);
        } catch {
            /* invalid hash → plain background */
        }
    }, [blurHash]);

    // cached images can finish loading before hydration, so onLoad would never fire
    useEffect(() => {
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
    }, [src]);

    const fixed = aspect !== null;
    const reserveSpace = fixed || !loaded;

    return (
        <div
            className="relative overflow-hidden rounded-3xl bg-muted"
            style={reserveSpace ? { aspectRatio: aspect ?? FALLBACK_ASPECT } : undefined}
        >
            {blurHash && (
                <canvas
                    ref={canvasRef}
                    width={HASH_SIZE}
                    height={HASH_SIZE}
                    aria-hidden
                    className={cn(
                        "absolute inset-0 h-full w-full transition-opacity duration-300",
                        loaded && "opacity-0",
                    )}
                />
            )}
            {src && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt}
                    loading={priority ? "eager" : "lazy"}
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    className={cn(
                        "transition-opacity duration-300",
                        loaded ? "opacity-100" : "opacity-0",
                        reserveSpace
                            ? "absolute inset-0 h-full w-full object-cover"
                            : "relative block h-auto w-full",
                    )}
                />
            )}
        </div>
    );
}