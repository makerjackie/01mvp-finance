"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, User, LogOut, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/lib/config/site";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserDisplayName } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function TopNav() {
  const { data } = authClient.useSession();
  const user = data?.user;
  const pathname = usePathname();

  // 获取显示的用户名
  const displayName = getUserDisplayName(user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-14">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              {siteConfig.name[0]}
            </div>
            <span className="hidden font-bold sm:inline-block tracking-tight">{siteConfig.name}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/features"
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === "/features"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              功能中心
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === "/dashboard"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  控制台
                </Link>
                <Link
                  href="/chat"
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === "/chat"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  AI 对话
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!user && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
            >
              <Link href={siteConfig.links.chat} className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                AI 演示
              </Link>
            </Button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 pl-1 pr-2 rounded-full border border-border/40 hover:bg-accent hover:text-accent-foreground ml-2 h-8"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">
                    <User className="h-3 w-3" />
                  </div>
                  <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1 animate-in slide-in-from-top-2">
                <DropdownMenuLabel className="p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    {user.phoneNumber && (
                      <p className="text-xs leading-none text-muted-foreground">{user.phoneNumber}</p>
                    )}
                    {user.email && !user.email.endsWith("@phone.local") && !user.email.endsWith("@local.test") && (
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer rounded-sm">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>控制台</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-sm">
                  <Link href="/me" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>个人中心</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer flex items-center gap-2 rounded-sm"
                  onClick={async () => {
                    await authClient.signOut();
                    window.location.href = "/";
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button size="sm" asChild className="rounded-full px-5 shadow-sm">
                <Link href="/sign-in">登录</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
