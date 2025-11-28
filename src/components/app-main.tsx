"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { shouldHideTabbar, isImmersivePage } from "@/lib/config/navigation";

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabbarHidden = shouldHideTabbar(pathname);
  const immersive = isImmersivePage(pathname);

  return (
    <main
      className={cn(
        "flex-1 flex flex-col min-h-0",
        immersive ? "w-full p-0" : "w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8",
        // 如果 Tabbar 隐藏且不是沉浸式（如设置页），留小一点的底边距；如果是沉浸式，由页面自己控制
        !immersive && tabbarHidden ? "pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:pb-8" : "",
        !immersive && !tabbarHidden ? "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8" : "",
      )}
    >
      {children}
    </main>
  );
}
