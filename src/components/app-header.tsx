"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { MobileSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoMark } from "@/components/logo";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { isImmersivePage } from "@/lib/config/navigation";

import type { User } from "better-auth";

interface AppHeaderProps {
  user?: User;
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname();
  const immersive = isImmersivePage(pathname);

  // 简单的面包屑逻辑
  const segments = pathname?.split("/").filter(Boolean) || [];
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const isLast = index === segments.length - 1;
    // 简单的标题映射 (实际项目可以用更复杂的字典)
    const titleMap: Record<string, string> = {
      finance: "财务系统",
      submit: "新建申请",
      "my-records": "我的记录",
      edit: "编辑记录",
      admin: "审核后台",
      chat: "AI 对话",
      "ai-image": "AI 生图",
      upload: "文件上传",
    };
    const title = titleMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    return { title, href, isLast };
  });

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 w-full items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 lg:px-6",
        immersive ? "hidden md:flex" : "",
      )}
    >
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-2 lg:gap-4">
        <MobileSidebar user={user} />

        {/* Mobile Logo (Only show when sidebar hidden) */}
        <Link href="/" className="flex items-center gap-2 font-semibold md:hidden">
          <LogoMark size={22} className="shadow-sm" priority />
        </Link>

        {/* Desktop Breadcrumbs */}
        <nav className="hidden md:flex items-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((crumb) => (
            <div key={crumb.href} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              {crumb.isLast ? (
                <span className="font-medium text-foreground">{crumb.title}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.title}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="ml-auto flex items-center gap-2">
        {user && <NotificationBell />}

        {/* Mobile Avatar (Sidebar has it, but TopNav also good for context) */}
        <div className="md:hidden">
          <Avatar className="h-8 w-8 border border-border/50">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className="text-xs">{user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
