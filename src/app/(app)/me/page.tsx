import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, KeyRound, LogOut, type LucideIcon, UserRound } from "lucide-react";
import SignOutButton from "@/components/logout";
import { auth } from "@/server/lib/auth";
import { getAppNavItems, type AppNavItem } from "@/lib/config/app-nav-items";
import { AvatarUpload } from "./components/avatar-upload";
import { Card, CardContent } from "@/components/ui/card";

interface ActionItem {
  key: string;
  title: string;
  href: string;
  icon: LucideIcon;
}

export default async function MePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/me");
  }

  const user = session.user;
  const displayName = user.name || user.username || "用户";
  const email = user.email || "未绑定邮箱";
  const shortcuts = getAppNavItems(user).filter((item) => item.href !== "/me");
  const accountItems: ActionItem[] = [
    {
      key: "profile",
      title: "编辑个人资料",
      href: "/me/profile",
      icon: UserRound,
    },
    {
      key: "password",
      title: "修改密码",
      href: "/me/password",
      icon: KeyRound,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      <Card className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-muted/40 shadow-sm dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/80">
        <CardContent className="flex items-center gap-4 p-4 md:gap-5 md:p-6">
          <AvatarUpload user={user} size="md" className="h-16 w-16 shrink-0 md:h-20 md:w-20" />
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-lg font-semibold tracking-tight md:text-2xl">{displayName}</h1>
            <p className="truncate text-xs text-muted-foreground md:text-sm">{email}</p>
          </div>
        </CardContent>
      </Card>

      <ActionSection title="系统入口" items={shortcuts} />

      <ActionSection title="账号设置" items={accountItems} />

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="p-3">
          <SignOutButton
            variant="destructive"
            className="h-11 w-full rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="flex items-center justify-center gap-2">
              <LogOut className="h-4 w-4" />
              退出登录
            </span>
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionSection({ title, items }: { title: string; items: ActionItem[] | AppNavItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      </div>
      <Card className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
        <div className="divide-y divide-border/40">
          {items.map((item) => (
            <ActionRow key={item.key} title={item.title} href={item.href} icon={item.icon} />
          ))}
        </div>
      </Card>
    </section>
  );
}

function ActionRow({ title, href, icon: Icon }: Pick<ActionItem, "title" | "href" | "icon">) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="h-4 w-4" />
        </div>
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
