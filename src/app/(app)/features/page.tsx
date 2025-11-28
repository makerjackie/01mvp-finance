import { headers } from "next/headers";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  MessageSquare,
  Upload,
  UserRound,
  ChevronRight,
  Smartphone,
  Monitor,
  Layers,
} from "lucide-react";
import { auth } from "@/server/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  badge?: string;
};

const coreFeatures: FeatureItem[] = [
  {
    icon: MessageSquare,
    title: "AI 对话",
    description: "兼容 OpenAI 的流式接口，演示即时回复、会话与多模型切换。",
    href: "/chat",
    badge: "核心",
  },
  {
    icon: Upload,
    title: "文件上传",
    description: "支持本地或 S3，对象存储自动切换，带上传进度和预览。",
    href: "/upload",
    badge: "演示",
  },
  {
    icon: LayoutDashboard,
    title: "控制台",
    description: "受保护的路由示例，展示用户数据、健康度和快捷入口。",
    href: "/dashboard",
    badge: "鉴权",
  },
  {
    icon: UserRound,
    title: "个人中心 / 移动布局",
    description: "粘性头部、卡片列表与 Tabbar 适配的移动端个人资料页。",
    href: "/me",
    badge: "移动",
  },
];

const uiShowcases: FeatureItem[] = [
  {
    icon: Smartphone,
    title: "沉浸式导航",
    description: "顶部沉浸式返回栏 + 底部 CTA，适合移动端深度任务流。",
    href: "/example-ui/immersive-nav",
    badge: "页面",
  },
  {
    icon: Layers,
    title: "复杂 Tabs",
    description: "粘性 Tabs、动画切换与内容分栏的交互范例，适合多视图展示。",
    href: "/example-ui/complex-tabs",
    badge: "交互",
  },
  {
    icon: Monitor,
    title: "营销落地页",
    description: "Hero、特性网格、CTA 与页脚的完整 Landing Page 模板。",
    href: "/",
    badge: "模板",
  },
];

export default async function FeaturesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="w-full space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.12),transparent_30%)]" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="rounded-full border-primary/40 bg-primary/10 text-primary px-3 py-1 h-auto"
              >
                功能中心
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">模板功能与 UI 演示</h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                核心业务能力、鉴权示例与设计系统 Demo 一站式汇总。顶部标签在核心功能与 UI 演示间切换，从 Tabbar
                进来的用户也能快速定位入口。
              </p>
            </div>
            {!session?.user && (
              <Button size="sm" asChild>
                <Link href="/sign-in">登录</Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="核心功能" value={`${coreFeatures.length} 个`} hint="AI / 上传 / 控制台" />
            <StatCard label="UI 演示" value={`${uiShowcases.length} 个`} hint="组件 + 布局" tone="emerald" />
            <StatCard label="移动端体验" value="Tabbar + 沉浸式" hint="适配小屏" tone="blue" />
          </div>
        </div>
      </section>

      <Tabs defaultValue="core" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-primary">Browse</p>
            <h2 className="text-xl font-bold tracking-tight">按标签快速查看</h2>
            <p className="text-sm text-muted-foreground">
              核心业务与 UI Demo 分栏展示，桌面和移动 Tabbar 都能秒懂信息架构。
            </p>
          </div>
          <TabsList className="grid w-full max-w-[320px] grid-cols-2 rounded-full bg-muted/70 p-1">
            <TabsTrigger value="core" className="rounded-full data-[state=active]:bg-background">
              核心功能
            </TabsTrigger>
            <TabsTrigger value="ui" className="rounded-full data-[state=active]:bg-background">
              UI 演示
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="core" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-primary">Core</p>
              <h2 className="text-xl font-bold tracking-tight">模板核心功能</h2>
              <p className="text-sm text-muted-foreground">即刻可用的业务能力，覆盖鉴权、文件与 AI 对话。</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/dashboard">
                前往控制台
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {coreFeatures.map((feature) => (
              <FeatureCard key={feature.title} item={feature} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ui" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">UI Showcase</p>
              <h2 className="text-xl font-bold tracking-tight">设计系统与 UI 演示</h2>
              <p className="text-sm text-muted-foreground">页面/组件的真实示例，Tab 内直达对应 Demo。</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/example-ui/immersive-nav">
                打开沉浸式导航
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {uiShowcases.map((feature) => (
              <FeatureCard key={feature.title} item={feature} variant="ui" />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureCard({ item, variant }: { item: FeatureItem; variant?: "ui" | "core" }) {
  const iconTone =
    variant === "ui" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-primary/10 text-primary";

  return (
    <Link href={item.href} className="group block h-full">
      <Card className="h-full overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconTone}`}
            >
              <item.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold leading-tight">{item.title}</h3>
                {item.badge ? (
                  <Badge variant="secondary" className="px-2 py-0 text-[11px] leading-relaxed">
                    {item.badge}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </div>
          </div>
          <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
            <span>进入</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "primary" | "emerald" | "blue";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : tone === "blue"
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : "bg-primary/10 text-primary";

  return (
    <div className="rounded-2xl border border-border/60 bg-white/70 p-4 shadow-sm backdrop-blur dark:bg-neutral-900/60">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${toneClass}`}>{hint}</span>
      </div>
    </div>
  );
}
