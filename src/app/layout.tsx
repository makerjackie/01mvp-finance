import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNav } from "@/components/top-nav";
import { MobileTabbar } from "@/components/mobile-tabbar";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <TopNav />
          <main className="pb-16 md:pb-0">{children}</main>
          <MobileTabbar />
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
