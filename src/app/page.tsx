import Link from "next/link";
import { ArrowRight, MessageSquare, Phone, Cloud, Zap, Shield, Globe } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "即时部署",
    description: "基于 Next.js 的高性能架构，秒级构建与发布。",
    icon: Zap,
  },
  {
    title: "AI 驱动",
    description: "内置智能对话助手，提升工作效率。",
    icon: MessageSquare,
  },
  {
    title: "安全可靠",
    description: "企业级数据加密与隐私保护。",
    icon: Shield,
  },
  {
    title: "全球分发",
    description: "边缘计算节点覆盖全球，极速访问。",
    icon: Globe,
  },
  {
    title: "多端适配",
    description: "完美适配桌面与移动端设备。",
    icon: Phone,
  },
  {
    title: "云端同步",
    description: "实时数据同步，随时随地访问。",
    icon: Cloud,
  },
];

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-background selection:bg-primary/10 selection:text-primary">
      {/* Background Grid */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/5 opacity-20 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center md:py-32 lg:py-40">
        <div className="animate-fade-in space-y-4 max-w-4xl">
          <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-accent/50 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
            v1.0 全新发布
          </div>
          
          <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 pb-2">
            {siteConfig.name}
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed text-balance">
            {siteConfig.description}
            <br className="hidden sm:block" />
            {siteConfig.tagline}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-8 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-8 text-base shadow-lg shadow-primary/5 ring-offset-background transition-all hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5">
              <Link href={siteConfig.links.signin}>
                开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-all hover:-translate-y-0.5">
              <Link href={siteConfig.links.chat}>
                体验 AI 对话
              </Link>
            </Button>
          </div>
          
          <div className="pt-12 flex items-center justify-center gap-8 text-muted-foreground grayscale opacity-50">
             {/* Placeholders for logos/trust indicators if needed */}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-24 md:py-32 border-t border-border/40">
        <div className="mb-16 md:mb-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">核心功能</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            为现代开发者打造的完整工具链
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.title} 
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background p-6 transition-all hover:border-border hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="relative mx-auto max-w-3xl text-center space-y-8">
            <h2 className="text-3xl font-bold sm:text-4xl tracking-tight">准备好开始了吗？</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              加入数千名开发者的行列，使用 {siteConfig.name} 构建您的下一个伟大应用。
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild size="lg" className="rounded-full px-8 h-12">
                <Link href={siteConfig.links.signin}>
                  免费注册
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
             <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
               {siteConfig.name[0]}
             </div>
             <p className="font-medium text-foreground">{siteConfig.name}</p>
          </div>
          <div className="flex items-center gap-6">
             <Link href="#" className="hover:text-foreground transition-colors">关于我们</Link>
             <Link href="#" className="hover:text-foreground transition-colors">文档</Link>
             <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
          </div>
          <p>© 2024 {siteConfig.name}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
