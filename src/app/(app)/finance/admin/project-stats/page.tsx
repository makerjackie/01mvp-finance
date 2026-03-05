"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BarChart3, FolderKanban, Layers, RefreshCcw, Save, Wallet } from "lucide-react";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT,
  PROJECT_SETTLEMENT_MODE_LABELS,
  type ProjectSettlementMode,
} from "@/lib/project-categories";
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
  settlementMode: ProjectSettlementMode;
  settlementModeLabel: string;
  communitySharePercent: number;
  settlementDescription: string;
  recordCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  communityShareIncome: number;
  teamShareIncome: number;
};

type ProjectCatalogItem = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  settlementMode: ProjectSettlementMode;
  settlementModeLabel: string;
  communitySharePercent: number;
  settlementDescription: string;
  recordCount: number;
  totalIncome: number;
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
    estimatedCommunityShareIncome: number;
    estimatedTeamShareIncome: number;
  };
  categories: CategoryStat[];
  projects: ProjectStat[];
  catalog: ProjectCatalogItem[];
};

type StatsResponse = {
  success?: boolean;
  error?: string;
  data?: ProjectStatsData;
};

type UpdateProjectConfigResponse = {
  success?: boolean;
  error?: string;
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
  const [savingProjectId, setSavingProjectId] = useState<string | null>(null);
  const [configDrafts, setConfigDrafts] = useState<
    Record<
      string,
      {
        settlementMode: ProjectSettlementMode;
        communitySharePercent: number;
      }
    >
  >({});

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

        const statsData = result.data;
        setData(statsData);
        setConfigDrafts((prev) => {
          const next = { ...prev };
          for (const item of statsData.catalog) {
            next[item.id] = {
              settlementMode: next[item.id]?.settlementMode || item.settlementMode,
              communitySharePercent: next[item.id]?.communitySharePercent ?? item.communitySharePercent,
            };
          }
          return next;
        });
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

  const handleSaveProjectConfig = async (projectId: string) => {
    const draft = configDrafts[projectId];
    if (!draft) return;

    setSavingProjectId(projectId);
    setError(null);

    try {
      const res = await fetch(`/api/finance/admin/projects/${projectId}/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settlementMode: draft.settlementMode,
          communitySharePercent: draft.communitySharePercent,
        }),
      });

      const result = (await res.json()) as UpdateProjectConfigResponse;
      if (!res.ok || !result.success) {
        setError(result.error || "项目配置保存失败");
        return;
      }

      const params = new URLSearchParams();
      if (scope !== "all") {
        params.set("scope", scope);
      }
      const refreshed = await fetch(
        `/api/finance/admin/project-stats${params.toString() ? `?${params.toString()}` : ""}`,
      );
      const refreshedResult = (await refreshed.json()) as StatsResponse;
      if (refreshed.ok && refreshedResult.success && refreshedResult.data) {
        const refreshedData = refreshedResult.data;
        setData(refreshedData);
        setConfigDrafts((prev) => {
          const next = { ...prev };
          for (const item of refreshedData.catalog) {
            next[item.id] = {
              settlementMode: item.settlementMode,
              communitySharePercent: item.communitySharePercent,
            };
          }
          return next;
        });
      }
    } catch {
      setError("项目配置保存失败");
    } finally {
      setSavingProjectId(null);
    }
  };

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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
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
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">社区应得收入</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600 sm:text-base">
                  {formatCurrency(data.summary.estimatedCommunityShareIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">团队分成收入</p>
                <p className="mt-1 text-sm font-semibold text-blue-600 sm:text-base">
                  {formatCurrency(data.summary.estimatedTeamShareIncome)}
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
                  <table className="w-full min-w-[1060px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          项目名称
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          类别
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          结算配置
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
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          社区应得
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          团队分成
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
                          <td className="border-b border-border/40 px-3 py-2 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">{item.settlementModeLabel}</p>
                            <p>{item.settlementDescription}</p>
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
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-emerald-600">
                            {formatCurrency(item.communityShareIncome)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-blue-600">
                            {formatCurrency(item.teamShareIncome)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">项目结算配置</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                支持配置“仅覆盖成本”与“盈利分成”。盈利分成默认规则：社区 20% / 项目团队 80%。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              {data.catalog.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无可配置项目
                </div>
              ) : (
                <div className="max-h-[420px] overflow-auto">
                  <table className="w-full min-w-[980px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          项目
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          类别
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          结算模式
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          社区分成%
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          说明
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.catalog.map((item) => {
                        const draft = configDrafts[item.id] || {
                          settlementMode: item.settlementMode,
                          communitySharePercent: item.communitySharePercent,
                        };

                        const previewPercent =
                          draft.settlementMode === "profit_share"
                            ? Math.max(0, Math.min(100, Number(draft.communitySharePercent || 0)))
                            : DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT;

                        return (
                          <tr key={item.id}>
                            <td className="border-b border-border/40 px-3 py-2 text-sm">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                记录 {item.recordCount} · 收入 {formatCurrency(item.totalIncome)}
                              </p>
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-xs text-muted-foreground">
                              {item.categoryLabel}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2">
                              <select
                                value={draft.settlementMode}
                                onChange={(event) =>
                                  setConfigDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...draft,
                                      settlementMode: event.target.value as ProjectSettlementMode,
                                    },
                                  }))
                                }
                                className="h-8 rounded-md border border-border/60 bg-background px-2 text-xs"
                              >
                                <option value="cost_only">{PROJECT_SETTLEMENT_MODE_LABELS.cost_only}</option>
                                <option value="profit_share">{PROJECT_SETTLEMENT_MODE_LABELS.profit_share}</option>
                              </select>
                            </td>
                            <td className="border-b border-border/40 px-3 py-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={draft.communitySharePercent}
                                disabled={draft.settlementMode !== "profit_share"}
                                onChange={(event) =>
                                  setConfigDrafts((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...draft,
                                      communitySharePercent: Number(event.target.value || 0),
                                    },
                                  }))
                                }
                                className="h-8 w-20 border-border/60 text-xs disabled:opacity-50"
                              />
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-xs text-muted-foreground">
                              {draft.settlementMode === "profit_share"
                                ? `社区 ${previewPercent}% / 团队 ${100 - previewPercent}%`
                                : "仅覆盖成本，不分成"}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-right">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 rounded-lg text-xs"
                                disabled={savingProjectId === item.id}
                                onClick={() => void handleSaveProjectConfig(item.id)}
                              >
                                <Save className="h-3.5 w-3.5" />
                                {savingProjectId === item.id ? "保存中..." : "保存"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
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
