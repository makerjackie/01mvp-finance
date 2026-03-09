"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, RefreshCcw, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Scope = "all" | "community";

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
  recordCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

type RecordDetail = {
  id: string;
  type: "income" | "expense";
  amount: number;
  relatedProject: string;
  description: string;
  category: string;
  applicantName: string;
  createdAt: string;
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
  incomeRecords: RecordDetail[];
  expenseRecords: RecordDetail[];
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

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultHalfYearDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  return {
    startDate: formatDateInputValue(start),
    endDate: formatDateInputValue(end),
  };
};

const scopeTabs: Array<{
  value: Scope;
  label: string;
  icon: typeof ArrowUpRight;
}> = [
  { value: "all", label: "全部帐目", icon: ArrowUpRight },
  { value: "community", label: "社区帐目", icon: ArrowUpRight },
];

export default function ProjectStatsPage() {
  const defaultRange = getDefaultHalfYearDateRange();
  const [scope, setScope] = useState<Scope>("all");
  const [dateRanges, setDateRanges] = useState<Record<Scope, { startDate: string; endDate: string }>>({
    all: { ...defaultRange },
    community: { ...defaultRange },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProjectStatsData | null>(null);
  const [showAllIncomeRecords, setShowAllIncomeRecords] = useState(false);
  const [showAllExpenseRecords, setShowAllExpenseRecords] = useState(false);
  const startDate = dateRanges[scope].startDate;
  const endDate = dateRanges[scope].endDate;
  const isDateRangeIncomplete = (startDate && !endDate) || (!startDate && endDate);

  const updateCurrentScopeDateRange = (next: Partial<{ startDate: string; endDate: string }>) => {
    setDateRanges((prev) => ({
      ...prev,
      [scope]: {
        ...prev[scope],
        ...next,
      },
    }));
  };

  useEffect(() => {
    if (isDateRangeIncomplete) {
      return;
    }

    const controller = new AbortController();
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (scope !== "all") {
          params.set("scope", scope);
        }
        if (startDate) {
          params.set("startDate", startDate);
        }
        if (endDate) {
          params.set("endDate", endDate);
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
  }, [scope, startDate, endDate, isDateRangeIncomplete]);

  const nonEmptyCategories = useMemo(() => {
    if (!data) return [];
    return data.categories.filter(
      (item) => item.projectCount > 0 || item.recordCount > 0 || item.totalIncome > 0 || item.totalExpense > 0,
    );
  }, [data]);

  const sortedCategories = useMemo(
    () =>
      [...nonEmptyCategories].sort(
        (a, b) => Math.max(b.totalIncome, b.totalExpense) - Math.max(a.totalIncome, a.totalExpense),
      ),
    [nonEmptyCategories],
  );

  const maxCategoryAmount = useMemo(
    () =>
      sortedCategories.reduce((max, item) => {
        return Math.max(max, item.totalIncome, item.totalExpense);
      }, 1),
    [sortedCategories],
  );

  const rankedProjects = useMemo(() => {
    if (!data) return [];
    return [...data.projects].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)).slice(0, 8);
  }, [data]);

  const topExpenseProjects = useMemo(() => {
    if (!data) return [];
    return [...data.projects].sort((a, b) => b.totalExpense - a.totalExpense).slice(0, 5);
  }, [data]);

  const maxAbsBalance = useMemo(
    () =>
      rankedProjects.reduce((max, item) => {
        return Math.max(max, Math.abs(item.balance));
      }, 1),
    [rankedProjects],
  );

  const incomeRecordsToShow = useMemo(
    () => (data ? (showAllIncomeRecords ? data.incomeRecords : data.incomeRecords.slice(0, 8)) : []),
    [data, showAllIncomeRecords],
  );

  const expenseRecordsToShow = useMemo(
    () => (data ? (showAllExpenseRecords ? data.expenseRecords : data.expenseRecords.slice(0, 8)) : []),
    [data, showAllExpenseRecords],
  );

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">项目类别统计</h1>
        <p className="text-sm text-muted-foreground">
          统计口径：已审核通过记录。社区账目口径为审核员将“是否社区账目”选择为“是”的记录。
        </p>
      </div>

      <div className="space-y-2 px-1">
        <div className="inline-flex w-full rounded-xl border border-border/60 bg-muted/40 p-1 sm:w-auto">
          {scopeTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setScope(tab.value)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.98] sm:min-w-[108px]",
                  scope === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">时间区间</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => updateCurrentScopeDateRange({ startDate: event.target.value })}
              className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
            />
            <span className="text-xs text-muted-foreground">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => updateCurrentScopeDateRange({ endDate: event.target.value })}
              className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  updateCurrentScopeDateRange({ startDate: "", endDate: "" });
                }}
                className="h-8 rounded-lg border border-border/60 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                清空区间
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">默认展示近半年数据，可按需修改时间周期</p>
        </div>
      </div>

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
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">总收入</p>
                <p className="mt-1 text-base font-semibold text-emerald-600">
                  {formatCurrency(data.summary.totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">总支出</p>
                <p className="mt-1 text-base font-semibold text-rose-600">
                  {formatCurrency(data.summary.totalExpense)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">净结余</p>
                <p
                  className={cn(
                    "mt-1 text-base font-semibold",
                    data.summary.balance >= 0 ? "text-emerald-600" : "text-rose-600",
                  )}
                >
                  {formatCurrency(data.summary.balance)}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">收支比（支出/收入）</p>
                <p
                  className={cn(
                    "mt-1 text-base font-semibold",
                    data.summary.totalIncome > 0 && data.summary.totalExpense / data.summary.totalIncome > 1
                      ? "text-rose-600"
                      : "text-foreground",
                  )}
                >
                  {data.summary.totalIncome > 0
                    ? `${((data.summary.totalExpense / data.summary.totalIncome) * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">已关联记录</p>
                <p className="mt-1 text-base font-semibold">{data.summary.trackedRecords}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <Card className="rounded-2xl border border-border/60 shadow-sm">
              <CardHeader className="px-4 py-3 sm:px-5">
                <CardTitle className="text-base">收支结构图（按项目类别）</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  绿色为收入，红色为支出，便于快速识别结构失衡。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 pt-0 sm:px-5">
                {sortedCategories.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无类别统计数据
                  </div>
                ) : (
                  sortedCategories.map((item) => (
                    <div key={item.category} className="rounded-lg border border-border/50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p
                          className={cn(
                            "text-xs font-medium",
                            item.balance >= 0 ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          净额 {formatCurrency(item.balance)}
                        </p>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="grid grid-cols-[40px_1fr_auto] items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">收入</span>
                          <div className="h-1.5 rounded-full bg-emerald-100">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500"
                              style={{
                                width: `${item.totalIncome > 0 ? Math.max((item.totalIncome / maxCategoryAmount) * 100, 3) : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-emerald-600">{formatCurrency(item.totalIncome)}</span>
                        </div>
                        <div className="grid grid-cols-[40px_1fr_auto] items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">支出</span>
                          <div className="h-1.5 rounded-full bg-rose-100">
                            <div
                              className="h-1.5 rounded-full bg-rose-500"
                              style={{
                                width: `${item.totalExpense > 0 ? Math.max((item.totalExpense / maxCategoryAmount) * 100, 3) : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-rose-600">{formatCurrency(item.totalExpense)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-border/60 shadow-sm">
              <CardHeader className="px-4 py-3 sm:px-5">
                <CardTitle className="text-base">项目净额排行（Top 8）</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  按净额绝对值排序，优先看波动最大的项目。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4 pt-0 sm:px-5">
                {rankedProjects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                    暂无项目数据
                  </div>
                ) : (
                  rankedProjects.map((item) => (
                    <div
                      key={`${item.name}-${item.projectId || "legacy"}`}
                      className="space-y-1.5 rounded-lg border border-border/50 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p
                          className={cn(
                            "text-xs font-medium",
                            item.balance >= 0 ? "text-emerald-600" : "text-rose-600",
                          )}
                        >
                          {formatCurrency(item.balance)}
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className={cn("h-1.5 rounded-full", item.balance >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                          style={{ width: `${Math.max((Math.abs(item.balance) / maxAbsBalance) * 100, 4)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>记录 {item.recordCount}</span>
                        <span>
                          收入 {formatCurrency(item.totalIncome)} / 支出 {formatCurrency(item.totalExpense)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">重点项目清单（按支出 Top 5）</CardTitle>
              <CardDescription className="text-xs sm:text-sm">用于审核阶段优先关注大额支出项目。</CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              {topExpenseProjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无重点项目
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          项目
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          记录数
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          支出
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          收入
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          净额
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topExpenseProjects.map((item) => (
                        <tr key={`${item.name}-${item.projectId || "legacy"}-expense`}>
                          <td className="border-b border-border/40 px-3 py-2 text-sm">{item.name}</td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm">{item.recordCount}</td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-rose-600">
                            {formatCurrency(item.totalExpense)}
                          </td>
                          <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-emerald-600">
                            {formatCurrency(item.totalIncome)}
                          </td>
                          <td
                            className={cn(
                              "border-b border-border/40 px-3 py-2 text-right text-sm font-semibold",
                              item.balance >= 0 ? "text-emerald-600" : "text-rose-600",
                            )}
                          >
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

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">收入与支出明细</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                默认展示最近 8 条，点击下拉可展开更多历史记录。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 px-3 pb-3 pt-0 lg:grid-cols-2 sm:px-4 sm:pb-4">
              <div className="rounded-xl border border-border/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-emerald-600">收入明细</p>
                  <span className="text-xs text-muted-foreground">共 {data.incomeRecords.length} 条</span>
                </div>
                {incomeRecordsToShow.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
                    暂无收入记录
                  </div>
                ) : (
                  <div className="space-y-2">
                    {incomeRecordsToShow.map((record) => (
                      <div key={record.id} className="rounded-lg border border-border/50 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{record.relatedProject}</p>
                            {record.description ? (
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{record.description}</p>
                            ) : null}
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {formatDateTime(record.createdAt)} · {record.applicantName} · {record.category}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-emerald-600">
                            {formatCurrency(record.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {data.incomeRecords.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllIncomeRecords((prev) => !prev)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", showAllIncomeRecords && "rotate-180")}
                    />
                    {showAllIncomeRecords ? "收起明细" : "展开更多明细"}
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-border/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-rose-600">支出明细</p>
                  <span className="text-xs text-muted-foreground">共 {data.expenseRecords.length} 条</span>
                </div>
                {expenseRecordsToShow.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
                    暂无支出记录
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expenseRecordsToShow.map((record) => (
                      <div key={record.id} className="rounded-lg border border-border/50 px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{record.relatedProject}</p>
                            {record.description ? (
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{record.description}</p>
                            ) : null}
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {formatDateTime(record.createdAt)} · {record.applicantName} · {record.category}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-rose-600">
                            {formatCurrency(record.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {data.expenseRecords.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllExpenseRecords((prev) => !prev)}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", showAllExpenseRecords && "rotate-180")}
                    />
                    {showAllExpenseRecords ? "收起明细" : "展开更多明细"}
                  </button>
                )}
              </div>
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
