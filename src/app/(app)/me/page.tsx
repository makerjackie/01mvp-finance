import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { type LucideIcon, LogOut, CreditCard, Settings, Shield, ChevronRight } from "lucide-react";
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
    <div className="space-y-8 pb-10">
      <Card className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-gray-50/50 shadow-sm transition-all duration-200 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/80">
        <CardContent className="p-4 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 md:gap-6">
              <AvatarUpload user={user} size="lg" className="h-16 w-16 shrink-0 shadow-sm md:h-24 md:w-24" />
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight md:text-3xl">{displayName}</h2>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className="h-5 rounded-full border-border/60 bg-primary/5 px-2 text-[10px] font-medium text-primary md:h-6 md:text-xs"
                    >
                      专业版
                    </Badge>
                    <Badge
                      variant="outline"
                      className="h-5 rounded-full border-border/60 px-2 text-[10px] text-muted-foreground md:h-6 md:text-xs"
                    >
                      开发者
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground md:text-sm">{email}</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground md:text-xs">
                  <span className="flex items-center gap-1 rounded-full border border-border/40 bg-background/50 px-2 py-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    已验证
                  </span>
                  <span className="rounded-full border border-border/40 bg-background/50 px-2 py-0.5 font-mono">
                    ID: {user.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-border/40 rounded-xl border border-border/40 bg-background/40 p-2 md:w-auto md:min-w-[320px] md:gap-3 md:divide-x-0 md:border-0 md:bg-transparent md:p-0">
              <StatsItem label="关注" value="128" />
              <StatsItem label="粉丝" value="3.2k" />
              <StatsItem label="获赞" value="8.5k" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground uppercase tracking-wider">账户信息</h3>
            <Card className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <CardContent className="space-y-6 p-4 md:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="昵称" value={displayName} />
                  <InfoRow label="用户名" value={user.username || "未设置"} />
                  <InfoRow label="邮箱" value={email || "未填写"} />
                  <InfoRow label="手机号" value={fullUser?.phoneNumber || "未绑定"} />
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">账户管理</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <SettingsMenu username={user.username} email={user.email} phoneNumber={fullUser?.phoneNumber} />
              </CardContent>
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

function StatsItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-1 md:rounded-xl md:border md:border-border/60 md:bg-background/60 md:p-3 md:shadow-sm md:transition-all md:duration-200 md:hover:-translate-y-0.5 md:hover:shadow-md">
      <div className="text-base font-bold tracking-tight md:text-lg">{value}</div>
      <div className="text-[10px] text-muted-foreground md:text-xs">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function MenuItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
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
