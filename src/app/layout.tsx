import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const iranSans = localFont({
    src: "./fonts/IRANSansWeb.woff2",
    variable: "--font-iran-sans",
    display: "swap",
});

export const metadata: Metadata = {
    title: "فروشگاه",
    description: "ورود و ثبت نام",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fa" dir="rtl" suppressHydrationWarning>
        <body className={iranSans.variable}>
        <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
        </body>
        </html>
    );
}