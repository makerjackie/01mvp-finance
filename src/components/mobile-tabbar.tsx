"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, User, LayoutDashboard, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldHideTabbar } from "@/lib/config/navigation";

type MobileTabbarProps = {
  user?: any;
};

type TabItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active: boolean;
};

export function MobileTabbar({ user }: MobileTabbarProps) {
  const pathname = usePathname();
  const isAuthed = Boolean(user);

  // 登录/注册、沉浸式页面隐藏 Tabbar
  if (shouldHideTabbar(pathname)) {
    return null;
  }

  const tabs: TabItem[] = [
    {
      label: isAuthed ? "控制台" : "首页",
      icon: isAuthed ? LayoutDashboard : Home,
      href: isAuthed ? "/dashboard" : "/",
      active: isAuthed ? pathname.startsWith("/dashboard") : pathname === "/",
    },
    {
      label: "功能",
      icon: Sparkles,
      href: "/features",
      active: pathname === "/features",
    },
    {
      label: "对话",
      icon: MessageSquare,
      href: "/chat",
      active: pathname === "/chat",
    },
    {
      label: "我的",
      icon: User,
      href: "/me",
      active: pathname === "/me",
    },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
      <div className="bg-background/80 backdrop-blur-xl border border-border/50 shadow-lg rounded-2xl px-4 py-2 flex items-center justify-between">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center justify-center gap-1 group relative py-1 px-2"
          >
            <div
              className={cn(
                "p-2 rounded-xl transition-all duration-200",
                tab.active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
              )}
            >
              <tab.icon className="h-5 w-5" strokeWidth={tab.active ? 2.5 : 2} />
            </div>
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                tab.active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {tab.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
