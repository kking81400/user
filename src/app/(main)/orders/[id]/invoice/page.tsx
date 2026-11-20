"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Download, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { useOrder } from "@/hooks/use-orders";
import { InvoiceDocument, PAPER_W } from "@/components/orders/invoice-document";
import { elementToPdf } from "@/lib/invoice-pdf";
import "@/components/home/home.css";

/** فقط خود فاکتور چاپ شود؛ بقیه‌ی صفحه (هدر، دکمه‌ها، منوی پایین) مخفی می‌شود */
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 8mm; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #invoice-print, #invoice-print * { visibility: visible !important; }
  #invoice-print { position: absolute; top: 0; right: 0; left: 0; }
  #invoice-print .inv-outer { height: auto !important; overflow: visible !important; }
  #invoice-print .inv-scale { width: 100% !important; transform: none !important; }
  #invoice-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/** پیش‌نمایش کاغذ: فاکتور با عرض ثابت A4 ساخته و به عرض صفحه‌ی موبایل کوچک می‌شود */
function PaperPreview({ children }: { children: React.ReactNode }) {
    const outer = React.useRef<HTMLDivElement>(null);
    const inner = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(1);
    const [height, setHeight] = React.useState<number | undefined>();

    React.useEffect(() => {
        const o = outer.current;
        const i = inner.current;
        if (!o || !i) return;
        const update = () => {
            const s = Math.min(1, o.clientWidth / PAPER_W);
            setScale(s);
            setHeight(i.offsetHeight * s);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(o);
        ro.observe(i);
        return () => ro.disconnect();
    }, []);

    return (
        <div
            ref={outer}
            className="inv-outer w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5"
            style={{ height, visibility: height == null ? "hidden" : "visible" }}
        >
            <div ref={inner} className="inv-scale" style={{ width: PAPER_W, transform: `scale(${scale})`, transformOrigin: "top right" }}>
                {children}
            </div>
        </div>
    );
}

export default function InvoicePage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const { data: order, isLoading, isError, refetch } = useOrder(decodeURIComponent(id ?? ""));

    const [pdfBusy, setPdfBusy] = React.useState(false);
    const pdfRef = React.useRef<HTMLDivElement>(null);

    // PDF از یک نسخه‌ی بدون مقیاس (عرض کامل A4) ساخته می‌شود که فقط هنگام ساخت mount است
    React.useEffect(() => {
        if (!pdfBusy || !order) return;
        let alive = true;
        (async () => {
            await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
            try {
                if (pdfRef.current) await elementToPdf(pdfRef.current, `invoice-${order.number}.pdf`);
            } catch {
                toast.error("ساخت PDF انجام نشد. از دکمه‌ی چاپ و «ذخیره به‌صورت PDF» استفاده کنید.");
            } finally {
                if (alive) setPdfBusy(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [pdfBusy, order]);

    const onPrint = () => {
        if (!order) return;
        const prev = document.title;
        document.title = `فاکتور-${order.number}`; // اسم پیش‌فرض فایل هنگام «ذخیره به‌صورت PDF»
        const restore = () => {
            document.title = prev;
            window.removeEventListener("afterprint", restore);
        };
        window.addEventListener("afterprint", restore);
        window.print();
    };

    const btn =
        "flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors disabled:opacity-50";

    return (
        <main className="mx-auto min-h-dvh w-full max-w-md bg-[color:var(--hm-bg)] pb-44 text-[color:var(--hm-text)]">
            <style>{PRINT_CSS}</style>

            <header
                dir="ltr"
                className="sticky top-0 z-10 flex items-center justify-between border-b border-[color:var(--hm-border)] bg-[color:var(--hm-glass)] px-5 py-4 backdrop-blur-md"
            >
                <span className="size-9" />
                <h1 className="text-xl font-extrabold">فاکتور سفارش</h1>
                <button type="button" aria-label="بازگشت" onClick={() => router.back()} className="flex size-9 items-center justify-center">
                    <ArrowRight className="size-6 -scale-x-100" />
                </button>
            </header>

            {isLoading ? (
                <div className="px-4 pt-5">
                    <div className="h-[520px] animate-pulse rounded-2xl bg-[color:var(--hm-muted)]" />
                </div>
            ) : isError || !order ? (
                <div className="flex flex-col items-center gap-3 px-5 py-24 text-center text-sm">
                    <p className="text-[color:var(--hm-text-muted)]">دریافت اطلاعات فاکتور ناموفق بود.</p>
                    <button type="button" onClick={() => refetch()} className="h-10 rounded-full border border-[color:var(--hm-brand)] px-5 text-[color:var(--hm-brand)]">
                        تلاش دوباره
                    </button>
                </div>
            ) : (
                <>
                    <div id="invoice-print" className="px-4 pt-5">
                        <PaperPreview>
                            <InvoiceDocument order={order} />
                        </PaperPreview>
                    </div>

                    {/* دکمه‌ها (بالای منوی پایین) */}
                    <div className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-h,64px)+env(safe-area-inset-bottom))] z-20 mx-auto flex w-full max-w-md gap-3 bg-[color:var(--hm-surface)] px-5 pb-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
                        <button
                            type="button"
                            onClick={onPrint}
                            className={`${btn} border-2 border-[color:var(--hm-brand)] text-[color:var(--hm-brand)] active:bg-[color:var(--hm-brand-soft)]`}
                        >
                            <Printer className="size-5" />
                            چاپ
                        </button>
                        <button
                            type="button"
                            disabled={pdfBusy}
                            onClick={() => setPdfBusy(true)}
                            className={`${btn} bg-[color:var(--hm-brand)] text-[color:var(--hm-on-brand)] active:bg-[color:var(--hm-brand-hover)]`}
                        >
                            {pdfBusy ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
                            دانلود PDF
                        </button>
                    </div>

                    {/* نسخه‌ی خارج از دید فقط برای ساخت PDF */}
                    {pdfBusy && (
                        <div aria-hidden style={{ position: "fixed", left: -10000, top: 0, width: PAPER_W }}>
                            <InvoiceDocument ref={pdfRef} id="invoice-pdf-root" order={order} />
                        </div>
                    )}
                </>
            )}
        </main>
    );
}