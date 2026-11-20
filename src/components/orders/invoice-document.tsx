import * as React from "react";
import type { OrderDetail } from "@/types/order";

/** عرض کاغذ A4 به پیکسل (۹۶dpi)؛ پیش‌نمایش، چاپ و PDF همه روی همین طرح ساخته می‌شوند */
export const PAPER_W = 794;

const INK = "#1f1a17";
const MUTED = "#6b6058";
const LINE = "#e7ded6";
const BRAND = "#a36a47";
const SOFT = "#f8f3ee";

const fmt = (n: number) => n.toLocaleString("en-US");

const PAY_METHOD: Record<string, string> = {
    online: "پرداخت آنلاین",
    wallet: "کیف پول",
    cod: "پرداخت در محل",
};

/**
 * خود فاکتور. رنگ‌ها عمداً ثابت (روشن) هستند تا در تم تاریک هم چاپ/PDF سفید و خوانا باشد.
 * توجه: از tracking-* استفاده نشده چون فاصله‌ی حروف، اتصال حروف فارسی را در PDF خراب می‌کند.
 */
export const InvoiceDocument = React.forwardRef<HTMLDivElement, { order: OrderDetail; id?: string }>(
    function InvoiceDocument({ order, id }, ref) {
        const paid = order.paid;
        let row = 0;
        const s = order.summary;

        return (
            <div
                ref={ref}
                id={id}
                dir="rtl"
                style={{ background: "#fff", color: INK, padding: 40, fontSize: 13, lineHeight: 1.8 }}
            >
                {/* سربرگ */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 20, borderBottom: `2px solid ${BRAND}` }}>
                    <div>
                        <div style={{ fontSize: 30, fontWeight: 900, color: BRAND, lineHeight: 1 }}>MASS</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: MUTED }}>فروشگاه آنلاین پوشاک</div>
                    </div>
                    <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>فاکتور فروش</div>
                        <div
                            style={{
                                display: "inline-block",
                                marginTop: 8,
                                padding: "2px 14px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                                color: paid ? "#15803d" : "#b45309",
                                background: paid ? "#dcfce7" : "#fef3c7",
                            }}
                        >
                            {paid ? "پرداخت شده" : order.paymentStatus === "failed" ? "پرداخت ناموفق" : "پرداخت نشده"}
                        </div>
                    </div>
                </div>

                {/* مشخصات سفارش */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 20 }}>
                    {[
                        ["شماره سفارش", order.number, true],
                        ["تاریخ ثبت", order.date ?? "—", false],
                        ["شماره سفارش اصلی", order.masterNumber ?? "—", true],
                        ["روش پرداخت", order.paymentMethod ? PAY_METHOD[order.paymentMethod] ?? order.paymentMethod : "—", false],
                    ].map(([k, v, ltr]) => (
                        <div key={String(k)} style={{ background: SOFT, borderRadius: 12, padding: "10px 14px" }}>
                            <div style={{ fontSize: 11, color: MUTED }}>{k}</div>
                            <div dir={ltr ? "ltr" : "rtl"} style={{ marginTop: 2, fontWeight: 700, textAlign: "right" }}>
                                {v}
                            </div>
                        </div>
                    ))}
                </div>

                {/* تحویل گیرنده */}
                {order.address && (
                    <div style={{ marginTop: 16, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 16px" }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: BRAND }}>تحویل گیرنده</div>
                        {order.address.title && <div style={{ marginTop: 4, fontWeight: 700 }}>{order.address.title}</div>}
                        <div style={{ color: MUTED }}>{order.address.text}</div>
                        <div style={{ marginTop: 4, display: "flex", gap: 24, fontSize: 12, color: MUTED }}>
                            {order.address.postalCode && <span>کد پستی: {order.address.postalCode}</span>}
                            {order.address.phone && (
                                <span>
                  تلفن: <span dir="ltr">{order.address.phone}</span>
                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* اقلام */}
                <table style={{ width: "100%", marginTop: 20, borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                    <tr style={{ background: BRAND, color: "#fff" }}>
                        {["ردیف", "شرح کالا", "تعداد", "قیمت واحد (تومان)", "مبلغ (تومان)"].map((h, i) => (
                            <th
                                key={h}
                                style={{
                                    padding: "8px 10px",
                                    fontWeight: 700,
                                    textAlign: i === 1 ? "right" : "center",
                                    whiteSpace: "nowrap",
                                    borderStartStartRadius: i === 0 ? 10 : 0,
                                    borderEndStartRadius: i === 0 ? 10 : 0,
                                    borderStartEndRadius: i === 4 ? 10 : 0,
                                    borderEndEndRadius: i === 4 ? 10 : 0,
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {order.packages.map((p) => (
                        <React.Fragment key={p.index}>
                            <tr>
                                <td colSpan={5} style={{ padding: "10px 10px 4px", fontSize: 11, color: MUTED }}>
                                    بسته {p.index} از {p.total}
                                    {p.shop && <> · فروشنده: <b style={{ color: INK }}>{p.shop}</b></>}
                                    {p.trackingCode && <> · کد رهگیری: <span dir="ltr">{p.trackingCode}</span></>}
                                </td>
                            </tr>
                            {p.items.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: "8px 10px", textAlign: "center", color: MUTED, borderBottom: `1px solid ${LINE}` }}>
                                        اقلام این بسته در حال آماده‌سازی است
                                    </td>
                                </tr>
                            )}
                            {p.items.map((it) => {
                                row += 1;
                                const variant = it.variantText || [it.size && `سایز: ${it.size}`, it.color && `رنگ: ${it.color}`].filter(Boolean).join(" | ");
                                return (
                                    <tr key={it.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                                        <td style={{ padding: "10px", textAlign: "center", color: MUTED }}>{row}</td>
                                        <td style={{ padding: "10px" }}>
                                            <div style={{ fontWeight: 700 }}>{it.name}</div>
                                            {variant && <div style={{ fontSize: 11, color: MUTED }}>{variant}</div>}
                                        </td>
                                        <td style={{ padding: "10px", textAlign: "center" }}>{it.quantity}</td>
                                        <td style={{ padding: "10px", textAlign: "center", whiteSpace: "nowrap" }}>{fmt(it.unitPrice)}</td>
                                        <td style={{ padding: "10px", textAlign: "center", whiteSpace: "nowrap", fontWeight: 700 }}>
                                            {fmt(it.unitPrice * it.quantity)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    </tbody>
                </table>

                {/* جمع‌ها */}
                <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 20 }}>
                    <div style={{ width: 330, background: SOFT, borderRadius: 14, padding: "14px 18px" }}>
                        {[
                            ["مجموع اقلام", s.itemsTotal, false],
                            ["هزینه ارسال", s.shipping, false],
                            ["تخفیف", s.discount, true],
                        ].map(([k, v, red]) => (
                            <div key={String(k)} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: MUTED }}>
                                <span>{k}</span>
                                <span style={{ color: red && Number(v) > 0 ? "#dc2626" : INK, fontWeight: 700 }}>{fmt(Number(v))} تومان</span>
                            </div>
                        ))}
                        <div style={{ margin: "10px 0", borderTop: `1px dashed ${LINE}` }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontWeight: 800 }}>{paid ? "مبلغ کل پرداخت شده" : "مبلغ قابل پرداخت"}</span>
                            <span style={{ fontSize: 17, fontWeight: 900, color: BRAND }}>{fmt(s.final)} تومان</span>
                        </div>
                    </div>
                </div>

                {/* پانویس */}
                <div style={{ marginTop: 28, paddingTop: 12, borderTop: `1px solid ${LINE}`, textAlign: "center", fontSize: 11, color: MUTED }}>
                    از خرید شما سپاسگزاریم. این فاکتور به‌صورت الکترونیکی صادر شده و نیازی به مهر و امضا ندارد.
                </div>
            </div>
        );
    }
);