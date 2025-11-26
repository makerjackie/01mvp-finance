import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/lib/config/site";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(180,180,255,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(120,220,255,0.12),transparent_30%)] blur-3xl" />
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex-1 space-y-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card">
              {siteConfig.name[0]}
            </span>
            <span className="font-medium">{siteConfig.name}</span>
          </Link>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{siteConfig.name}</p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">欢迎使用 {siteConfig.name}</h1>
          </div>
        </div>

        <div className="flex-1">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_25px_80px_-45px_rgba(0,0,0,1)] backdrop-blur">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
