"use client";

import * as React from "react";
import { CircleCheck, MapPin, Pencil, Phone, X } from "lucide-react";
import { useAddresses } from "@/hooks/use-addresses";
import { AddressModal } from "@/components/profile/address-modal";
import type { Address } from "@/types/profile";
import { cn } from "@/lib/utils";
import "@/components/home/home.css";

/** آدرس انتخاب‌شده: انتخاب کاربر، وگرنه پیش‌فرض، وگرنه اولین آدرس */
export function pickAddress(list: Address[] | undefined, id: number | null): Address | undefined {
    if (!list?.length) return undefined;
    return list.find((a) => a.id === id) ?? list.find((a) => a.is_default) ?? list[0];
}

const line = (a: Address) => [a.state, a.city, a.full_address].filter(Boolean).join("، ");

export function AddressPicker({
                                  selectedId,
                                  onSelect,
                              }: {
    selectedId: number | null;
    onSelect: (id: number) => void;
}) {
    const { data: list, isLoading } = useAddresses();
    const [sheet, setSheet] = React.useState(false);
    const [modal, setModal] = React.useState<{ open: boolean; address?: Address }>({ open: false });

    const selected = pickAddress(list, selectedId);

    return (
        <section>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-[color:var(--hm-text)]">انتخاب آدرس</h2>
                {(list?.length ?? 0) > 1 && (
                    <button type="button" onClick={() => setSheet(true)} className="text-sm font-semibold text-[color:var(--hm-brand)]">
                        تغییر
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="h-[150px] animate-pulse rounded-[28px] bg-[color:var(--hm-muted)]" />
            ) : selected ? (
                <div className="flex gap-4 rounded-[28px] bg-[color:var(--hm-muted)] p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--hm-surface)] text-[color:var(--hm-brand)]">
            <MapPin className="size-6" />
          </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-[color:var(--hm-text)]">{selected.title}</h3>
                            <span dir="ltr" className="flex items-center gap-2 text-[color:var(--hm-text-muted)]">
                <button
                    type="button"
                    aria-label="ویرایش آدرس"
                    onClick={() => setModal({ open: true, address: selected })}
                    className="flex size-7 items-center justify-center"
                >
                  <Pencil className="size-4" />
                </button>
                <CircleCheck className="size-5 text-green-600" />
              </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-7 text-[color:var(--hm-text-muted)]">{line(selected)}</p>
                        {selected.postal_code && (
                            <p className="text-xs text-[color:var(--hm-text-faint)]">کد پستی: {selected.postal_code}</p>
                        )}
                        {selected.phones && (
                            <p className="mt-2 flex items-center gap-2 text-sm text-[color:var(--hm-text-faint)]">
                                <Phone className="size-4" />
                                <span dir="ltr">{selected.phones}</span>
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="rounded-[28px] bg-[color:var(--hm-muted)] p-6 text-center text-sm text-[color:var(--hm-text-muted)]">
                    هنوز آدرسی ثبت نکرده‌اید.
                </div>
            )}

            <button
                type="button"
                onClick={() => setModal({ open: true })}
                className="mt-4 rounded-xl bg-[color:var(--hm-brand)] px-5 py-2.5 text-xs font-bold text-[color:var(--hm-on-brand)] active:bg-[color:var(--hm-brand-hover)]"
            >
                افزودن آدرس
            </button>

            {/* انتخاب از بین آدرس‌ها */}
            {sheet && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom))]"
                    onClick={() => setSheet(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                        className="max-h-[calc(80dvh-var(--bottom-nav-h,64px))] w-full max-w-md overflow-y-auto rounded-t-[32px] bg-[color:var(--hm-surface)] p-5"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-extrabold text-[color:var(--hm-text)]">انتخاب آدرس</h3>
                            <button type="button" aria-label="بستن" onClick={() => setSheet(false)} className="p-1 text-[color:var(--hm-text-muted)]">
                                <X className="size-5" />
                            </button>
                        </div>
                        <ul className="space-y-3">
                            {list?.map((a) => {
                                const active = a.id === selected?.id;
                                return (
                                    <li key={a.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSelect(a.id);
                                                setSheet(false);
                                            }}
                                            className={cn(
                                                "w-full rounded-2xl border-2 p-4 text-start transition-colors",
                                                active
                                                    ? "border-[color:var(--hm-brand)] bg-[color:var(--hm-muted)]"
                                                    : "border-transparent bg-[color:var(--hm-muted)]"
                                            )}
                                        >
                                            <span className="block font-bold text-[color:var(--hm-text)]">{a.title}</span>
                                            <span className="mt-1 block text-sm leading-6 text-[color:var(--hm-text-muted)]">{line(a)}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}

            <AddressModal
                open={modal.open}
                address={modal.address}
                onClose={() => setModal({ open: false })}
            />
        </section>
    );
}