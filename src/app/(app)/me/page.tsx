import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut, CreditCard, Settings, User, Shield, ChevronRight } from "lucide-react";
import SignOutButton from "@/components/logout";
import { auth } from "@/server/lib/auth";
import { prisma } from "@/server/lib/db";
import { AvatarUpload } from "./components/avatar-upload";
import { SettingsMenu } from "./components/settings-menu";
import { Card, CardContent } from "@/components/ui/card";
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
    // 移除额外的 header，使用 AppLayout 提供的
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* 用户概览卡片 - Desktop 上更宽，Mobile 上居中 */}
      <div className="flex flex-col md:flex-row items-center md:items-start md:gap-8 space-y-4 md:space-y-0 py-4">
        <AvatarUpload user={user} className="h-24 w-24 md:h-32 md:w-32 shadow-xl ring-4 ring-background" />

        <div className="flex flex-col items-center md:items-start space-y-2 flex-1">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h2>
            <p className="text-sm text-muted-foreground font-medium">{email}</p>
          </div>

          <div className="flex gap-2">
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-0.5 font-normal bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-100 dark:border-blue-800"
            >
              专业版会员
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-0.5 font-normal text-muted-foreground">
              开发者
            </Badge>
          </div>

          {/* Stats for Desktop - Moved here for better layout */}
          <div className="hidden md:flex gap-6 pt-4">
            <div className="text-center md:text-left">
              <div className="text-lg font-bold tracking-tight">128</div>
              <div className="text-xs text-muted-foreground">关注</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-lg font-bold tracking-tight">3.2k</div>
              <div className="text-xs text-muted-foreground">粉丝</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-lg font-bold tracking-tight">8.5k</div>
              <div className="text-xs text-muted-foreground">获赞</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats for Mobile */}
      <div className="grid grid-cols-3 gap-3 md:hidden">
        <StatsCard label="关注" value="128" />
        <StatsCard label="粉丝" value="3.2k" />
        <StatsCard label="获赞" value="8.5k" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧/上方：主要设置 */}
        <div className="md:col-span-2 space-y-6">
          {/* 账户设置 */}
          <section className="space-y-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground uppercase tracking-wider">账户信息</h3>
            <Card className="overflow-hidden border-border/60 shadow-sm rounded-2xl">
              <div className="divide-y divide-border/40">
                <SettingsMenu
                  name={user.name}
                  username={user.username}
                  email={user.email}
                  phoneNumber={fullUser?.phoneNumber}
                />
              </div>
            </Card>
          </section>

          {/* 通用设置 */}
          <section className="space-y-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground uppercase tracking-wider">通用设置</h3>
            <Card className="overflow-hidden border-border/60 shadow-sm rounded-2xl">
              <div className="divide-y divide-border/40">
                <MenuItem icon={CreditCard} label="订阅管理" value="专业版" />
                <MenuItem icon={Shield} label="隐私安全" />
                <MenuItem icon={Settings} label="应用设置" />
              </div>
            </Card>
          </section>
        </div>

        {/* 右侧/下方：其他操作 */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="px-1 text-sm font-medium text-muted-foreground uppercase tracking-wider">操作</h3>
            <Button
              variant="ghost"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-12 rounded-xl font-medium border border-border/40"
              asChild
            >
              <SignOutButton className="w-full flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" />
                退出登录
              </SignOutButton>
            </Button>
          </section>

          <Card className="bg-muted/30 border-none shadow-none">
            <CardContent className="p-4 text-center space-y-2">
              <p className="text-xs text-muted-foreground">当前版本: v1.0.0</p>
              <p className="text-[10px] text-muted-foreground/60 font-mono">Build {user.id.slice(0, 8)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/40 bg-background/50 shadow-sm hover:bg-background transition-colors">
      <CardContent className="p-3 text-center">
        <div className="text-lg font-bold tracking-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function MenuItem({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left group">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
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
