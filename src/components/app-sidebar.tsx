"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import type { User } from "better-auth";
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet,
  PlusCircle,
  ClipboardList,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  MessageSquare,
  ImageIcon,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { canAccessAdmin } from "@/lib/rbac";

type AppUser = User & { role?: string | null };

type NavItem = {
  title: string;
  href: string;
  activePath: string;
  icon: React.ComponentType<{ className?: string }>;
};

const buildNavItems = (user?: AppUser) => {
  const items: NavItem[] = [
    {
      title: "财务主页",
      href: "/finance",
      activePath: "/finance",
      icon: Wallet,
    },
    {
      title: "新建申请",
      href: "/finance/submit?type=expense",
      activePath: "/finance/submit",
      icon: PlusCircle,
    },
    {
      title: "我的记录",
      href: "/finance/my-records",
      activePath: "/finance/my-records",
      icon: ClipboardList,
    },
    {
      title: "AI 对话",
      href: "/chat",
      activePath: "/chat",
      icon: MessageSquare,
    },
    {
      title: "AI 生图",
      href: "/ai-image",
      activePath: "/ai-image",
      icon: ImageIcon,
    },
    {
      title: "文件上传",
      href: "/upload",
      activePath: "/upload",
      icon: Upload,
    },
  ];

  if (canAccessAdmin(user)) {
    items.push({
      title: "审核后台",
      href: "/finance/admin",
      activePath: "/finance/admin",
      icon: ShieldCheck,
    });
  }

  return items;
};

interface SidebarContentProps {
  user?: AppUser;
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
  const navItems = buildNavItems(user);

  return (
    <div
      className={cn("flex h-full w-full flex-col bg-white dark:bg-neutral-900 border-r border-border/40", className)}
    >
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

        {isMobile && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo size={26} />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className={cn("space-y-1", isCollapsed ? "px-0" : "px-3")}>
          {navItems.map((item) => {
            const isActive = pathname === item.activePath || pathname.startsWith(`${item.activePath}/`);
            const Icon = item.icon;

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md transition-all",
                  isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2 text-sm font-medium",
                  isActive ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-border/40">
        {user ? (
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group",
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

export function DesktopSidebar({ user }: { user?: AppUser }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "hidden md:block shrink-0 h-screen sticky top-0 z-30 transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64",
      )}
    >
      <TooltipProvider>
        <SidebarContent user={user} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((prev) => !prev)} />
      </TooltipProvider>
    </aside>
  );
}

export function MobileSidebar({ user }: { user?: AppUser }) {
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

export const AppSidebar = SidebarContent;
