"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
    ChevronLeft,
    CreditCard,
    MapPin,
    Moon,
    Package,
    PackageCheck,
    PackageOpen,
    Pencil,
    ShoppingBag,
    Sun,
    Undo2,
    UserRound,
    type LucideIcon,
} from "lucide-react";
import { useExtraInfo, useProfile } from "@/hooks/use-profile";
import { assetUrl } from "@/lib/media";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { AvatarSection } from "@/components/profile/avatar-section";
import { PersonalInfoSection } from "@/components/profile/personal-info-section";
import { FinancialSection } from "@/components/profile/financial-section";
import { AddressesSection } from "@/components/profile/addresses-section";
import { cn } from "@/lib/utils";
import "@/components/home/home.css";

type SheetKey = "avatar" | "personal" | "financial" | "addresses";

const SHEET_TITLE: Record<SheetKey, string> = {
    avatar: "تغییر آواتار",
    personal: "اطلاعات شخصی",
    financial: "اطلاعات مالی",
    addresses: "آدرس‌های من",
};

const fmt = (n: number) => n.toLocaleString("en-US");

function MenuRow({
                     Icon,
                     title,
                     hint,
                     onClick,
                     href,
                     right,
                 }: {
    Icon: LucideIcon;
    title: string;
    hint?: string;
    onClick?: () => void;
    href?: string;
    right?: React.ReactNode;
}) {
    const cls = "flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors active:bg-[color:var(--hm-border)]";
    const body = (
        <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--hm-surface)] text-[color:var(--hm-brand)]">
        <Icon className="size-5" />
      </span>
            <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
                {hint && <span className="mt-0.5 block truncate text-xs text-[color:var(--hm-text-muted)]">{hint}</span>}
      </span>
            {right ?? <ChevronLeft className="size-5 text-[color:var(--hm-text-faint)]" />}
        </>
    );
    return href ? (
        <Link href={href} className={cls}>
            {body}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={cls}>
            {body}
        </button>
    );
}

function ThemeRow() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    const dark = mounted && resolvedTheme === "dark";
    return (
        <MenuRow
            Icon={dark ? Moon : Sun}
            title="حالت تاریک"
            hint={dark ? "فعال" : "غیرفعال"}
            onClick={() => setTheme(dark ? "light" : "dark")}
            right={
                <span
                    aria-hidden
                    className={cn(
                        "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
                        dark ? "bg-[color:var(--hm-brand)]" : "bg-[color:var(--hm-border)]"
                    )}
                >
          <span className={cn("size-5 rounded-full bg-white shadow transition-transform", dark ? "-translate-x-5" : "translate-x-0")} />
        </span>
            }
        />
    );
}

export default function ProfilePage() {
    const { data, isLoading, isError, refetch } = useProfile();
    const extra = useExtraInfo();
    const [sheet, setSheet] = React.useState<SheetKey | null>(null);
    const close = React.useCallback(() => setSheet(null), []);

    const info = data?.personal_info;
    const stats = data?.order_stats;
    const avatar = assetUrl(info?.avatar_url);
    const fullName = [info?.first_name, info?.last_name].filter(Boolean).join(" ") || "کاربر";

    const orderTiles = [
        { label: "در جریان", value: stats?.active_orders ?? 0, Icon: PackageOpen, tab: "active" },
        { label: "تحویل شده", value: stats?.delivered_orders ?? 0, Icon: PackageCheck, tab: "delivered" },
        { label: "مرجوعی", value: stats?.returned_orders ?? 0, Icon: Undo2, tab: "returned" },
    ];

    return (
        <main className="mx-auto min-h-dvh w-full max-w-md bg-[color:var(--hm-bg)] pb-28 text-[color:var(--hm-text)]">
            <header className="px-5 py-4 text-center">
                <h1 className="text-xl font-extrabold">حساب کاربری</h1>
            </header>

            {isError ? (
                <div className="flex flex-col items-center gap-3 px-5 py-24 text-center text-sm">
                    <p className="text-[color:var(--hm-text-muted)]">دریافت اطلاعات پروفایل ناموفق بود.</p>
                    <button type="button" onClick={() => refetch()} className="h-10 rounded-full border border-[color:var(--hm-brand)] px-5 text-[color:var(--hm-brand)]">
                        تلاش دوباره
                    </button>
                </div>
            ) : isLoading || !data ? (
                <div className="space-y-4 px-5">
                    <div className="h-40 animate-pulse rounded-[28px] bg-[color:var(--hm-muted)]" />
                    <div className="h-28 animate-pulse rounded-[28px] bg-[color:var(--hm-muted)]" />
                    <div className="h-64 animate-pulse rounded-[28px] bg-[color:var(--hm-muted)]" />
                </div>
            ) : (
                <div className="space-y-4 px-5">
                    {/* هدر پروفایل */}
                    <section className="flex flex-col items-center gap-3 rounded-[28px] bg-[color:var(--hm-muted)] px-5 py-6 text-center">
                        <button type="button" aria-label="تغییر آواتار" onClick={() => setSheet("avatar")} className="relative">
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt="" className="size-24 rounded-full border-4 border-[color:var(--hm-surface)] object-cover" />
                            ) : (
                                <span className="flex size-24 items-center justify-center rounded-full border-4 border-[color:var(--hm-surface)] bg-[color:var(--hm-avatar-bg)] text-3xl font-bold text-[color:var(--hm-avatar-text)]">
                  {fullName[0]}
                </span>
                            )}
                            <span className="absolute bottom-0 left-0 flex size-8 items-center justify-center rounded-full border-2 border-[color:var(--hm-muted)] bg-[color:var(--hm-brand)] text-[color:var(--hm-on-brand)]">
                <Pencil className="size-4" />
              </span>
                        </button>
                        <div>
                            <h2 className="text-lg font-extrabold">{fullName}</h2>
                            {info?.location && (
                                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-[color:var(--hm-text-muted)]">
                                    <MapPin className="size-3.5" />
                                    {info.location}
                                </p>
                            )}
                        </div>
                        {info?.badge && (
                            <span className="rounded-full bg-[color:var(--hm-brand-soft)] px-3 py-1 text-xs font-bold text-[color:var(--hm-brand)]">
                {info.badge}
              </span>
                        )}
                    </section>

                    {/* سفارش‌ها */}
                    <section className="rounded-[28px] bg-[color:var(--hm-muted)] p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-extrabold">سفارش‌های من</h2>
                            <Link href="/orders" className="flex items-center gap-0.5 text-xs font-semibold text-[color:var(--hm-brand)]">
                                مشاهده همه
                                <ChevronLeft className="size-4" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {orderTiles.map(({ label, value, Icon, tab }) => (
                                <Link
                                    key={tab}
                                    href={`/orders?tab=${tab}`}
                                    className="flex flex-col items-center gap-1 rounded-2xl bg-[color:var(--hm-surface)] px-2 py-4 text-center transition-transform active:scale-95"
                                >
                                    <Icon className="size-6 text-[color:var(--hm-brand)]" />
                                    <span className="text-xl font-extrabold">{fmt(value)}</span>
                                    <span className="text-[11px] text-[color:var(--hm-text-muted)]">{label}</span>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* منو */}
                    <section className="divide-y divide-[color:var(--hm-border)] overflow-hidden rounded-[28px] bg-[color:var(--hm-muted)]">
                        <MenuRow Icon={Package} title="پیگیری سفارش‌ها" hint="وضعیت و تاریخچه‌ی خریدها" href="/orders" />
                        <MenuRow Icon={ShoppingBag} title="سبد خرید" href="/cart" />
                        <MenuRow Icon={UserRound} title="اطلاعات شخصی" hint="نام، کد ملی و تاریخ تولد" onClick={() => setSheet("personal")} />
                        <MenuRow Icon={CreditCard} title="اطلاعات مالی" hint="شماره شبا و کارت" onClick={() => setSheet("financial")} />
                        <MenuRow Icon={MapPin} title="آدرس‌های من" hint="افزودن، ویرایش و حذف آدرس" onClick={() => setSheet("addresses")} />
                        <ThemeRow />
                    </section>
                </div>
            )}

            {sheet && data && (
                <ProfileSheet title={SHEET_TITLE[sheet]} onClose={close}>
                    {sheet === "avatar" && <AvatarSection info={data.personal_info} />}
                    {sheet === "personal" && <PersonalInfoSection info={data.personal_info} extra={extra} />}
                    {sheet === "financial" && <FinancialSection extra={extra} />}
                    {sheet === "addresses" && <AddressesSection />}
                </ProfileSheet>
            )}
        </main>
    );
}