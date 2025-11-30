import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getUserDisplayName } from "@/lib/utils";
import {
  User,
  Calendar,
  Mail,
  Phone,
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Shield,
  Zap,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/dashboard");
  }

  const user = session.user;
  const displayName = getUserDisplayName(user);
  const daysSinceJoin = Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-8 pb-6">
      <section className="rounded-2xl border border-border/60 bg-linear-to-br from-white via-white to-gray-50 p-6 shadow-sm transition-all duration-200 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/80">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="rounded-full border-border/60 bg-primary/5 text-primary">
                控制台
              </Badge>
              <span>加入 {daysSinceJoin} 天</span>
              <span className="hidden md:inline-block">·</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                账户状态正常
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">欢迎回来，{displayName}</h1>
              <p className="text-sm text-muted-foreground">
                查看账户健康度、近期活动，并快速进入常用能力。布局遵循 Hybrid App Shell，侧边栏/底栏负责导航。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="rounded-full">
                <Link href="/chat">
                  <MessageSquare className="h-4 w-4" />
                  立即对话
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full border-border/60">
                <Link href="/features">
                  <Sparkles className="h-4 w-4" />
                  功能总览
                </Link>
              </Button>
            </div>
          </div>

          <Card className="w-full max-w-sm border-border/60 shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">账户快照</CardTitle>
              <CardDescription>关键指标和状态概览</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  安全
                </div>
                <p className="mt-1 text-2xl font-semibold">正常</p>
                <p className="text-[11px] text-muted-foreground">无风险</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Zap className="h-4 w-4 text-blue-500" />
                  本月请求
                </div>
                <p className="mt-1 text-2xl font-semibold">0</p>
                <p className="text-[11px] text-muted-foreground">使用量良好</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">账户状态</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">正常</div>
            <p className="mt-1 text-xs text-muted-foreground">未检测到安全风险</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">加入时间</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysSinceJoin} 天</div>
            <p className="mt-1 text-xs text-muted-foreground">
              注册于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI 使用量</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="mt-1 text-xs text-muted-foreground">本月请求次数</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">快捷操作</CardTitle>
            <CardDescription>常用入口已收纳在卡片，桌面端依旧依赖侧边栏</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ActionLink href="/chat" title="新建对话" description="开始与 AI 助手交流" icon={MessageSquare} />
            <ActionLink href="/features" title="功能中心" description="探索所有可用工具" icon={LayoutDashboard} />
            <ActionLink href="/upload" title="文件上传" description="快速同步素材" icon={Upload} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">个人资料</CardTitle>
            <CardDescription>保持联系方式最新，确保通知送达</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={User} label="用户名" value={user.username || "未设置"} />
            <Separator className="bg-border/60" />
            <InfoRow icon={Mail} label="邮箱" value={user.email} />
            <Separator className="bg-border/60" />
            <InfoRow icon={Phone} label="手机号" value={user.phoneNumber || "未设置"} />
            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full rounded-full border-border/60" asChild>
                <Link href="/me">编辑资料</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ActionLink({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} className="group block">
      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/60 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}
