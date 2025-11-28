import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, CreditCard, Settings, Shield, ChevronRight } from "lucide-react";
import SignOutButton from "@/components/logout";
import { auth } from "@/server/lib/auth";
import { prisma } from "@/server/lib/db";
import { AvatarUpload } from "./components/avatar-upload";
import { SettingsMenu } from "./components/settings-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function MePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/me");
  }

  const user = session.user;

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      phoneNumber: true,
    },
  });

  const displayName = user.name || user.username || "用户";
  const email = user.email;

  return (
    <div className="space-y-8 pb-6">
      <Card className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-gray-50 shadow-sm transition-all duration-200 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/80">
        <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
            <AvatarUpload user={user} size="lg" className="shadow-md" />
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{displayName}</h2>
                  <Badge variant="secondary" className="rounded-full border-border/60 bg-primary/5 text-primary">
                    专业版
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-border/60 text-muted-foreground">
                    开发者
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">已验证邮箱</span>
                <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1">
                  ID {user.id.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid w-full grid-cols-3 gap-3 md:w-[320px]">
            <StatsCard label="关注" value="128" />
            <StatsCard label="粉丝" value="3.2k" />
            <StatsCard label="获赞" value="8.5k" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground uppercase tracking-wider">账户信息</h3>
            <Card className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <SettingsMenu
                name={user.name}
                username={user.username}
                email={user.email}
                phoneNumber={fullUser?.phoneNumber}
              />
            </Card>
          </section>

          <section className="space-y-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground uppercase tracking-wider">通用设置</h3>
            <Card className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <div className="divide-y divide-border/40">
                <MenuItem icon={CreditCard} label="订阅管理" value="专业版" />
                <MenuItem icon={Shield} label="隐私安全" />
                <MenuItem icon={Settings} label="应用设置" />
              </div>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">账户操作</CardTitle>
              <CardDescription>安全退出并刷新会话</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <SignOutButton
                variant="destructive"
                className="w-full h-11 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4" />
                  退出登录
                </div>
              </SignOutButton>
              <Button variant="outline" className="w-full rounded-xl border-border/60 text-sm" asChild>
                <Link href="/dashboard">返回控制台</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-muted/40 shadow-sm">
            <CardContent className="space-y-2 p-4 text-center">
              <p className="text-xs text-muted-foreground">当前版本: v1.0.0</p>
              <p className="text-[11px] font-mono text-muted-foreground/70">Build {user.id.slice(0, 8)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-xl border border-border/60 bg-background/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
      <CardContent className="p-3 text-center">
        <div className="text-lg font-semibold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function MenuItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <button className="group flex w-full items-center justify-between p-4 text-left transition-all duration-200 hover:bg-muted/50 active:translate-y-[1px]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-muted-foreground">{value}</span>}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </button>
  );
}
