"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BarChart3, FolderKanban, Layers, RefreshCcw, Wallet } from "lucide-react";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Scope = "all" | "company" | "community";

type CategoryStat = {
  category: string;
  label: string;
  projectCount: number;
  recordCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

type ProjectStat = {
  projectId: string | null;
  name: string;
  category: string;
  categoryLabel: string;
  recordCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

type ProjectStatsData = {
  scope: Scope;
  summary: {
    totalProjects: number;
    involvedProjects: number;
    trackedRecords: number;
    unmatchedProjectCount: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  categories: CategoryStat[];
  projects: ProjectStat[];
};

type StatsResponse = {
  success?: boolean;
  error?: string;
  data?: ProjectStatsData;
};

const formatCurrency = (value: number) =>
  `¥${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

const scopeLabelMap: Record<Scope, string> = {
  all: "全部账目",
  company: "公司账目",
  community: "社区账目",
};

export default function ProjectStatsPage() {
  const [scope, setScope] = useState<Scope>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProjectStatsData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (scope !== "all") {
          params.set("scope", scope);
        }

        const res = await fetch(`/api/finance/admin/project-stats${params.toString() ? `?${params.toString()}` : ""}`, {
          signal: controller.signal,
        });
        const result = (await res.json()) as StatsResponse;

        if (!res.ok || !result.success || !result.data) {
          setError(result.error || "加载项目统计失败");
          setData(null);
          return;
        }

        setData(result.data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError("加载项目统计失败");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();

    return () => {
      controller.abort();
    };
  }, [scope]);

  const nonEmptyCategories = useMemo(() => {
    if (!data) return [];
    return data.categories.filter(
      (item) => item.projectCount > 0 || item.recordCount > 0 || item.totalIncome > 0 || item.totalExpense > 0,
    );
  }, [data]);

  return (
    <div className="space-y-3 md:space-y-5">
      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="space-y-2 px-4 py-4 sm:px-5">
          <FinanceBreadcrumb
            items={[
              { label: "财务系统", href: "/finance" },
              { label: "管理员后台", href: "/finance/admin" },
              { label: "项目统计" },
            ]}
          />

          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="rounded-full border-border/60 bg-muted/50 text-xs">
              Project Analytics
            </Badge>
            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
              <Link href="/finance/admin">返回审核后台</Link>
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">项目类别统计</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              统计口径：已审核通过记录。支持按账目范围查看每个项目类别的收入、支出和净结余。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="inline-flex w-full rounded-xl border border-border/60 bg-muted/40 p-1 sm:w-auto">
            {(Object.keys(scopeLabelMap) as Scope[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.98] sm:min-w-[108px]",
                  scope === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                {value === "company" ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                )}
                {scopeLabelMap[value]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-2 px-4 py-5 text-sm text-muted-foreground">
            <RefreshCcw className="h-4 w-4 animate-spin" />
            正在加载项目统计...
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
          <CardContent className="px-4 py-4 text-sm text-rose-700">{error}</CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">项目总数</p>
                <p className="mt-1 text-sm font-semibold sm:text-base">{data.summary.totalProjects}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">参与统计项目</p>
                <p className="mt-1 text-sm font-semibold sm:text-base">{data.summary.involvedProjects}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">已关联记录</p>
                <p className="mt-1 text-sm font-semibold sm:text-base">{data.summary.trackedRecords}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">总收入</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600 sm:text-base">
                  {formatCurrency(data.summary.totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">总支出</p>
                <p className="mt-1 text-sm font-semibold text-rose-600 sm:text-base">
                  {formatCurrency(data.summary.totalExpense)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">净结余</p>
                <p className="mt-1 text-sm font-semibold text-primary sm:text-base">
                  {formatCurrency(data.summary.balance)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">按项目类别统计</CardTitle>
                <Badge variant="outline" className="rounded-full border-border/60 bg-muted/40 text-[11px]">
                  未归类项目 {data.summary.unmatchedProjectCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                        类别
                      </th>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        项目数
                      </th>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        记录数
                      </th>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        收入
                      </th>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        支出
                      </th>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        净额
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonEmptyCategories.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          暂无类别统计数据
                        </td>
                      </tr>
                    ) : (
                      nonEmptyCategories.map((item) => (
                        <tr key={item.category}>
                          <td className="border-b border-border/40 px-3 py-2 text-sm font-medium">{item.label}</td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm">
                            {item.projectCount}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm">{item.recordCount}</td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-emerald-600">
                            {formatCurrency(item.totalIncome)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-rose-600">
                            {formatCurrency(item.totalExpense)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm font-semibold">
                            {formatCurrency(item.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 md:hidden">
                {nonEmptyCategories.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无类别统计数据
                  </div>
                ) : (
                  nonEmptyCategories.map((item) => (
                    <div key={item.category} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.label}</p>
                        <Badge variant="outline" className="rounded-full border-border/60 bg-muted/40 text-[10px]">
                          {item.projectCount} 项目
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <p className="text-muted-foreground">
                          记录：<span className="text-foreground">{item.recordCount}</span>
                        </p>
                        <p className="text-muted-foreground">
                          收入：<span className="text-emerald-600">{formatCurrency(item.totalIncome)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          支出：<span className="text-rose-600">{formatCurrency(item.totalExpense)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          净额：<span className="font-semibold text-foreground">{formatCurrency(item.balance)}</span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">项目明细（按记录量）</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              {data.projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无项目明细
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full min-w-[820px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          项目名称
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          类别
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          记录数
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          收入
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          支出
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          净额
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects.map((item) => (
                        <tr key={`${item.name}-${item.projectId || "legacy"}`}>
                          <td className="border-b border-border/40 px-3 py-2 text-sm">{item.name}</td>
                          <td className="border-b border-border/40 px-3 py-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
                              <Layers className="h-3 w-3" />
                              {item.categoryLabel}
                            </span>
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm">{item.recordCount}</td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-emerald-600">
                            {formatCurrency(item.totalIncome)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-rose-600">
                            {formatCurrency(item.totalExpense)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm font-semibold">
                            {formatCurrency(item.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="px-4 py-4 text-sm text-muted-foreground">暂无统计数据</CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border border-border/60 bg-muted/20 shadow-sm">
        <CardContent className="flex items-start gap-2 px-4 py-3 text-xs text-muted-foreground">
          <Wallet className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          历史自由文本项目名若未进入项目目录，会自动归类到“其他/未归类”，可后续通过项目目录治理逐步清理。
        </CardContent>
      </Card>
    </div>
  );
}
