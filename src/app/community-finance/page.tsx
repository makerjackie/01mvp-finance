"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  BarChart3,
  CircleDollarSign,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CommunityStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const cnyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function CommunityFinancePage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await fetch("/api/finance/public/stats");
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.status}`);
      }
      const result = await res.json();
      if (result.success && result.data) {
        setStats(result.data);
        setLastUpdated(new Date());
        return;
      }

      throw new Error("Invalid stats response");
    } catch (error) {
      console.error(error);
      setError("数据加载失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  };

  const statsCards = stats
    ? [
        {
          title: "总收入",
          value: cnyFormatter.format(stats.totalIncome),
          description: "已审核通过的社区收入",
          icon: ArrowUpCircle,
          valueClassName: "text-emerald-600",
          iconClassName: "text-emerald-600",
        },
        {
          title: "总支出",
          value: cnyFormatter.format(stats.totalExpense),
          description: "已审核通过的社区支出",
          icon: ArrowDownCircle,
          valueClassName: "text-rose-600",
          iconClassName: "text-rose-600",
        },
        {
          title: "当前余额",
          value: cnyFormatter.format(stats.balance),
          description: "收入减去支出的净额",
          icon: CircleDollarSign,
          valueClassName: stats.balance >= 0 ? "text-primary" : "text-amber-600",
          iconClassName: stats.balance >= 0 ? "text-primary" : "text-amber-600",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-full max-w-xl" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="rounded-xl border border-border/60 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-16" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50/50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-linear-to-b from-primary/6 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 pb-10 md:px-8 md:py-8">
        <div className="space-y-6">
          <header className="space-y-3">
            <Badge variant="outline" className="rounded-full border-border/60 bg-white/80 px-3 py-1 text-xs">
              Community Finance
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">社区财务公开</h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                本页展示社区已审核通过的收入、支出与余额汇总，方便成员快速了解财务状态。
              </p>
            </div>
          </header>

          <Card className="rounded-xl border border-amber-200/90 bg-amber-50/70 shadow-sm">
            <CardContent className="flex items-start gap-3 p-4 md:p-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">Beta 测试说明</p>
                <p className="text-xs leading-relaxed text-amber-800 md:text-sm">
                  当前系统仍处于 Beta 测试版本，数据可能存在错误或延迟，仅供参考，请勿作为最终财务凭证。
                </p>
              </div>
            </CardContent>
          </Card>

          {error ? (
            <Card className="rounded-xl border border-destructive/20 bg-destructive/5 shadow-sm">
              <CardContent className="p-4 text-sm text-destructive md:p-5">{error}</CardContent>
            </Card>
          ) : (
            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {statsCards.map((card) => {
                const Icon = card.icon;

                return (
                  <Card
                    key={card.title}
                    className="rounded-xl border border-border/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <CardHeader className="space-y-3 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                        <Icon className={`h-4 w-4 ${card.iconClassName}`} />
                      </div>
                      <p className={`text-2xl font-semibold tracking-tight ${card.valueClassName}`}>{card.value}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}

          <Card className="rounded-2xl border border-border/60 bg-white shadow-sm">
            <CardHeader className="space-y-2 pb-3">
              <CardTitle className="text-lg font-semibold md:text-xl">公开机制说明</CardTitle>
              <CardDescription>账目仅统计已审核通过的数据，确保公开口径一致。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-0 md:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">审核后公开</p>
                <p className="mt-1 text-xs text-muted-foreground">仅展示审核通过记录，避免中间状态干扰。</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">实时汇总</p>
                <p className="mt-1 text-xs text-muted-foreground">收入、支出、余额自动统计，减少人工整理成本。</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <CircleDollarSign className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium">统一口径</p>
                <p className="mt-1 text-xs text-muted-foreground">所有金额均以人民币展示，保留两位小数。</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="h-11 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]">
              <Link href="/finance">
                进入财务系统
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-border/60 bg-white shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <Link href="/">返回首页</Link>
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 bg-white/90 px-4 py-3 text-xs text-muted-foreground shadow-sm md:text-sm">
            <p>数据更新时间：{lastUpdated ? dateTimeFormatter.format(lastUpdated) : "暂无"}</p>
            <p className="mt-1">说明：仅展示已审核通过的社区账目数据。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
