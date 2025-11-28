import { headers } from "next/headers";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  Upload,
  UserRound,
  Smartphone,
  Monitor,
  CreditCard,
  ChevronRight,
  Palette,
  Component,
  Copy,
} from "lucide-react";
import { auth } from "@/server/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const uiExamples = [
    {
      title: "移动端布局",
      description: "粘性头部、卡片列表、底部悬浮导航栏。",
      imageColor: "bg-blue-500/10",
      icon: Smartphone,
      href: "/me",
    },
    {
      title: "落地页",
      description: "响应式 Hero 区域、特性网格、页脚。",
      imageColor: "bg-purple-500/10",
      icon: Monitor,
      href: "/",
    },
    {
      title: "功能卡片",
      description: "极简风格的卡片组件，用于列表展示。",
      imageColor: "bg-orange-500/10",
      icon: CreditCard,
      href: "/dashboard",
    },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">功能与组件</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">探索基于 Design System 构建的页面</p>
          </div>
          {!session?.user && (
            <Button size="sm" asChild>
              <Link href="/sign-in">登录</Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="modules" className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="modules">功能模块</TabsTrigger>
              <TabsTrigger value="ui">UI 示例</TabsTrigger>
            </TabsList>
          </div>

          {/* 功能模块 Tab */}
          <TabsContent value="modules" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
          </TabsContent>

          {/* UI 示例 Tab */}
          <TabsContent value="ui" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {uiExamples.map((item) => (
                <Link key={item.title} href={item.href} className="group">
                  <Card className="overflow-hidden h-full border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-300">
                    <div className={`h-32 ${item.imageColor} flex items-center justify-center`}>
                      <item.icon className="h-12 w-12 text-foreground/20 group-hover:text-foreground/40 transition-colors" />
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* 设计资源卡片 */}
            <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      设计规范文档
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      查看完整的设计指南和 AI 提示词，快速构建一致的页面。
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/docs/DESIGN_GUIDE_CN.md" target="_blank">
                      <Copy className="mr-2 h-3 w-3" />
                      查看文档
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
