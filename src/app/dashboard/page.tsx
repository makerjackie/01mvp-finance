import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/lib/auth";
import { Button } from "@/components/ui/button";
import { getUserDisplayName } from "@/lib/utils";
import { User, Calendar, Mail, Phone, ArrowRight, LayoutDashboard, MessageSquare, Sparkles, Shield } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/dashboard");
  }

  const user = session.user;
  const displayName = getUserDisplayName(user);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-fade-in">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">概览</h1>
          <p className="text-muted-foreground">
            欢迎回来，<span className="font-medium text-foreground">{displayName}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
           <Button size="sm" variant="outline" asChild className="rounded-full">
             <Link href="/me">
               <User className="mr-2 h-4 w-4" />
               个人设置
             </Link>
           </Button>
           <Button size="sm" asChild className="rounded-full shadow-sm">
             <Link href="/chat">
               <Sparkles className="mr-2 h-4 w-4" />
               新建对话
             </Link>
           </Button>
        </div>
      </div>

      {/* Stats / Quick Info */}
      <div className="grid gap-4 md:grid-cols-3 animate-slide-up">
         <div className="card p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-medium text-muted-foreground">账户状态</h3>
               <Shield className="h-4 w-4 text-green-500" />
            </div>
            <div>
               <div className="text-2xl font-bold">正常</div>
               <p className="text-xs text-muted-foreground mt-1">当前无安全风险</p>
            </div>
         </div>
         
         <div className="card p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-medium text-muted-foreground">加入时间</h3>
               <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
               <div className="text-2xl font-bold">{Math.ceil((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} 天</div>
               <p className="text-xs text-muted-foreground mt-1">成为会员时长</p>
            </div>
         </div>

         <div className="card p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-all">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-medium text-muted-foreground">AI 使用量</h3>
               <MessageSquare className="h-4 w-4 text-blue-500" />
            </div>
            <div>
               <div className="text-2xl font-bold">0</div>
               <p className="text-xs text-muted-foreground mt-1">本月对话次数</p>
            </div>
         </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 animate-slide-up" style={{ animationDelay: "100ms" }}>
        {/* Profile Card */}
        <div className="card p-0 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border/50">
             <h2 className="font-semibold flex items-center gap-2">
               <User className="h-4 w-4" />
               个人信息
             </h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
              <span className="text-muted-foreground">用户 ID</span>
              <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">{user.id}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
              <span className="text-muted-foreground">用户名</span>
              <span>{user.username || "-"}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
              <span className="text-muted-foreground">邮箱</span>
              <span>{user.email || "-"}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-4 text-sm">
              <span className="text-muted-foreground">手机</span>
              <span>{user.phoneNumber || "-"}</span>
            </div>
          </div>
          <div className="bg-muted/30 p-4 border-t border-border/50">
            <Button variant="ghost" size="sm" asChild className="w-full justify-between">
              <Link href="/me">
                编辑详细资料
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features / Navigation */}
        <div className="card p-0 overflow-hidden flex flex-col">
           <div className="p-6 border-b border-border/50">
             <h2 className="font-semibold flex items-center gap-2">
               <LayoutDashboard className="h-4 w-4" />
               功能捷径
             </h2>
          </div>
          <div className="p-2 flex-1">
            <div className="grid gap-1">
              <Link href="/chat" className="group flex items-center gap-4 rounded-lg p-3 hover:bg-accent/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">AI 对话助手</h3>
                  <p className="text-xs text-muted-foreground">智能问答与创作</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <Link href="/features" className="group flex items-center gap-4 rounded-lg p-3 hover:bg-accent/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm">功能中心</h3>
                  <p className="text-xs text-muted-foreground">探索更多工具</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
