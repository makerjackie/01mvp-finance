import Link from "next/link";
import { ArrowRight, Wallet, ClipboardList, ShieldCheck, BarChart3, Users, Eye } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/logo";

const features = [
  {
    title: "申请统一化",
    description: "收入登记与支出申请统一入口，减少线下沟通成本。",
    icon: ClipboardList,
  },
  {
    title: "审核可追踪",
    description: "审核状态、审核备注、审核时间完整记录，过程可回溯。",
    icon: ShieldCheck,
  },
  {
    title: "数据可统计",
    description: "自动汇总收入、支出、余额，支持管理人员快速查看。",
    icon: BarChart3,
  },
  {
    title: "成员协同",
    description: "社区成员可随时提交申请，管理员集中审核处理。",
    icon: Users,
  },
  {
    title: "财务公开",
    description: "社区账目透明公开，所有成员都可以查看社区财务状况。",
    icon: Eye,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10 selection:text-primary font-sans">
      <section className="relative flex flex-col items-center justify-center px-6 py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px]" />
        <div className="absolute top-0 left-0 right-0 -z-10 h-[420px] w-full bg-linear-to-b from-primary/8 to-transparent blur-3xl" />

        <div className="container max-w-5xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="rounded-full py-1 px-4 border-primary/20 bg-primary/5 text-primary">
            社区治理 · 财务透明
          </Badge>

          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70 leading-tight">
            {siteConfig.name}
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            {siteConfig.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/20">
              <Link href={siteConfig.links.signin}>
                登录并开始
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-8 text-base">
              <Link href="/community-finance">
                <Eye className="mr-2 h-4 w-4" />
                查看社区财务
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-8 text-base">
              <Link href={siteConfig.links.finance}>
                <Wallet className="mr-2 h-4 w-4" />
                进入财务系统
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 border-t border-border/40">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">核心能力</h2>
          <p className="text-muted-foreground text-lg">围绕社区财务工作流设计，避免模板化冗余功能。</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group border-border/50 transition-all duration-300 hover:border-primary/20 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-all duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border/40 bg-background mt-auto">
        <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row justify-between items-center gap-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <LogoMark size={24} className="shadow-sm" />
            <div>
              <p className="font-medium text-foreground">{siteConfig.name}</p>
              <p className="text-xs">© 2026. 保留所有权利。</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/community-finance" className="hover:text-foreground transition-colors">
              社区财务
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              条款
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              隐私
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
