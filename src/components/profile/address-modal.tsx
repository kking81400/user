"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Bookmark, ChevronDown, Crosshair, Mail, MapPinPlus, Phone, Save, Search, X } from "lucide-react";
import { addressSchema, type AddressValues } from "@/lib/validations/profile";
import { useCreateAddress, useUpdateAddress } from "@/hooks/use-addresses";
import { useLocations } from "@/hooks/use-locations";
import { findCity, findProvince, type Province } from "@/lib/data/locations";
import type { Address, AddressPayload } from "@/types/profile";
import { cn } from "@/lib/utils";
import { Field, inputCls, outlineBtn, primaryBtn } from "./ui";

type In = z.input<typeof addressSchema>;

const EMPTY: In = {
  title: "",
  phones: "",
  state_id: "",
  city_id: "",
  full_address: "",
  postal_code: "",
  is_default: false,
};

/** تبدیل آدرس ذخیره‌شده به مقادیر فرم (استان/شهر با شناسه، و در نبودِ شناسه با نام) */
const fromAddress = (a: Address, provinces: Province[]): In => {
  const province = findProvince(provinces, { id: a.state_id, name: a.state });
  const city = province ? findCity(province, { id: a.city_id, name: a.city }) : undefined;
  return {
    title: a.title ?? "",
    phones: a.phones ?? "",
    state_id: province ? String(province.id) : "",
    city_id: city ? String(city.id) : "",
    full_address: a.full_address ?? "",
    postal_code: a.postal_code ?? "",
    is_default: !!a.is_default,
  };
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** اگر داده شود، مودال در حالت ویرایش باز می‌شود */
  address?: Address | null;
}

export function AddressModal({ open, onClose, address }: Props) {
  const isEdit = !!address;
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const saving = create.isPending || update.isPending;

  const locations = useLocations();
  const provinces = React.useMemo(() => locations.data ?? [], [locations.data]);

  const form = useForm<In, unknown, AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: EMPTY,
  });
  const { register, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = form;
  const stateId = watch("state_id");
  const province = provinces.find((p) => String(p.id) === stateId);
  const cities = province?.cities ?? [];

  // با هر بار باز شدن مودال، فرم را با آدرس انتخابی (یا خالی) پر کن
  React.useEffect(() => {
    if (!open) return;
    reset(address ? fromAddress(address, provinces) : EMPTY);
    setCoords(null);
    // provinces عمداً در وابستگی‌ها نیست تا با رسیدن فایل، متن‌های تایپ‌شده پاک نشوند
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address, reset]);

  // اگر فایل استان‌ها دیرتر از مودال رسید، فقط استان و شهر را در حالت ویرایش پر کن
  React.useEffect(() => {
    if (!open || !address || provinces.length === 0 || getValues("state_id")) return;
    const v = fromAddress(address, provinces);
    setValue("state_id", v.state_id);
    setValue("city_id", v.city_id);
  }, [open, address, provinces, getValues, setValue]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const locate = () => {
    if (!navigator.geolocation) return toast.error("مرورگر شما از مکان‌یابی پشتیبانی نمی‌کند");
    navigator.geolocation.getCurrentPosition(
        (p) => {
          setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
          toast.success("موقعیت شما ثبت شد");
        },
        () => toast.error("دسترسی به موقعیت مکانی داده نشد")
    );
  };

  const submit = (v: AddressValues) => {
    const p = provinces.find((x) => String(x.id) === v.state_id);
    const c = p?.cities.find((x) => String(x.id) === v.city_id);
    if (!p || !c) return toast.error("استان یا شهر معتبر نیست");

    // اولویت مختصات: موقعیت GPS ← مختصات قبلی آدرس (اگر شهر عوض نشده) ← مختصات خود شهر
    // اولویت مختصات: موقعیت GPS ← مختصات قبلی آدرس (اگر شهر عوض نشده) ← مختصات خود شهر
    const sameCity = isEdit && address && String(address.city_id) === String(c.id);
    const lat = coords?.lat ?? (sameCity && address?.lat ? address.lat : c.lat);
    const lon = coords?.lng ?? (sameCity && address?.Lon ? address.Lon : c.lon);

    const payload: AddressPayload = {
      title: v.title,
      phones: v.phones,
      state_id: Number(p.id),
      state: p.name,
      city_id: Number(c.id),
      city: c.name,
      full_address: v.full_address,
      lat: lat != null ? String(lat) : "",
      Lon: lon != null ? String(lon) : "",
      postal_code: v.postal_code,
      is_default: v.is_default,
    };
    const opts = { onSuccess: onClose };
    if (isEdit && address) update.mutate({ id: address.id, payload }, opts);
    else create.mutate(payload, opts);
  };

  const iconCls = "pointer-events-none absolute end-4 top-1/2 size-5 -translate-y-1/2 text-[color:var(--pf-text-faint)]";
  const selectCls = cn(inputCls, "appearance-none pe-4 ps-10");
  const chevron = "pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-[color:var(--pf-text-muted)]";

  return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[color:var(--pf-overlay)] sm:items-center sm:p-6" onClick={onClose}>
        {/* موبایل: کل مودال اسکرول می‌شود (نقشه بالا، فرم پایین)؛ دسکتاپ: نقشه کنار فرم و فقط فرم اسکرول می‌شود */}
        <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-t-3xl border border-[color:var(--pf-border)] bg-[color:var(--pf-card)] sm:max-h-[90dvh] sm:rounded-3xl lg:flex-row-reverse lg:overflow-hidden"
        >
          {/* نقشه (جایگزین شود با نشان/leaflet) */}
          <div className="relative h-44 shrink-0 bg-gradient-to-br from-[color:var(--pf-map-from)] via-[color:var(--pf-map-via)] to-[color:var(--pf-map-to)] sm:h-56 lg:h-auto lg:min-h-[560px] lg:w-[45%]">
            <div className="absolute inset-x-4 top-4">
              <div className="relative">
                <input placeholder="جستجوی موقعیت روی نقشه…" className={cn(inputCls, "h-12 pe-12 shadow-sm")} />
                <Search className="absolute end-4 top-1/2 size-5 -translate-y-1/2 text-[color:var(--pf-text)]" />
              </div>
            </div>
            <MapPinPlus className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 fill-[color:var(--pf-brand)] text-[color:var(--pf-brand)]" />
            <button
                type="button"
                onClick={locate}
                className="absolute bottom-4 start-4 inline-flex h-11 items-center gap-2 rounded-xl bg-[color:var(--pf-brand)] px-4 text-sm text-[color:var(--pf-on-brand)]"
            >
              <Crosshair className="size-5" /> مکان یابی
            </button>
          </div>

          {/* فرم */}
          <form onSubmit={handleSubmit(submit)} noValidate className="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-8 lg:overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[color:var(--pf-border-soft)] pb-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--pf-text)]">
                <MapPinPlus className="size-6 text-[color:var(--pf-brand-text)]" />
                {isEdit ? "ویرایش آدرس" : "ثبت آدرس جدید"}
              </h3>
              <button type="button" onClick={onClose} aria-label="بستن" className="text-[color:var(--pf-text)]">
                <X className="size-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="عنوان آدرس" error={errors.title?.message}>
                <div className="relative">
                  <input {...register("title")} placeholder="مثال: خانه، محل کار" className={cn(inputCls, "pe-12")} />
                  <Bookmark className={iconCls} />
                </div>
              </Field>
              <Field label="شماره تماس" error={errors.phones?.message}>
                <div className="relative">
                  <input {...register("phones")} inputMode="tel" dir="ltr" placeholder="09123456789" className={cn(inputCls, "pe-12 text-end")} />
                  <Phone className={iconCls} />
                </div>
              </Field>

              <Field label="استان" error={errors.state_id?.message}>
                <div className="relative">
                  <select
                      {...register("state_id", { onChange: () => setValue("city_id", "") })}
                      disabled={locations.isLoading || locations.isError}
                      className={selectCls}
                  >
                    <option value="">{locations.isLoading ? "در حال بارگذاری…" : "انتخاب استان…"}</option>
                    {provinces.map((p) => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={chevron} />
                </div>
                {locations.isError && (
                    <button type="button" onClick={() => locations.refetch()} className="self-start text-xs text-[color:var(--pf-danger)] underline">
                      دریافت لیست استان‌ها ناموفق بود؛ تلاش دوباره
                    </button>
                )}
              </Field>

              <Field label="شهر" error={errors.city_id?.message}>
                <div className="relative">
                  <select {...register("city_id")} disabled={!province} className={selectCls}>
                    <option value="">{province ? "انتخاب شهر…" : "ابتدا استان را انتخاب کنید"}</option>
                    {cities.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className={chevron} />
                </div>
              </Field>
            </div>

            <Field label="آدرس دقیق" error={errors.full_address?.message}>
            <textarea
                {...register("full_address")}
                rows={4}
                placeholder="محله، خیابان اصلی، خیابان فرعی، کوچه، پلاک، واحد…"
                className={cn(inputCls, "h-auto resize-none py-3")}
            />
            </Field>

            <Field label="کد پستی (۱۰ رقمی)" error={errors.postal_code?.message} className="sm:w-1/2">
              <div className="relative">
                <input {...register("postal_code")} inputMode="numeric" maxLength={10} dir="ltr" placeholder="1234567890" className={cn(inputCls, "pe-12 text-end")} />
                <Mail className={iconCls} />
              </div>
            </Field>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-[color:var(--pf-text)]">
              <input type="checkbox" {...register("is_default")} className="size-5 accent-[color:var(--pf-brand)]" />
              این آدرس به‌عنوان آدرس پیش‌فرض ثبت شود
            </label>

            <div className="mt-auto flex flex-col-reverse gap-3 border-t border-[color:var(--pf-border-soft)] pt-5 sm:flex-row">
              <button type="submit" disabled={saving || locations.isLoading} className={cn(primaryBtn, "px-6 sm:min-w-40")}>
                <Save className="size-5" /> {saving ? "در حال ذخیره..." : isEdit ? "ذخیره تغییرات" : "ثبت آدرس"}
              </button>
              <button type="button" onClick={onClose} className={cn(outlineBtn, "px-8")}>
                انصراف
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}