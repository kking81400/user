"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Headset, Loader2, MapPin, Phone, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useOrder, useRetryPayment } from "@/hooks/use-orders";
import { useAddresses } from "@/hooks/use-addresses";
import { pickAddress } from "@/components/checkout/address-picker";
import { PackageCard } from "@/components/orders/package-card";
import { readSubmitResult } from "@/lib/api/orders";
import "@/components/home/home.css";

const fmt = (n: number) => n.toLocaleString("en-US");
const card = "rounded-3xl border border-[color:var(--hm-border)] bg-[color:var(--hm-surface)] p-5";
const pill =
    "flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-[color:var(--hm-brand)] text-sm font-bold text-[color:var(--hm-on-brand)] shadow-md shadow-[color:var(--hm-brand-soft)] transition-colors active:bg-[color:var(--hm-brand-hover)] disabled:opacity-50";

/** صفحه‌ی پیگیری مرسولات */
export default function OrderTrackingPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { data: order, isLoading, isError, refetch } = useOrder(decodeURIComponent(id ?? ""));
    const { data: addresses } = useAddresses();
    const retry = useRetryPayment();

    const onRetry = () => {
        if (!order) return;
        const addressId = order.address?.id ?? pickAddress(addresses, null)?.id;
        if (addressId == null) return toast.error("ابتدا یک آدرس ثبت کنید");
        retry.mutate(
            { id: order.number, payload: { address_id: addressId, payment_method: "online", shipping_method: "post" } },
            {
                onSuccess: (raw) => {
                    const { paymentUrl } = readSubmitResult(raw);
                    if (paymentUrl) window.location.href = paymentUrl;
                    else toast.success("درخواست پرداخت ثبت شد");
                },
            }
        );
    };

    const paid = order?.paid ?? false;
    const anyDelivered = order?.packages.some((p) => p.status === "delivered");

    return (
        <main className="mx-auto min-h-dvh w-full max-w-md bg-[color:var(--hm-bg)] pb-28 text-[color:var(--hm-text)]">
            <header
                dir="ltr"
                className="sticky top-0 z-10 flex items-center justify-between border-b border-[color:var(--hm-border)] bg-[color:var(--hm-glass)] px-5 py-4 backdrop-blur-md"
            >
                <button
                    type="button"
                    aria-label="پشتیبانی"
                    onClick={() => toast.info("پشتیبانی به‌زودی فعال می‌شود")}
                    className="flex size-9 items-center justify-center"
                >
                    <Headset className="size-6" />
                </button>
                <h1 className="text-xl font-extrabold">پیگیری مرسولات</h1>
                <button type="button" aria-label="بازگشت" onClick={() => router.back()} className="flex size-9 items-center justify-center">
                    <ArrowRight className="size-6 -scale-x-100" />
                </button>
            </header>

            {isLoading ? (
                <div className="space-y-4 px-5 pt-5">
                    {[90, 280, 150, 180].map((h) => (
                        <div key={h} className="animate-pulse rounded-3xl bg-[color:var(--hm-muted)]" style={{ height: h }} />
                    ))}
                </div>
            ) : isError || !order ? (
                <div className="flex flex-col items-center gap-3 px-5 py-24 text-center text-sm">
                    <p className="text-[color:var(--hm-text-muted)]">دریافت اطلاعات سفارش ناموفق بود.</p>
                    <button type="button" onClick={() => refetch()} className="h-10 rounded-full border border-[color:var(--hm-brand)] px-5 text-[color:var(--hm-brand)]">
                        تلاش دوباره
                    </button>
                </div>
            ) : (
                <div className="space-y-4 px-5 pt-5">
                    {/* شماره و تاریخ */}
                    <section className={`${card} flex items-center justify-between`}>
                        <div>
                            <p className="text-xs text-[color:var(--hm-text-muted)]">شماره سفارش</p>
                            <p dir="ltr" className="mt-1 text-start text-xl font-extrabold">#{order.number}</p>
                            <span
                                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                                    order.paid
                                        ? "bg-green-500/15 text-green-600"
                                        : order.paymentStatus === "failed"
                                            ? "bg-rose-500/15 text-rose-500"
                                            : "bg-amber-500/15 text-amber-600"
                                }`}
                            >
                {order.paid ? "پرداخت شده" : order.paymentStatus === "failed" ? "پرداخت ناموفق" : "پرداخت نشده"}
              </span>
                        </div>
                        {order.date && (
                            <div className="text-end">
                                <p className="text-xs text-[color:var(--hm-text-muted)]">تاریخ ثبت</p>
                                <p className="mt-1 text-sm font-extrabold">{order.date}</p>
                            </div>
                        )}
                    </section>

                    {/* بسته‌ها */}
                    {order.packages.map((p) => (
                        <PackageCard key={p.index} pkg={p} />
                    ))}

                    {/* آدرس */}
                    {order.address && (
                        <section className={card}>
                            <h2 className="flex items-center gap-2 font-extrabold">
                                <MapPin className="size-5 text-[color:var(--hm-text-muted)]" />
                                آدرس تحویل گیرنده
                            </h2>
                            <div className="mt-3 border-s-2 border-[color:var(--hm-border)] ps-4">
                                {order.address.title && <p className="font-bold">{order.address.title}</p>}
                                <p className="mt-1.5 text-sm leading-7 text-[color:var(--hm-text-muted)]">{order.address.text}</p>
                                {order.address.postalCode && (
                                    <p className="text-xs text-[color:var(--hm-text-faint)]">کد پستی: {order.address.postalCode}</p>
                                )}
                                {order.address.phone && (
                                    <p className="mt-2 flex items-center gap-2 text-sm text-[color:var(--hm-text-muted)]">
                                        <Phone className="size-4" />
                                        <span dir="ltr">{order.address.phone}</span>
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {/* خلاصه پرداخت */}
                    <section className={card}>
                        <h2 className="font-extrabold">خلاصه پرداخت</h2>
                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <dt className="text-[color:var(--hm-text-muted)]">مجموع اقلام</dt>
                                <dd className="font-bold">{fmt(order.summary.itemsTotal)} تومان</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-[color:var(--hm-text-muted)]">هزینه ارسال</dt>
                                <dd className="font-bold">{fmt(order.summary.shipping)} تومان</dd>
                            </div>
                            <div className="flex items-center justify-between">
                                <dt className="text-[color:var(--hm-text-muted)]">تخفیف</dt>
                                <dd className="font-bold text-rose-500">{fmt(order.summary.discount)} تومان</dd>
                            </div>
                        </dl>
                        <div className="my-4 h-px bg-[color:var(--hm-border)]" />
                        <div className="flex items-center justify-between">
                            <span className="font-extrabold">{paid ? "مبلغ کل پرداخت شده" : "مبلغ قابل پرداخت"}</span>
                            <span className="text-lg font-extrabold text-[color:var(--hm-brand)]">{fmt(order.summary.final)} تومان</span>
                        </div>
                    </section>

                    {/* دکمه‌ها */}
                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={() => router.push(`/orders/${encodeURIComponent(id)}/invoice`)} className={pill}>
                            <Receipt className="size-5" />
                            مشاهده فاکتور
                        </button>
                        {order.canRetry ? (
                            <button type="button" disabled={retry.isPending} onClick={onRetry} className={pill}>
                                {retry.isPending && <Loader2 className="size-5 animate-spin" />}
                                پرداخت مجدد
                            </button>
                        ) : paid && anyDelivered ? (
                            <button type="button" onClick={() => toast.info("درخواست مرجوعی به‌زودی فعال می‌شود")} className={pill}>
                                مرجوع کردن
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
        </main>
    );
}