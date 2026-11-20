"use client";

import * as React from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";
import { BadgeCheck, CalendarDays, Copy, Landmark, Pencil } from "lucide-react";
import {
  financialInfoSchema,
  personalInfoSchema,
  type FinancialInfoValues,
  type PersonalInfoValues,
} from "@/lib/validations/profile";
import { useUpdateFinancialInfo, useUpdatePersonalInfo } from "@/hooks/use-profile";
import type { Profile } from "@/types/profile";
import { cn } from "@/lib/utils";
import { Field, cardCls, dividerCls, inputCls, outlineBtn, primaryBtn } from "./ui";
import { z } from "zod";

const schema = personalInfoSchema.extend(financialInfoSchema.shape);
type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const groupDigits = (v: string, size: number) =>
  v.replace(/\s/g, "").replace(new RegExp(`(.{${size}})`, "g"), "$1 ").trim();

const toDefaults = (p?: Profile): FormInput => ({
  name: p?.name ?? "",
  last_name: p?.last_name ?? "",
  national_id: p?.national_id ?? "",
  birth_date: p?.birth_date ?? "",
  iban: p?.iban ?? "",
  card_number: p?.card_number ?? "",
});

const genderLabel = (g?: string) =>
  g === "male" || g === "M" || g === "مرد" ? "مرد" : g === "female" || g === "F" || g === "زن" ? "زن" : g ?? "—";

export function ProfileForm({ profile }: { profile?: Profile }) {
  const { resolvedTheme } = useTheme();
  const [editingIban, setEditingIban] = React.useState(false);
  const personal = useUpdatePersonalInfo();
  const financial = useUpdateFinancialInfo();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(profile),
  });
  const { register, control, handleSubmit, reset, formState } = form;
  const { errors, dirtyFields } = formState;

  // بعد از رسیدن داده از سرور، فرم را پر کن
  React.useEffect(() => {
    if (profile) reset(toDefaults(profile));
  }, [profile, reset]);

  const onSubmit = async (v: FormOutput) => {
    const jobs: Promise<unknown>[] = [];
    if (dirtyFields.name || dirtyFields.last_name || dirtyFields.national_id || dirtyFields.birth_date) {
      jobs.push(
        personal.mutateAsync({
          name: v.name,
          last_name: v.last_name,
          national_id: v.national_id,
          birth_date: v.birth_date,
        })
      );
    }
    if (dirtyFields.iban || dirtyFields.card_number) {
      jobs.push(financial.mutateAsync({ iban: v.iban, card_number: v.card_number }));
    }
    if (!jobs.length) return toast.info("تغییری برای ذخیره وجود ندارد");
    await Promise.allSettled(jobs);
    setEditingIban(false);
  };

  const saving = personal.isPending || financial.isPending;
  const iban = form.watch("iban");
  const verified = profile?.iban_verified ?? profile?.is_iban_verified;

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText(String(iban).replace(/\s/g, ""));
      toast.success("شماره شبا کپی شد");
    } catch {
      toast.error("کپی انجام نشد");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
      {/* اطلاعات فردی */}
      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-[#2b211c] dark:text-[#f3ebe6]">اطلاعات فردی</h2>
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
                    value={
                      field.value
                        ? new DateObject({ date: field.value, format: "YYYY-MM-DD", calendar: gregorian, locale: gregorian_en })
                            .convert(persian, persian_fa)
                        : ""
                    }
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
                  <CalendarDays className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-[#7a5238] dark:text-[#e0bfa5]" />
                </div>
              )}
            />
          </Field>
          <Field label="جنسیت">
            <input value={genderLabel(profile?.gender)} readOnly disabled className={inputCls} />
          </Field>
        </div>
      </section>

      <div className={dividerCls} />

      {/* اطلاعات مالی */}
      <section className={cn(cardCls, "p-4 sm:p-8")}>
        <div className="mb-6 flex items-center justify-center gap-2 border-b border-[#e3d6cf] pb-5 dark:border-[#3d322c]">
          <Landmark className="size-6 text-[#7a5238] dark:text-[#e0bfa5]" />
          <h2 className="text-lg font-semibold text-[#2b211c] dark:text-[#f3ebe6]">اطلاعات مالی و تسویه</h2>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-[#d9c9c1] bg-[#f4f1ef] p-4 sm:p-5 dark:border-[#3d322c] dark:bg-[#1f1815]">
            <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-start">
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-3 py-1 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <BadgeCheck className="size-4" /> تایید شده
                </span>
              )}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                <span className="text-sm text-[#5d514b] dark:text-[#b9aca5]">شماره شبا (IBAN)</span>
                {editingIban ? (
                  <input
                    {...register("iban")}
                    dir="ltr"
                    autoFocus
                    placeholder="IR000000000000000000000000"
                    className={cn(inputCls, "font-mono tracking-wider sm:w-96")}
                  />
                ) : (
                  <p dir="ltr" className="break-all font-mono text-base tracking-widest text-[#2b211c] sm:text-lg dark:text-[#f3ebe6]">
                    {iban ? groupDigits(String(iban), 4) : "—"}
                  </p>
                )}
                {errors.iban && <p className="text-xs text-red-600 dark:text-red-400">{errors.iban.message}</p>}
              </div>
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={() => setEditingIban((v) => !v)} className={cn(outlineBtn, "h-9 rounded-lg px-4 text-xs")}>
                <Pencil className="size-3.5" /> ویرایش
              </button>
              <button type="button" onClick={copyIban} className={cn(outlineBtn, "h-9 rounded-lg px-4 text-xs")}>
                <Copy className="size-3.5" /> کپی
              </button>
            </div>
          </div>

          <Field label="شماره کارت پیش‌فرض" error={errors.card_number?.message}>
            <div className="relative">
              <input
                {...register("card_number")}
                inputMode="numeric"
                dir="ltr"
                maxLength={19}
                className={cn(inputCls, "pe-4 font-mono tracking-widest")}
              />
              {profile?.bank_name && (
                <span className="pointer-events-none absolute end-4 top-1/2 hidden -translate-y-1/2 text-xs text-[#7d716b] sm:block">
                  {profile.bank_name}
                </span>
              )}
            </div>
          </Field>
        </div>
      </section>

      <div className={dividerCls} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-start">
        <button type="submit" disabled={saving} className={cn(primaryBtn, "w-full sm:w-auto")}>
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset(toDefaults(profile));
            setEditingIban(false);
          }}
          className="h-12 rounded-xl px-6 text-sm text-[#2b211c] hover:bg-black/5 dark:text-[#f3ebe6] dark:hover:bg-white/5"
        >
          انصراف
        </button>
      </div>
    </form>
  );
}
