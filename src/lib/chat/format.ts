// src/lib/chat/format.ts

// Jalali calendar with Latin digits → "26 بهمن 1404" (same as the design)
const dayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-latn", {
    day: "numeric",
    month: "long",
    year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });

const parse = (iso: string): Date | null => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
};

/** Label for the day separator. Two messages on the same day return the same string. */
export function formatDay(iso: string): string {
    const d = parse(iso);
    return d ? dayFormatter.format(d) : "";
}

export function formatTime(iso: string): string {
    const d = parse(iso);
    return d ? timeFormatter.format(d) : "";
}