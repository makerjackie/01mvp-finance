"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import type { User } from "better-auth";
import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { getAppNavItems, type AppNavItem } from "@/lib/config/app-nav-items";

type AppUser = User & { role?: string | null };

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
  const navItems = getAppNavItems(user);

  // Helper function to check if any child is active
  const isItemOrChildActive = React.useCallback(
    (item: AppNavItem): boolean => {
      const checkActive = (navItem: AppNavItem): boolean => {
        const isActive = pathname === navItem.activePath || pathname.startsWith(`${navItem.activePath}/`);
        if (isActive) return true;
        if (navItem.children) {
          return navItem.children.some(checkActive);
        }
        return false;
      };
      return checkActive(item);
    },
    [pathname],
  );

  // Initialize open state for items with active children
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(() => {
    const initialOpenState: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && isItemOrChildActive(item)) {
        initialOpenState[item.key] = true;
      }
    });
    return initialOpenState;
  });

  // Find active href for highlighting
  const findActiveHref = (items: AppNavItem[]): string | null => {
    const allItems: AppNavItem[] = [];
    const flatten = (itemList: AppNavItem[]) => {
      itemList.forEach((item) => {
        allItems.push(item);
        if (item.children) flatten(item.children);
      });
    };
    flatten(items);

    return (
      allItems
        .filter((item) => pathname === item.activePath || pathname.startsWith(`${item.activePath}/`))
        .sort((a, b) => b.activePath.length - a.activePath.length)[0]?.href || null
    );
  };

  const activeHref = findActiveHref(navItems);

  const renderNavItem = (item: AppNavItem) => {
    const isActive = item.href === activeHref;
    const hasActiveChild = item.children && item.children.some((child) => child.href === activeHref);
    const Icon = item.icon;

    // If item has children, render as collapsible
    if (item.children && item.children.length > 0) {
      const isOpen = openItems[item.key] ?? false;

      if (isCollapsed) {
        // In collapsed mode, show parent with tooltip
        return (
          <Tooltip key={item.key} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center justify-center rounded-md p-2 transition-all",
                  hasActiveChild
                    ? "bg-primary/5 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    hasActiveChild ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.title}</TooltipContent>
          </Tooltip>
        );
      }

      return (
        <Collapsible
          key={item.key}
          open={isOpen}
          onOpenChange={(open) => setOpenItems((prev) => ({ ...prev, [item.key]: open }))}
        >
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                hasActiveChild
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  hasActiveChild ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="flex-1 truncate text-left">{item.title}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-6 pt-1">
            {item.children.map((child) => {
              const isChildActive = child.href === activeHref;
              const ChildIcon = child.icon;

              return (
                <Link
                  key={child.key}
                  href={child.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                    isChildActive
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <ChildIcon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isChildActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="truncate">{child.title}</span>
                </Link>
              );
            })}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    // Regular item without children
    const linkContent = (
      <Link
        key={item.key}
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
        <Tooltip key={item.key} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

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
        {!isCollapsed && !isMobile && (
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
          <Link href="/" className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity">
            <Logo size={26} />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className={cn("space-y-1", isCollapsed ? "px-0" : "px-3")}>{navItems.map(renderNavItem)}</nav>
      </div>

      <div className="p-3 border-t border-border/40">
        {user ? (
          <>
            <div
              className={cn(
                "mb-2 flex items-center rounded-lg p-1.5",
                isCollapsed ? "justify-center" : "justify-between gap-2 px-2.5",
              )}
            >
              {!isCollapsed && <span className="text-xs font-medium text-muted-foreground">通知</span>}
              <NotificationBell />
            </div>

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
          </>
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
