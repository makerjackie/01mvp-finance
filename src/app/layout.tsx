import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
          {/* Root Layout 只包含最基础的 Provider 和 Marketing TopNav */}
          {/* App Layout 会在自己的 layout.tsx 里覆盖这部分结构，或者我们在这里做条件渲染 */}
          {/* 但由于我们用了 Route Groups (app)，这层 RootLayout 会包裹所有内容。*/}
          {/* 策略：TopNav 仅在非 (app) 路由下显示比较麻烦。*/}
          {/* 更好的策略：TopNav 只在首页显示，或者我们在 (app) layout 里隐藏它？*/}
          {/* Next.js 最佳实践：RootLayout 应该尽量干净。我们将 TopNav 移到 page.tsx 或者创建一个 (marketing) group。*/}
          {/* 但为了简单起见，我们让 TopNav 变得智能，或者只在首页引入。*/}
          {/* 既然我们要完全分离，我建议：TopNav 应该只在 Landing Page 出现。*/}
          {/* 但这里 children 可能是首页，也可能是 (app)。*/}
          {/* 让我们把 TopNav 从这里移除，放到 src/app/page.tsx 里，或者创建一个 (marketing)/layout.tsx */}

          {/* 暂时保留 TopNav，但在 App 页面它会被双重导航困扰吗？*/}
          {/* 是的。所以必须移除全局 TopNav。*/}

          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
