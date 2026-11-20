"use client";

import * as React from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useAddresses, useDeleteAddress, useUpdateAddress } from "@/hooks/use-addresses";
import { useLocations } from "@/hooks/use-locations";
import { findCity, findProvince, type Province } from "@/lib/data/locations";
import type { Address, AddressPayload } from "@/types/profile";
import { cn } from "@/lib/utils";
import { AddressModal } from "./address-modal";
import { cardCls, outlineBtn } from "./ui";

/** بدنه‌ی PUT از روی آدرس موجود؛ شناسه‌ی استان/شهر در صورت نبودن، از روی نام پیدا می‌شود */
const toPayload = (
    a: Address,
    provinces: Province[],
    patch: Partial<AddressPayload> = {}
): AddressPayload => {
    const p = findProvince(provinces, { id: a.state_id, name: a.state });
    const c = p ? findCity(p, { id: a.city_id, name: a.city }) : undefined;
    return {
        title: a.title,
        phones: a.phones,
        state_id: p?.id ?? a.state_id ?? "",
        state: a.state,
        city_id: c?.id ?? a.city_id ?? "",
        city: a.city,
        full_address: a.full_address,
        lat: a.lat ?? "",
        Lon: a.Lon ?? "",
        postal_code: a.postal_code,
        is_default: !!a.is_default,
        ...patch,
    };
};

const smallBtn =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs transition-colors disabled:opacity-60";

export function AddressesSection() {
    const { data, isLoading, isError, refetch } = useAddresses();
    const update = useUpdateAddress();
    const remove = useDeleteAddress();
    // فایل استان/شهر را از همین‌جا پیش‌دانلود می‌کنیم تا مودال سریع باز شود
    const { data: provinces = [] } = useLocations();
    const [modalOpen, setModalOpen] = React.useState(false);
    const [editing, setEditing] = React.useState<Address | null>(null);
    const [confirmId, setConfirmId] = React.useState<number | null>(null);

    const openNew = () => {
        setEditing(null);
        setModalOpen(true);
    };
    const openEdit = (a: Address) => {
        setEditing(a);
        setModalOpen(true);
    };

    const addresses = data ?? [];

    return (
        <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--pf-text)]">
                    <MapPin className="size-6 text-[color:var(--pf-brand-text)]" /> آدرس‌های من
                </h2>
                <button type="button" onClick={openNew} className={cn(outlineBtn, "h-10 px-4 text-xs")}>
                    <Plus className="size-4" /> افزودن آدرس
                </button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {[0, 1].map((i) => (
                        <div key={i} className="h-40 animate-pulse rounded-2xl bg-[color:var(--pf-skeleton)]" />
                    ))}
                </div>
            ) : isError ? (
                <div className="flex flex-col items-center gap-3 py-8 text-sm">
                    <p className="text-[color:var(--pf-danger)]">دریافت آدرس‌ها ناموفق بود</p>
                    <button onClick={() => refetch()} className={cn(outlineBtn, "h-10")}>تلاش دوباره</button>
                </div>
            ) : addresses.length === 0 ? (
                <div className={cn(cardCls, "flex flex-col items-center gap-3 border-dashed py-10 text-center")}>
                    <MapPin className="size-8 text-[color:var(--pf-text-faint)]" />
                    <p className="text-sm text-[color:var(--pf-text-muted)]">هنوز آدرسی ثبت نکرده‌اید.</p>
                    <button type="button" onClick={openNew} className={cn(outlineBtn, "h-10 px-4 text-xs")}>
                        <Plus className="size-4" /> ثبت اولین آدرس
                    </button>
                </div>
            ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                    {addresses.map((a) => {
                        const confirming = confirmId === a.id;
                        return (
                            <li
                                key={a.id}
                                className={cn(
                                    "flex flex-col gap-3 rounded-2xl border bg-[color:var(--pf-muted)] p-4",
                                    a.is_default ? "border-[color:var(--pf-brand)]" : "border-[color:var(--pf-border)]"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-[color:var(--pf-text)]">{a.title}</h3>
                                    {a.is_default && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--pf-brand-soft)] px-2.5 py-1 text-[11px] text-[color:var(--pf-brand-text)]">
                      <Star className="size-3 fill-current" /> پیش‌فرض
                    </span>
                                    )}
                                </div>

                                <p className="text-sm leading-6 text-[color:var(--pf-text-muted)]">
                                    {[a.state, a.city].filter(Boolean).join("، ")}
                                    {a.full_address ? `، ${a.full_address}` : ""}
                                </p>

                                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[color:var(--pf-text-muted)]">
                                    <span dir="ltr">{a.phones}</span>
                                    <span>کد پستی: <span dir="ltr">{a.postal_code}</span></span>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {confirming ? (
                                        <>
                                            <span className="text-xs text-[color:var(--pf-text)]">این آدرس حذف شود؟</span>
                                            <button
                                                type="button"
                                                disabled={remove.isPending}
                                                onClick={() => remove.mutate(a.id, { onSettled: () => setConfirmId(null) })}
                                                className={cn(smallBtn, "border-[color:var(--pf-danger)] text-[color:var(--pf-danger)]")}
                                            >
                                                {remove.isPending ? "در حال حذف..." : "بله، حذف"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConfirmId(null)}
                                                className={cn(smallBtn, "border-[color:var(--pf-border)] text-[color:var(--pf-text)]")}
                                            >
                                                انصراف
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => openEdit(a)}
                                                className={cn(smallBtn, "border-[color:var(--pf-brand-text)] text-[color:var(--pf-brand-text)] hover:bg-[color:var(--pf-brand-soft)]")}
                                            >
                                                <Pencil className="size-3.5" /> ویرایش
                                            </button>
                                            {!a.is_default && (
                                                <button
                                                    type="button"
                                                    disabled={update.isPending}
                                                    onClick={() => update.mutate({ id: a.id, payload: toPayload(a, provinces, { is_default: true }) })}
                                                    className={cn(smallBtn, "border-[color:var(--pf-border)] text-[color:var(--pf-text)] hover:bg-[color:var(--pf-hover)]")}
                                                >
                                                    <Star className="size-3.5" /> پیش‌فرض
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setConfirmId(a.id)}
                                                className={cn(smallBtn, "border-[color:var(--pf-border)] text-[color:var(--pf-danger)] hover:bg-[color:var(--pf-hover)]")}
                                            >
                                                <Trash2 className="size-3.5" /> حذف
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <AddressModal open={modalOpen} onClose={() => setModalOpen(false)} address={editing} />
        </section>
    );
}