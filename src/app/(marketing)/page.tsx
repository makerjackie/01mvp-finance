import Link from "next/link";
import { ArrowRight, MessageSquare, Phone, Cloud, Zap, Shield, Globe } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

const features = [
  {
    title: "即时部署",
    description: "基于 Next.js 的高性能架构。几秒钟内即可构建并发布您的应用。",
    icon: Zap,
  },
  {
    title: "AI 原生",
    description: "内置智能对话助手，深度集成 AI 能力，提升工作效率。",
    icon: MessageSquare,
  },
  {
    title: "企业级安全",
    description: "银行级数据加密与隐私保护标准，确保您的数据安全。",
    icon: Shield,
  },
  {
    title: "全球边缘网络",
    description: "覆盖全球的边缘计算节点，为用户提供闪电般的访问速度。",
    icon: Globe,
  },
  {
    title: "移动端优先",
    description: "完美适配桌面与移动端设备，提供原生的触控交互体验。",
    icon: Phone,
  },
  {
    title: "云端同步",
    description: "实时数据同步，让您随时随地访问您的数据。",
    icon: Cloud,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10 selection:text-primary font-sans">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-6 py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute top-0 left-0 right-0 -z-10 h-[500px] w-full bg-gradient-to-b from-primary/5 to-transparent blur-3xl" />

        <div className="container max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
          <Badge
            variant="outline"
            className="rounded-full py-1 px-4 border-primary/20 bg-primary/5 text-primary animate-in fade-in zoom-in duration-700"
          >
            <SparkleIcon className="mr-2 h-3 w-3 fill-current" />
            v1.0 正式发布
          </Badge>

          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 max-w-3xl mx-auto leading-tight">
            更快速地构建 <br className="hidden sm:block" />
            <span className="text-foreground">{siteConfig.name}</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            {siteConfig.description}
            <br className="hidden sm:block" />
            为您下一个伟大创意打造的终极启动模板。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <Link href={siteConfig.links.signin}>
                开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-accent/50 transition-all duration-300 hover:-translate-y-1"
            >
              <Link href={siteConfig.links.chat}>
                <MessageSquare className="mr-2 h-4 w-4" />
                AI 演示
              </Link>
            </Button>
          </div>

          {/* Code Preview / Visual */}
          <div className="mt-16 relative rounded-xl border border-border/50 bg-card/50 backdrop-blur shadow-2xl overflow-hidden max-w-3xl mx-auto transform rotate-x-12 transition-all hover:scale-[1.01] duration-500 group">
            <div className="flex items-center border-b border-border/50 bg-muted/50 px-4 py-3">
              <div className="flex space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="mx-auto text-xs font-mono text-muted-foreground">terminal</div>
            </div>
            <div className="p-6 text-left font-mono text-sm overflow-x-auto">
              <div className="text-muted-foreground">
                <span className="text-green-500">➜</span> <span className="text-blue-500">~</span> git clone
                https://github.com/01mvp/next-template
              </div>
              <div className="text-muted-foreground mt-2">
                <span className="text-green-500">➜</span> <span className="text-blue-500">~</span> cd next-template
              </div>
              <div className="text-muted-foreground mt-2">
                <span className="text-green-500">➜</span> <span className="text-blue-500">~</span> bun install && bun
                dev
              </div>
              <div className="text-emerald-500 mt-4">Ready in 135ms</div>
              <div className="mt-2 animate-pulse inline-block h-4 w-2 bg-primary/50" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24 border-t border-border/40">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">你需要的一切</h2>
          <p className="text-muted-foreground text-lg">为现代开发者打造的完整工具链，专为扩展而设计。</p>
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
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
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

      {/* Testimonials / Trust */}
      <section className="py-24 bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-6 text-center">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">深受开发者信赖</h3>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
            {/* Logos would go here - using text for now */}
            <span className="text-xl font-bold">Acme Corp</span>
            <span className="text-xl font-bold">Globex</span>
            <span className="text-xl font-bold">Soylent</span>
            <span className="text-xl font-bold">Initech</span>
            <span className="text-xl font-bold">Umbrella</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24 md:py-32">
        <div className="relative mx-auto max-w-4xl rounded-3xl bg-gradient-to-b from-muted/50 to-muted/10 border border-border/50 p-8 md:p-16 text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl tracking-tight">
              准备好发布您的下一个产品了吗？
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              加入数千名开发者的行列，使用 {siteConfig.name} 构建未来。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
                <Link href={siteConfig.links.signin}>免费开始</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="h-12 rounded-full px-8 text-base">
                <Link href="https://github.com/01mvp/next-template" target="_blank">
                  查看 GitHub
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <LogoMark size={26} className="shadow-sm" />
            <div>
              <p className="font-medium text-foreground">{siteConfig.name}</p>
              <p className="text-xs">© 2024. 保留所有权利。</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <Link href="#" className="hover:text-foreground transition-colors">
              条款
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              隐私
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              推特
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SparkleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .962L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
    </svg>
  );
}
