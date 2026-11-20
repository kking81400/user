import BottomNav from "@/components/layout/bottom-nav";

export default function MainLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        // کانتینر اصلی موبایل با max-w-md و mx-auto برای محدود کردن عرض در تبلت/دسکتاپ
        <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-black text-white shadow-2xl">

            {/* محتوای صفحات (کلاس pb-20 برای اینکه محتوا زیر نوار پایین نرود) */}
            <div className="flex-1 overflow-y-auto pb-20">
                {children}
            </div>

            {/* نوار نویگیشن */}
            <BottomNav />
        </main>
    );
}