"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, RefreshCcw } from "lucide-react";
import {
  APPLICATION_TYPES,
  FINANCE_CATEGORIES,
  getAllApplicationTypes,
  getApplicationTypeFromRecord,
  getCategoryLabel,
  type FinanceApplicationType,
} from "@/lib/finance-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Scope = "all" | "community";

type RecordDetail = {
  id: string;
  type: "income" | "expense";
  amount: number;
  relatedProject: string;
  description: string;
  category: string;
  subcategory?: string | null;
  applicantName: string;
  createdAt: string;
};

type ProjectStatsData = {
  scope: Scope;
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    trackedRecords: number;
  };
  incomeRecords: RecordDetail[];
  expenseRecords: RecordDetail[];
};

type StatsResponse = {
  success?: boolean;
  error?: string;
  data?: ProjectStatsData;
};

type CategoryAmountStat = {
  key: string;
  label: string;
  recordCount: number;
  totalIncome: number;
  totalExpense: number;
  totalAmount: number;
};

type SubcategoryAmountStat = {
  key: string;
  label: string;
  recordCount: number;
  amount: number;
};

type ActivityBalanceStat = {
  key: string;
  label: string;
  recordCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalFlow: number;
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
  { value: "all", label: "全部账目", icon: ArrowUpRight },
  { value: "community", label: "公开账目", icon: ArrowUpRight },
];

const applicationTypeTabs = getAllApplicationTypes().map((item) => ({
  key: item.key,
  label: item.label,
}));

const PAYMENT_NATURE_LABEL_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};

  Object.values(APPLICATION_TYPES).forEach((config) => {
    const subcategoryField = config.fields.find((field) => field.name === "subcategory");
    subcategoryField?.options?.forEach((option) => {
      map[option.value] = option.label;
    });
  });

  [...FINANCE_CATEGORIES.income, ...FINANCE_CATEGORIES.expense].forEach((option) => {
    if (!map[option.value]) {
      map[option.value] = option.label;
    }
  });

  return map;
})();

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
  const [expenseCategoryLabelMap, setExpenseCategoryLabelMap] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<FinanceApplicationType>("income_registration");
  const [showAllRecentRecords, setShowAllRecentRecords] = useState(false);

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

        const [statsRes, expenseCategoryRes] = await Promise.all([
          fetch(`/api/finance/admin/project-stats${params.toString() ? `?${params.toString()}` : ""}`, {
            signal: controller.signal,
          }),
          fetch("/api/finance/expense-categories", { signal: controller.signal }),
        ]);

        const statsResult = (await statsRes.json()) as StatsResponse;
        const expenseCategoryResult = (await expenseCategoryRes.json()) as {
          success?: boolean;
          data?: Array<{ value?: unknown; label?: unknown }>;
        };

        if (!statsRes.ok || !statsResult.success || !statsResult.data) {
          setError(statsResult.error || "加载统计数据失败");
          setData(null);
          return;
        }

        if (expenseCategoryResult.success && Array.isArray(expenseCategoryResult.data)) {
          const nextLabelMap = expenseCategoryResult.data.reduce<Record<string, string>>((acc, item) => {
            if (typeof item.value !== "string" || typeof item.label !== "string") {
              return acc;
            }

            const value = item.value.trim();
            const label = item.label.trim();
            if (!value || !label) {
              return acc;
            }

            acc[value] = label;
            return acc;
          }, {});
          setExpenseCategoryLabelMap(nextLabelMap);
        }

        setData(statsResult.data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError("加载统计数据失败");
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

  const allRecords = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.incomeRecords, ...data.expenseRecords].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [data]);

  const categoryStats = useMemo<CategoryAmountStat[]>(() => {
    const map = new Map<string, CategoryAmountStat>();

    applicationTypeTabs.forEach((item) => {
      map.set(item.key, {
        key: item.key,
        label: item.label,
        recordCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        totalAmount: 0,
      });
    });

    for (const record of allRecords) {
      const normalizedCategory = getApplicationTypeFromRecord(record.type, record.category) || record.category;
      if (!map.has(normalizedCategory)) {
        map.set(normalizedCategory, {
          key: normalizedCategory,
          label: getCategoryLabel(normalizedCategory),
          recordCount: 0,
          totalIncome: 0,
          totalExpense: 0,
          totalAmount: 0,
        });
      }

      const bucket = map.get(normalizedCategory);
      if (!bucket) continue;

      bucket.recordCount += 1;
      if (record.type === "income") {
        bucket.totalIncome += record.amount;
      } else {
        bucket.totalExpense += record.amount;
      }
      bucket.totalAmount += record.amount;
    }

    const fixedOrderKeys = new Set<string>(applicationTypeTabs.map((item) => item.key));
    const orderedStats = applicationTypeTabs
      .map((item) => map.get(item.key))
      .filter((item): item is CategoryAmountStat => Boolean(item));

    const extraStats = Array.from(map.values())
      .filter((item) => !fixedOrderKeys.has(item.key))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    return [...orderedStats, ...extraStats];
  }, [allRecords]);

  useEffect(() => {
    const availableKeys = new Set(categoryStats.map((item) => item.key));
    if (!availableKeys.has(activeCategory)) {
      const firstKnownKey = categoryStats.find((item) => item.key in APPLICATION_TYPES)?.key;
      if (firstKnownKey && firstKnownKey in APPLICATION_TYPES) {
        setActiveCategory(firstKnownKey as FinanceApplicationType);
      }
    }
  }, [categoryStats, activeCategory]);

  const totalCategoryAmount = useMemo(
    () => categoryStats.reduce((sum, item) => sum + item.totalAmount, 0),
    [categoryStats],
  );

  const maxCategoryAmount = useMemo(
    () => categoryStats.reduce((max, item) => Math.max(max, item.totalAmount), 1),
    [categoryStats],
  );

  const activityBalanceStats = useMemo<ActivityBalanceStat[]>(() => {
    const map = new Map<string, ActivityBalanceStat>();

    for (const record of allRecords) {
      const normalizedActivity = record.relatedProject?.trim() || "未关联活动";

      if (!map.has(normalizedActivity)) {
        map.set(normalizedActivity, {
          key: normalizedActivity,
          label: normalizedActivity,
          recordCount: 0,
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          totalFlow: 0,
        });
      }

      const bucket = map.get(normalizedActivity);
      if (!bucket) continue;

      bucket.recordCount += 1;
      bucket.totalFlow += record.amount;

      if (record.type === "income") {
        bucket.totalIncome += record.amount;
        bucket.balance += record.amount;
      } else {
        bucket.totalExpense += record.amount;
        bucket.balance -= record.amount;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.totalFlow !== a.totalFlow) {
        return b.totalFlow - a.totalFlow;
      }
      return b.balance - a.balance;
    });
  }, [allRecords]);

  const profitableActivityCount = useMemo(
    () => activityBalanceStats.filter((item) => item.balance > 0).length,
    [activityBalanceStats],
  );

  const lossActivityCount = useMemo(
    () => activityBalanceStats.filter((item) => item.balance < 0).length,
    [activityBalanceStats],
  );

  const breakEvenActivityCount = useMemo(
    () => activityBalanceStats.filter((item) => item.balance === 0).length,
    [activityBalanceStats],
  );

  const maxActivityBalanceAbs = useMemo(
    () => activityBalanceStats.reduce((max, item) => Math.max(max, Math.abs(item.balance)), 1),
    [activityBalanceStats],
  );

  const activityBars = useMemo(() => activityBalanceStats.slice(0, 8), [activityBalanceStats]);

  const selectedCategoryRecords = useMemo(() => {
    return allRecords.filter((record) => {
      const normalizedCategory = getApplicationTypeFromRecord(record.type, record.category) || record.category;
      return normalizedCategory === activeCategory;
    });
  }, [allRecords, activeCategory]);

  const selectedCategoryTotalAmount = useMemo(
    () => selectedCategoryRecords.reduce((sum, item) => sum + item.amount, 0),
    [selectedCategoryRecords],
  );

  const subcategoryStats = useMemo<SubcategoryAmountStat[]>(() => {
    const map = new Map<string, SubcategoryAmountStat>();

    for (const record of selectedCategoryRecords) {
      const normalizedSubcategory = record.subcategory?.trim() || "__empty__";
      const label =
        normalizedSubcategory === "__empty__"
          ? "未填写"
          : expenseCategoryLabelMap[normalizedSubcategory] ||
            PAYMENT_NATURE_LABEL_MAP[normalizedSubcategory] ||
            normalizedSubcategory;

      if (!map.has(normalizedSubcategory)) {
        map.set(normalizedSubcategory, {
          key: normalizedSubcategory,
          label,
          recordCount: 0,
          amount: 0,
        });
      }

      const bucket = map.get(normalizedSubcategory);
      if (!bucket) continue;

      bucket.recordCount += 1;
      bucket.amount += record.amount;
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [selectedCategoryRecords, expenseCategoryLabelMap]);

  const maxSubcategoryAmount = useMemo(
    () => subcategoryStats.reduce((max, item) => Math.max(max, item.amount), 1),
    [subcategoryStats],
  );

  const recordsToShow = useMemo(
    () => (showAllRecentRecords ? allRecords : allRecords.slice(0, 8)),
    [allRecords, showAllRecentRecords],
  );

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">数据统计</h1>
        <p className="text-sm text-muted-foreground">
          统计口径：已审核通过记录。先看总体与活动收支，再下钻申请类别和款项性质。
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
            正在加载统计数据...
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
                <p className="text-[11px] text-muted-foreground">已通过记录</p>
                <p className="mt-1 text-base font-semibold">{allRecords.length}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
              <CardContent className="px-3 py-3">
                <p className="text-[11px] text-muted-foreground">已关联项目记录</p>
                <p className="mt-1 text-base font-semibold">{data.summary.trackedRecords}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">申请类别金额分布</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                先看四类申请的金额、占比与收支结构，确认重点类别。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 px-3 pb-3 pt-0 xl:grid-cols-2 sm:px-4 sm:pb-4">
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <table className="w-full min-w-[640px] border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                        申请类别
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
                        总金额
                      </th>
                      <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                        占比
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryStats.map((item) => (
                      <tr key={item.key}>
                        <td className="border-b border-border/40 px-3 py-2 text-sm">{item.label}</td>
                        <td className="border-b border-border/40 px-3 py-2 text-right text-sm">{item.recordCount}</td>
                        <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-emerald-600">
                          {formatCurrency(item.totalIncome)}
                        </td>
                        <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-rose-600">
                          {formatCurrency(item.totalExpense)}
                        </td>
                        <td className="border-b border-border/40 px-3 py-2 text-right text-sm font-medium">
                          {formatCurrency(item.totalAmount)}
                        </td>
                        <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-muted-foreground">
                          {totalCategoryAmount > 0
                            ? `${((item.totalAmount / totalCategoryAmount) * 100).toFixed(1)}%`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-border/60 p-3">
                <p className="mb-2 text-sm font-medium">类别金额柱状图</p>
                {categoryStats.every((item) => item.totalAmount <= 0) ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-8 text-center text-xs text-muted-foreground">
                    当前周期暂无已通过记录
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryStats.map((item) => (
                      <div key={`${item.key}-bar`} className="rounded-lg border border-border/50 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm">{item.label}</p>
                          <p className="text-xs font-medium">{formatCurrency(item.totalAmount)}</p>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              item.totalIncome >= item.totalExpense ? "bg-emerald-500" : "bg-rose-500",
                            )}
                            style={{
                              width: `${item.totalAmount > 0 ? Math.max((item.totalAmount / maxCategoryAmount) * 100, 4) : 0}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          收入 {formatCurrency(item.totalIncome)} / 支出 {formatCurrency(item.totalExpense)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">款项性质下钻</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                选择申请类别后，查看该类别下不同款项性质的金额分布。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              <div className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-border/60 bg-muted/30 p-1">
                {applicationTypeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveCategory(tab.key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                      activeCategory === tab.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="rounded-xl border border-border/60 p-3">
                  <p className="mb-2 text-sm font-medium">款项性质柱状图</p>
                  {subcategoryStats.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-8 text-center text-xs text-muted-foreground">
                      当前类别暂无款项性质数据
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subcategoryStats.map((item) => (
                        <div key={item.key} className="rounded-lg border border-border/50 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm">{item.label}</p>
                            <p className="text-xs font-medium">{formatCurrency(item.amount)}</p>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-muted">
                            <div
                              className={cn(
                                "h-2 rounded-full",
                                activeCategory === "income_registration" ? "bg-emerald-500" : "bg-blue-500",
                              )}
                              style={{
                                width: `${item.amount > 0 ? Math.max((item.amount / maxSubcategoryAmount) * 100, 4) : 0}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">记录 {item.recordCount} 条</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[420px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          款项性质
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          记录数
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          金额
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          占比
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subcategoryStats.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-xs text-muted-foreground">
                            当前类别暂无款项性质数据
                          </td>
                        </tr>
                      ) : (
                        subcategoryStats.map((item) => (
                          <tr key={`${item.key}-row`}>
                            <td className="border-b border-border/40 px-3 py-2 text-sm">{item.label}</td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-sm">
                              {item.recordCount}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-sm font-medium">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-muted-foreground">
                              {selectedCategoryTotalAmount > 0
                                ? `${((item.amount / selectedCategoryTotalAmount) * 100).toFixed(1)}%`
                                : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">活动收支统计</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                以活动为维度查看收入、支出和净收支，快速判断每个活动是否盈利。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">盈利活动</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">{profitableActivityCount}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">亏损活动</p>
                  <p className="mt-1 text-sm font-semibold text-rose-600">{lossActivityCount}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">持平活动</p>
                  <p className="mt-1 text-sm font-semibold">{breakEvenActivityCount}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">整体收支状态</p>
                  <p
                    className={cn(
                      "mt-1 text-sm font-semibold",
                      data.summary.balance >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {data.summary.balance >= 0 ? "整体盈利" : "整体亏损"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[720px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          活动/项目
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
                          净收支
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          收支状态
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityBalanceStats.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                            当前周期暂无活动收支数据
                          </td>
                        </tr>
                      ) : (
                        activityBalanceStats.map((item) => (
                          <tr key={`${item.key}-activity`}>
                            <td className="border-b border-border/40 px-3 py-2 text-sm">{item.label}</td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-sm">
                              {item.recordCount}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-emerald-600">
                              {formatCurrency(item.totalIncome)}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-sm text-rose-600">
                              {formatCurrency(item.totalExpense)}
                            </td>
                            <td
                              className={cn(
                                "border-b border-border/40 px-3 py-2 text-right text-sm font-medium",
                                item.balance >= 0 ? "text-emerald-600" : "text-rose-600",
                              )}
                            >
                              {formatCurrency(item.balance)}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-sm">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-xs",
                                  item.balance > 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : item.balance < 0
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-muted text-muted-foreground",
                                )}
                              >
                                {item.balance > 0 ? "盈利" : item.balance < 0 ? "亏损" : "持平"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-border/60 p-3">
                  <p className="mb-2 text-sm font-medium">活动净收支柱状图（Top 8）</p>
                  {activityBars.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-8 text-center text-xs text-muted-foreground">
                      当前周期暂无活动收支数据
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activityBars.map((item) => (
                        <div key={`${item.key}-activity-bar`} className="rounded-lg border border-border/50 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm">{item.label}</p>
                            <p
                              className={cn(
                                "text-xs font-medium",
                                item.balance >= 0 ? "text-emerald-600" : "text-rose-600",
                              )}
                            >
                              {formatCurrency(item.balance)}
                            </p>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-muted">
                            <div
                              className={cn("h-2 rounded-full", item.balance >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                              style={{
                                width: `${Math.max((Math.abs(item.balance) / maxActivityBalanceAbs) * 100, 4)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            收入 {formatCurrency(item.totalIncome)} / 支出 {formatCurrency(item.totalExpense)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">近期记录预览</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                展示当前筛选条件内记录，默认显示 8 条，可展开查看全部。
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
              {recordsToShow.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  暂无记录
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[720px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          申请类别
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          款项性质
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                          项目/活动
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          金额
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                          提交时间
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recordsToShow.map((record) => {
                        const subcategory = record.subcategory?.trim();
                        const paymentNatureLabel = subcategory
                          ? expenseCategoryLabelMap[subcategory] || PAYMENT_NATURE_LABEL_MAP[subcategory] || subcategory
                          : "未填写";

                        return (
                          <tr key={record.id}>
                            <td className="border-b border-border/40 px-3 py-2 text-sm">
                              {getCategoryLabel(
                                getApplicationTypeFromRecord(record.type, record.category) || record.category,
                              )}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-sm">{paymentNatureLabel}</td>
                            <td className="border-b border-border/40 px-3 py-2 text-sm">
                              {record.relatedProject || "-"}
                            </td>
                            <td
                              className={cn(
                                "border-b border-border/40 px-3 py-2 text-right text-sm font-medium",
                                record.type === "income" ? "text-emerald-600" : "text-rose-600",
                              )}
                            >
                              {formatCurrency(record.amount)}
                            </td>
                            <td className="border-b border-border/40 px-3 py-2 text-right text-xs text-muted-foreground">
                              {formatDateTime(record.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {allRecords.length > 8 ? (
                <button
                  type="button"
                  onClick={() => setShowAllRecentRecords((prev) => !prev)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform", showAllRecentRecords && "rotate-180")}
                  />
                  {showAllRecentRecords ? "收起记录" : `展开全部（共 ${allRecords.length} 条）`}
                </button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">当前共 {allRecords.length} 条，已全部显示</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="px-4 py-4 text-sm text-muted-foreground">暂无统计数据</CardContent>
        </Card>
      )}
    </div>
  );
}
