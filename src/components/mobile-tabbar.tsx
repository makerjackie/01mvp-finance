"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileTabbar() {
  const pathname = usePathname();

  // 不在登录/注册页面显示tabbar
  if (pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) {
    return null;
  }

  const tabs = [
    {
      label: "首页",
      icon: Home,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "对话",
      icon: MessageSquare,
      href: "/chat",
      active: pathname === "/chat",
    },
    {
      label: "控制台",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "我的",
      icon: User,
      href: "/me",
      active: pathname === "/me",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 md:hidden pb-[env(safe-area-inset-bottom)]">
      <nav className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-colors active:scale-95",
              tab.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className={cn("h-6 w-6", tab.active && "fill-current")} strokeWidth={tab.active ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
