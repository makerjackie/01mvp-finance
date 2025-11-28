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
} from "lucide-react";

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
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 pb-24">
      {/* Mobile/Tablet Header */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-5xl flex justify-between items-center">
          <h1 className="text-lg font-semibold tracking-tight">控制台</h1>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" asChild className="h-8 w-8 rounded-full p-0">
              <Link href="/me">
                <User className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-1 px-1">
          <h2 className="text-2xl font-bold tracking-tight">欢迎回来，{displayName}</h2>
          <p className="text-muted-foreground text-sm">这是您账户活动的概览。</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">账户状态</CardTitle>
              <Shield className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">正常</div>
              <p className="text-xs text-muted-foreground mt-1">未检测到安全风险</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">加入时间</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{daysSinceJoin} 天</div>
              <p className="text-xs text-muted-foreground mt-1">
                注册于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI 使用量</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">本月请求次数</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground px-1">快捷操作</h3>
            <div className="grid gap-3">
              <Link href="/chat" className="block group">
                <Card className="transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.99]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">新建对话</h4>
                      <p className="text-xs text-muted-foreground">开始与 AI 助手交流</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>

              <Link href="/features" className="block group">
                <Card className="transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.99]">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                      <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">功能中心</h4>
                      <p className="text-xs text-muted-foreground">探索所有可用工具</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground px-1">个人资料</h3>
            <Card className="overflow-hidden border-border/60">
              <div className="divide-y divide-border/50">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">用户名</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                    {user.username || "未设置"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">邮箱</span>
                  </div>
                  <span className="text-sm text-muted-foreground truncate max-w-[180px]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">手机号</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{user.phoneNumber || "未设置"}</span>
                </div>
              </div>
              <div className="p-3 bg-muted/30 border-t border-border/50">
                <Button variant="ghost" size="sm" className="w-full h-8 text-xs" asChild>
                  <Link href="/me">编辑资料</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
