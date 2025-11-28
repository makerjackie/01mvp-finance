import { headers } from "next/headers";
import Link from "next/link";
import { LayoutDashboard, MessageSquare, Upload, UserRound, ChevronRight } from "lucide-react";
import { auth } from "@/server/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function FeaturesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const features = [
    {
      icon: Upload,
      title: "文件上传",
      description: "支持本地存储或 S3 对象存储，带即时预览功能。",
      href: "/upload",
      badge: "演示",
    },
    {
      icon: MessageSquare,
      title: "AI 对话",
      description: "兼容 OpenAI 的流式对话接口，支持多种模型。",
      href: "/chat",
      badge: "核心",
    },
    {
      icon: LayoutDashboard,
      title: "控制台",
      description: "受保护的路由示例，展示用户数据和统计信息。",
      href: "/dashboard",
      badge: "鉴权",
    },
    {
      icon: UserRound,
      title: "个人中心",
      description: "现代化的个人资料管理，支持头像上传和设置。",
      href: "/me",
      badge: "新UI",
    },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">功能中心</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">探索核心功能模块</p>
          </div>
          {!session?.user && (
            <Button size="sm" asChild>
              <Link href="/sign-in">登录</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} className="group block">
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20 active:scale-[0.99]">
                <div className="flex items-center p-5 gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{feature.title}</h3>
                      {feature.badge && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{feature.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary/50 transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
