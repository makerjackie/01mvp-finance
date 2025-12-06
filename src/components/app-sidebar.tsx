"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Sparkles,
  Menu,
  CreditCard,
  Upload,
  ImageIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import * as React from "react";

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
        title: "AI 生图",
        href: "/ai-image",
        icon: ImageIcon,
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
        icon: UserIcon,
      },
      {
        title: "订阅管理",
        href: "/billing", // 假设的路径
        icon: CreditCard,
        disabled: true, // 暂未开发
      },
    ],
  },
];

import type { User } from "better-auth";

interface SidebarContentProps {
  user?: User;
  className?: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

export function SidebarContent({
  user,
  className,
  isCollapsed = false,
  onToggle,
  isMobile = false,
}: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn("flex h-full w-full flex-col bg-white dark:bg-neutral-900 border-r border-border/40", className)}
    >
      {/* Sidebar Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border/40 transition-all duration-300",
          isCollapsed ? "justify-center px-2" : "px-6 justify-between",
        )}
      >
        {!isCollapsed && (
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity overflow-hidden"
          >
            <Logo size={26} textClassName="tracking-tight" />
          </Link>
        )}

        {/* Toggle Button (Desktop only) */}
        {!isMobile && onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 text-muted-foreground", isCollapsed && "w-full h-full")}
            onClick={onToggle}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}

        {/* Mobile Logo */}
        {isMobile && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo size={26} />
          </Link>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-6">
          {navItems.map((group) => (
            <div key={group.title} className={cn("px-0", isCollapsed ? "text-center" : "px-3")}>
              {!isCollapsed && (
                <h3 className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider px-2">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  const LinkContent = (
                    <Link
                      href={item.disabled ? "#" : item.href}
                      className={cn(
                        "group flex items-center rounded-md transition-all",
                        isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-primary/5 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        item.disabled && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="truncate">{item.title}</span>
                          {item.disabled && (
                            <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded">Soon</span>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={0}>
                        <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          {item.title}
                          {item.disabled && <span className="text-[10px] bg-muted px-1 rounded">Soon</span>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <React.Fragment key={item.href}>{LinkContent}</React.Fragment>;
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer (User Profile) */}
      <div className="p-3 border-t border-border/40">
        {user ? (
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group relative",
              isCollapsed && "justify-center",
            )}
          >
            <Avatar className="h-9 w-9 border border-border/50">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">{user.name?.[0] || "U"}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
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
              </>
            )}
          </div>
        ) : (
          <div className="p-2">
            {isCollapsed ? (
              <Button asChild size="icon" variant="ghost">
                <Link href="/sign-in">
                  <UserIcon className="h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full" size="sm">
                <Link href="/sign-in">登录 / 注册</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DesktopSidebar({ user }: { user?: User }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={cn(
        "hidden md:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64",
      )}
    >
      <TooltipProvider>
        <SidebarContent user={user} isCollapsed={isCollapsed} onToggle={toggle} />
      </TooltipProvider>
    </aside>
  );
}

// Mobile Drawer Component (reusing the same sidebar content)
export function MobileSidebar({ user }: { user?: User }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground">
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-[280px]">
        <SidebarContent user={user} className="border-none" isMobile={true} />
      </SheetContent>
    </Sheet>
  );
}

// Re-export SidebarContent as AppSidebar for backward compatibility if needed,
// but we will update layout.tsx to use DesktopSidebar.
export const AppSidebar = SidebarContent;
