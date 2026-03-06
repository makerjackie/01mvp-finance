"use client";

import Link from "next/link";
import { Wallet, User, LogOut, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/lib/config/site";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserDisplayName } from "@/lib/utils";

export function TopNav() {
  const { data } = authClient.useSession();
  const user = data?.user;
  const displayName = getUserDisplayName(user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80">
          <Logo size={28} textClassName="hidden sm:inline-block font-bold tracking-tight" />
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/finance" className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" />
                  进入财务系统
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 pl-1 pr-2 rounded-full border border-border/40 hover:bg-accent hover:text-accent-foreground h-8"
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
                    <Link href="/finance" className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>财务系统</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-sm">
                    <Link href="/me" className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      <span>账号资料</span>
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
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href={siteConfig.links.finance} className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4" />
                  浏览系统
                </Link>
              </Button>
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
