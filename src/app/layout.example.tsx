import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css"; // make sure globals-auth.css tokens are merged in here

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
    // suppressHydrationWarning is required by next-themes (it sets the class
    // attribute on <html> before hydration to avoid a light/dark flash).
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster
              position="top-center"
              dir="rtl"
              toastOptions={{ style: { fontFamily: "inherit" } }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
