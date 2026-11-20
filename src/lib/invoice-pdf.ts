/**
 * یک المان DOM را به PDF (A4) تبدیل و دانلود می‌کند.
 * کتابخانه‌ها فقط هنگام کلیک روی «دانلود PDF» لود می‌شوند (dynamic import)، پس به باندل اولیه اضافه نمی‌شوند.
 * متن فارسی به‌صورت تصویر در PDF قرار می‌گیرد تا اتصال حروف و فونت دقیقاً مثل صفحه باشد.
 */
export async function elementToPdf(el: HTMLElement, filename: string): Promise<void> {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

    // مطمئن شو فونت‌ها لود شده‌اند
    if (document.fonts?.ready) await document.fonts.ready;

    const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        onclone: (doc) => {
            const node = doc.getElementById(el.id);
            if (node) {
                node.style.position = "static";
                node.style.left = "0";
            }
        },
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const pxPerMm = canvas.width / pageW;
    const sliceH = Math.floor(pageH * pxPerMm); // ارتفاع هر صفحه به پیکسل canvas

    // اگر فاکتور بلندتر از یک صفحه بود، به چند صفحه تقسیم می‌شود
    let y = 0;
    let page = 0;
    while (y < canvas.height) {
        const h = Math.min(sliceH, canvas.height - y);
        const part = document.createElement("canvas");
        part.width = canvas.width;
        part.height = h;
        const ctx = part.getContext("2d");
        if (!ctx) throw new Error("canvas unavailable");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, part.width, h);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (page > 0) pdf.addPage();
        pdf.addImage(part.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, h / pxPerMm);
        y += h;
        page += 1;
    }

    pdf.save(filename);
}