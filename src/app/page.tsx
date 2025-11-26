import Link from "next/link";
import { ArrowRight, MessageSquare, Phone, Cloud } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

const iconMap = {
  0: Phone,
  1: MessageSquare,
  2: Cloud,
};

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="animate-fade-in space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">{siteConfig.name}</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">{siteConfig.description}</p>
          <p className="text-muted-foreground">{siteConfig.tagline}</p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link href={siteConfig.links.signin} className="btn-primary inline-flex items-center gap-2">
              开始使用
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={siteConfig.links.chat} className="btn-secondary inline-flex items-center gap-2">
              体验 AI 对话
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold">核心功能</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {siteConfig.features.map((feature, i) => {
              const Icon = iconMap[i as keyof typeof iconMap];
              return (
                <div key={feature.title} className="card group space-y-3 p-6 transition-shadow hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold">准备好开始了吗？</h2>
          <p className="mt-4 text-muted-foreground">只需几分钟，即可部署你的应用</p>
          <Link href={siteConfig.links.signin} className="btn-primary mt-8 inline-flex items-center gap-2">
            立即开始
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-muted-foreground">
          <p>基于 Next.js + Hono + Better Auth + Prisma 构建</p>
        </div>
      </footer>
    </div>
  );
}
