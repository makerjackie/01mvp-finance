"use client";

import Link from "next/link";
import { MessageSquare, User } from "lucide-react";
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

export function TopNav() {
  const { data } = authClient.useSession();
  const user = data?.user;

  // 获取显示的用户名
  const getUserDisplayName = () => {
    if (!user) return null;

    // 优先显示昵称
    if (user.name) return user.name;

    // 如果有手机号，显示手机号后4位
    if (user.phoneNumber) {
      return `用户${user.phoneNumber.slice(-4)}`;
    }

    // 如果有用户名，显示用户名
    if (user.username) return user.username;

    // 如果有邮箱且不是自动生成的邮箱
    if (user.email && !user.email.endsWith("@phone.local") && !user.email.endsWith("@local.test")) {
      return user.email;
    }

    return "用户";
  };

  const displayName = getUserDisplayName();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            M
          </div>
          <span className="text-foreground">{siteConfig.name}</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/chat" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              AI 对话
            </Link>
          </Button>

          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">控制台</Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="hidden sm:inline">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
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
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">控制台</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/me">个人中心</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={async () => {
                      await authClient.signOut();
                      window.location.href = "/";
                    }}
                  >
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/sign-in">登录</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
