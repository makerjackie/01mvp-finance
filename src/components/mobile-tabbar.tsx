"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, PlusCircle, ClipboardList, User as UserIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { shouldHideTabbar } from "@/lib/config/navigation";
import type { User } from "better-auth";

type MobileTabbarProps = {
  user?: User;
};

type TabItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  active: boolean;
};

export function MobileTabbar({ user }: MobileTabbarProps) {
  const pathname = usePathname();

  if (!user || shouldHideTabbar(pathname)) {
    return null;
  }

  const tabs: TabItem[] = [
    {
      label: "主页",
      icon: Wallet,
      href: "/finance",
      active: pathname === "/finance",
    },
    {
      label: "新建",
      icon: PlusCircle,
      href: "/finance/submit",
      active: pathname === "/finance/submit",
    },
    {
      label: "记录",
      icon: ClipboardList,
      href: "/finance/my-records",
      active: pathname === "/finance/my-records",
    },
    {
      label: "我的",
      icon: UserIcon,
      href: "/me",
      active: pathname === "/me" || pathname.startsWith("/me/"),
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
