import { headers } from "next/headers";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Upload, UserRound } from "lucide-react";
import { auth } from "@/server/lib/auth";
import { cn } from "@/lib/utils";

export default async function FeaturesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const features = [
    {
      icon: Upload,
      title: "文件上传示例",
      description: "POST /api/uploads，返回可直链的图片地址（本地或 S3）",
      href: "/upload",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      requiresAuth: true,
    },
    {
      icon: MessageSquare,
      title: "AI 对话",
      description: "OpenAI 兼容接口，流式响应示例",
      href: "/chat",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: LayoutDashboard,
      title: "受保护的控制台",
      description: "演示登录态路由与私有 API 调用",
      href: "/dashboard",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      requiresAuth: true,
    },
    {
      icon: UserRound,
      title: "个人中心",
      description: "头像上传、昵称修改、密码更新示例",
      href: "/me",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      requiresAuth: true,
    },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-6">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">功能中心</h1>
        <p className="text-sm text-muted-foreground">{session?.user ? "探索所有可用功能" : "登录后使用更多功能"}</p>
      </div>

      {/* 功能网格 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isLocked = feature.requiresAuth && !session?.user;
          const href = isLocked ? `/sign-in?redirect=${feature.href}` : feature.href;

          return (
            <Link
              key={feature.title}
              href={href}
              className={cn(
                "card-hover flex flex-col gap-3 p-5 text-left",
                isLocked && "ring-1 ring-dashed ring-border/60",
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.bgColor}`}>
                    <Icon className={`h-5 w-5 ${feature.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-medium">{feature.title}</h3>
                    {feature.requiresAuth && (
                      <span className="inline-flex w-fit items-center rounded-full border border-border/70 bg-muted/60 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {isLocked ? "需登录" : "已解锁"}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 快捷操作提示 */}
      {!session?.user && (
        <div className="card border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            还没有登录？
            <Link href="/sign-in" className="ml-1 text-primary hover:underline">
              立即登录
            </Link>
            或
            <Link href="/sign-up" className="ml-1 text-primary hover:underline">
              注册账号
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
