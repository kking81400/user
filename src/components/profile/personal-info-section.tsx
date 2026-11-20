"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useTheme } from "next-themes";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import { CalendarDays, Pencil } from "lucide-react";
import { personalInfoSchema, type PersonalInfoValues } from "@/lib/validations/profile";
import { useUpdatePersonalInfo } from "@/hooks/use-profile";
import type { ExtraInfo, ProfileData } from "@/types/profile";
import { cn } from "@/lib/utils";
import { Field, inputCls, outlineBtn, primaryBtn } from "./ui";

type In = z.input<typeof personalInfoSchema>;

const toJalali = (iso?: string) =>
    iso
        ? new DateObject({ date: iso, format: "YYYY-MM-DD", calendar: gregorian, locale: gregorian_en })
            .convert(persian, persian_fa)
        : undefined;

export function PersonalInfoSection({
                                        info,
                                        extra,
                                    }: {
    info: ProfileData["personal_info"];
    extra: ExtraInfo;
}) {
    const { resolvedTheme } = useTheme();
    const [editing, setEditing] = React.useState(false);
    // GET profile کد ملی و تاریخ تولد را نمی‌دهد؛ بعد از ذخیره، مقدار ثبت‌شده را اینجا نگه می‌داریم
    const [saved, setSaved] = React.useState<ExtraInfo>({});
    const nationalId = saved.national_id ?? extra.national_id ?? "";
    const birthDate = saved.birth_date ?? extra.birth_date ?? "";

    const update = useUpdatePersonalInfo();
    const defaults = (): In => ({
        name: info.first_name,
        last_name: info.last_name,
        national_id: nationalId,
        birth_date: birthDate,
    });
    const form = useForm<In, unknown, PersonalInfoValues>({
        resolver: zodResolver(personalInfoSchema),
        defaultValues: defaults(),
    });
    const { register, control, handleSubmit, reset, formState: { errors } } = form;

    const open = () => {
        reset(defaults());
        setEditing(true);
    };

    const onSubmit = (v: PersonalInfoValues) =>
        update.mutate(v, {
            onSuccess: () => {
                setSaved({ national_id: v.national_id, birth_date: v.birth_date });
                setEditing(false);
            },
        });

    const rows: [string, string][] = [
        ["نام", info.first_name],
        ["نام خانوادگی", info.last_name],
        ["کد ملی", nationalId],
        ["تاریخ تولد", toJalali(birthDate)?.format("YYYY/MM/DD") ?? ""],
    ];

    return (
        <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[color:var(--pf-text)]">اطلاعات فردی</h2>
                {!editing && (
                    <button type="button" onClick={open} className={cn(outlineBtn, "h-10 px-4 text-xs")}>
                        <Pencil className="size-4" /> ویرایش
                    </button>
                )}
            </div>

            {!editing ? (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {rows.map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[color:var(--pf-border-soft)] px-4 py-3">
                            <dt className="text-xs text-[color:var(--pf-text-muted)]">{label}</dt>
                            <dd className="mt-1 text-sm text-[color:var(--pf-text)]">
                                {value || <span className="text-[color:var(--pf-text-faint)]">ثبت نشده</span>}
                            </dd>
                        </div>
                    ))}
                </dl>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <Field label="نام" error={errors.name?.message}>
                            <input {...register("name")} className={inputCls} autoComplete="given-name" />
                        </Field>
                        <Field label="نام خانوادگی" error={errors.last_name?.message}>
                            <input {...register("last_name")} className={inputCls} autoComplete="family-name" />
                        </Field>
                        <Field label="کد ملی" error={errors.national_id?.message}>
                            <input {...register("national_id")} inputMode="numeric" maxLength={10} dir="ltr" className={cn(inputCls, "text-end")} />
                        </Field>
                        <Field label="تاریخ تولد" error={errors.birth_date?.message}>
                            <Controller
                                control={control}
                                name="birth_date"
                                render={({ field }) => (
                                    <div className="relative">
                                        <DatePicker
                                            calendar={persian}
                                            locale={persian_fa}
                                            calendarPosition="bottom-right"
                                            value={toJalali(field.value) ?? ""}
                                            onChange={(d) =>
                                                field.onChange(
                                                    d && !Array.isArray(d)
                                                        ? (d as DateObject).convert(gregorian, gregorian_en).format("YYYY-MM-DD")
                                                        : ""
                                                )
                                            }
                                            maxDate={new DateObject({ calendar: persian })}
                                            inputClass={cn(inputCls, "ps-12")}
                                            containerClassName="w-full"
                                            className={resolvedTheme === "dark" ? "bg-dark" : ""}
                                            editable={false}
                                        />
                                        <CalendarDays className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-[color:var(--pf-brand-text)]" />
                                    </div>
                                )}
                            />
                        </Field>
                    </div>
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