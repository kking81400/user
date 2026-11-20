"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Copy, Landmark, Pencil } from "lucide-react";
import { financialInfoSchema, type FinancialInfoValues } from "@/lib/validations/profile";
import { useUpdateFinancialInfo } from "@/hooks/use-profile";
import type { ExtraInfo } from "@/types/profile";
import { cn } from "@/lib/utils";
import { Field, cardCls, inputCls, outlineBtn, primaryBtn } from "./ui";

type In = z.input<typeof financialInfoSchema>;

const group = (v: string, n: number) =>
    v.replace(/\s/g, "").replace(new RegExp(`(.{${n}})`, "g"), "$1 ").trim();

export function FinancialSection({ extra }: { extra: ExtraInfo }) {
    const [editing, setEditing] = React.useState(false);
    const [saved, setSaved] = React.useState<ExtraInfo>({});
    const iban = saved.iban ?? extra.iban ?? "";
    const card = saved.card_number ?? extra.card_number ?? "";

    const update = useUpdateFinancialInfo();
    const form = useForm<In, unknown, FinancialInfoValues>({
        resolver: zodResolver(financialInfoSchema),
        defaultValues: { iban, card_number: card },
    });
    const { register, handleSubmit, reset, formState: { errors } } = form;

    const onSubmit = (v: FinancialInfoValues) =>
        update.mutate(v, {
            onSuccess: () => {
                setSaved({ iban: v.iban, card_number: v.card_number });
                setEditing(false);
            },
        });

    const copy = async (text: string, msg: string) => {
        try {
            await navigator.clipboard.writeText(text.replace(/\s/g, ""));
            toast.success(msg);
        } catch {
            toast.error("کپی انجام نشد");
        }
    };

    return (
        <section className={cn(cardCls, "p-4 sm:p-8")}>
            <div className="mb-6 flex items-center justify-between border-b border-[color:var(--pf-border-soft)] pb-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--pf-text)]">
                    <Landmark className="size-6 text-[color:var(--pf-brand-text)]" /> اطلاعات مالی و تسویه
                </h2>
                {!editing && (
                    <button
                        type="button"
                        onClick={() => {
                            reset({ iban, card_number: card });
                            setEditing(true);
                        }}
                        className={cn(outlineBtn, "h-10 px-4 text-xs")}
                    >
                        <Pencil className="size-4" /> ویرایش
                    </button>
                )}
            </div>

            {!editing ? (
                <div className="flex flex-col gap-4">
                    {[
                        { label: "شماره شبا (IBAN)", value: iban ? group(iban, 4) : "", raw: iban, toast: "شماره شبا کپی شد" },
                        { label: "شماره کارت پیش‌فرض", value: card ? group(card, 4) : "", raw: card, toast: "شماره کارت کپی شد" },
                    ].map((r) => (
                        <div
                            key={r.label}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--pf-border)] bg-[color:var(--pf-muted)] p-4"
                        >
                            <div className="min-w-0">
                                <p className="text-xs text-[color:var(--pf-text-muted)]">{r.label}</p>
                                {r.value ? (
                                    <p dir="ltr" className="mt-1 break-all text-start font-mono text-sm tracking-widest text-[color:var(--pf-text)] sm:text-base">
                                        {r.value}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-[color:var(--pf-text-faint)]">ثبت نشده</p>
                                )}
                            </div>
                            {r.raw && (
                                <button
                                    type="button"
                                    onClick={() => copy(r.raw, r.toast)}
                                    className={cn(outlineBtn, "h-9 shrink-0 rounded-lg px-3 text-xs")}
                                >
                                    <Copy className="size-3.5" /> کپی
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                    <Field label="شماره شبا (IBAN)" error={errors.iban?.message}>
                        <input
                            {...register("iban")}
                            dir="ltr"
                            placeholder="IR000000000000000000000000"
                            className={cn(inputCls, "font-mono tracking-wider")}
                        />
                    </Field>
                    <Field label="شماره کارت پیش‌فرض" error={errors.card_number?.message}>
                        <input
                            {...register("card_number")}
                            inputMode="numeric"
                            dir="ltr"
                            maxLength={19}
                            placeholder="6037 0000 0000 0000"
                            className={cn(inputCls, "font-mono tracking-widest")}
                        />
                    </Field>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button type="submit" disabled={update.isPending} className={cn(primaryBtn, "w-full sm:w-auto")}>
                            {update.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditing(false)}
                            className="h-12 rounded-xl px-6 text-sm text-[color:var(--pf-text)] hover:bg-[color:var(--pf-hover)]"
                        >
                            انصراف
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}