"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  Menu,
  CreditCard,
  HelpCircle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { siteConfig } from "@/lib/config/site";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";

// 导航菜单配置
const navItems = [
  {
    title: "核心功能",
    items: [
      {
        title: "功能中心",
        href: "/features",
        icon: Sparkles,
      },
      {
        title: "AI 对话",
        href: "/chat",
        icon: MessageSquare,
      },
      {
        title: "控制台",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "文件上传",
        href: "/upload",
        icon: Upload,
      },
    ],
  },
  {
    title: "账户",
    items: [
      {
        title: "个人中心",
        href: "/me",
        icon: User,
      },
      {
        title: "订阅管理",
        href: "/billing", // 假设的路径
        icon: CreditCard,
        disabled: true, // 暂未开发
      },
    ],
  },
  {
    title: "开发示例",
    items: [
      {
        title: "UI 示例",
        href: "/example-ui",
        icon: Sparkles,
      },
    ],
  },
];

interface AppSidebarProps {
  user?: any;
  className?: string;
}

export function AppSidebar({ user, className }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn("flex h-full w-full flex-col bg-white dark:bg-neutral-900 border-r border-border/40", className)}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center px-6 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
            {siteConfig.name[0]}
          </div>
          <span className="tracking-tight">{siteConfig.name}</span>
        </Link>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-6">
          {navItems.map((group) => (
            <div key={group.title} className="px-3">
              <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.disabled ? "#" : item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/5 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        item.disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {item.title}
                      {item.disabled && (
                        <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">Soon</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer (User Profile) */}
      <div className="p-3 border-t border-border/40">
        {user ? (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group relative">
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={user.image} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {user.name?.[0] || user.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{user.name || user.username}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            {/* 简单的退出按钮 (实际项目中可能是 Dropdown) */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={async () => {
                await authClient.signOut();
                window.location.href = "/";
              }}
              title="退出登录"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <div className="p-2">
            <Button asChild className="w-full" size="sm">
              <Link href="/sign-in">登录 / 注册</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile Drawer Component (reusing the same sidebar content)
export function MobileSidebar({ user }: { user?: any }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground">
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <AppSidebar user={user} className="border-none" />
      </SheetContent>
    </Sheet>
  );
}
