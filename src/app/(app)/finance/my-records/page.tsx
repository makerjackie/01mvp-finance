"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Eye, FilePlus2, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  APPLICATION_TYPES,
  FINANCE_CATEGORIES,
  STATUS_LABELS,
  getAllApplicationTypes,
  getApplicationTypeFromRecord,
  getCategoryLabel,
  type FinanceApplicationType,
} from "@/lib/finance-config";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FinanceRecord {
  id: string;
  type: string;
  category: string;
  subcategory?: string | null;
  formPayload?: Record<string, unknown> | null;
  amount: number;
  relatedProject?: string;
  description: string;
  status: string;
  createdAt: string;
  reviewNote?: string;
  reviewedAt?: string;
}

const statusClassMap: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

const formatCurrency = (value: number) =>
  `¥${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

type TypeFilter = "all" | FinanceApplicationType;
type StatusFilter = "all" | "approved" | "rejected" | "pending";

const typeTabs: Array<{ key: TypeFilter; label: string }> = [
  { key: "all", label: "全部" },
  ...getAllApplicationTypes().map((item) => ({
    key: item.key,
    label: item.label,
  })),
];

const statusTabs: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "approved", label: "审核通过" },
  { key: "rejected", label: "审核未通过" },
  { key: "pending", label: "待审核" },
];

export default function MyRecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [expenseCategoryLabelMap, setExpenseCategoryLabelMap] = useState<Record<string, string>>({});
  const [activeType, setActiveType] = useState<TypeFilter>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const [recordsRes, expenseCategoryRes] = await Promise.all([
        fetch("/api/finance/my-records"),
        fetch("/api/finance/expense-categories"),
      ]);

      const recordsResult = await recordsRes.json();
      const expenseCategoryResult = await expenseCategoryRes.json();

      if (recordsResult.success) {
        setRecords(recordsResult.data);
      }

      if (expenseCategoryResult.success && Array.isArray(expenseCategoryResult.data)) {
        const nextLabelMap = (expenseCategoryResult.data as Array<{ value?: unknown; label?: unknown }>).reduce<
          Record<string, string>
        >((acc, item) => {
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;

    try {
      const res = await fetch(`/api/finance/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        alert("删除成功");
        fetchRecords();
      } else {
        alert(result.error || "删除失败");
      }
    } catch (error) {
      console.error(error);
      alert("删除失败");
    }
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    try {
      const res = await fetch(`/api/finance/${id}/duplicate`, {
        method: "POST",
      });
      const result = await res.json();
      if (result.success && result.data?.id) {
        router.push(`/finance/edit/${result.data.id}?from=duplicate`);
      } else {
        alert(result.error || "复制失败");
      }
    } catch (error) {
      console.error(error);
      alert("复制失败");
    } finally {
      setDuplicatingId(null);
    }
  };

  const filteredRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return sorted.filter((record) => {
      if (activeType !== "all") {
        const applicationType = getApplicationTypeFromRecord(record.type, record.category);
        if (applicationType !== activeType) {
          return false;
        }
      }

      if (activeStatus !== "all" && record.status !== activeStatus) {
        return false;
      }

      return true;
    });
  }, [records, activeType, activeStatus]);

  const getPaymentNatureLabel = (record: FinanceRecord): string => {
    const payloadSubcategory = isRecordObject(record.formPayload) ? record.formPayload.subcategory : undefined;
    const rawSubcategory =
      typeof record.subcategory === "string"
        ? record.subcategory.trim()
        : typeof payloadSubcategory === "string"
          ? payloadSubcategory.trim()
          : "";

    if (rawSubcategory) {
      return expenseCategoryLabelMap[rawSubcategory] || PAYMENT_NATURE_LABEL_MAP[rawSubcategory] || rawSubcategory;
    }

    return PAYMENT_NATURE_LABEL_MAP[record.category] || "-";
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="px-4 py-4 sm:px-5">
          <p className="text-sm text-muted-foreground">正在加载申请记录...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 md:space-y-5">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">我的申请记录</h1>
        <p className="text-sm text-muted-foreground">查看审核状态，待审核记录可继续修改或删除</p>
      </div>

      {records.length === 0 ? (
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 px-4 py-8 text-center sm:py-10">
            <p className="text-sm text-muted-foreground">暂无申请记录</p>
            <Button asChild size="sm" className="h-9 rounded-lg px-3">
              <Link href="/finance/submit">
                <FilePlus2 className="h-4 w-4" />
                提交新申请
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardContent className="space-y-2 px-3 py-3 sm:px-4">
              <div className="flex flex-wrap gap-1.5">
                {typeTabs.map((tab) => (
                  <Button
                    key={tab.key}
                    type="button"
                    size="sm"
                    variant={activeType === tab.key ? "default" : "outline"}
                    onClick={() => setActiveType(tab.key)}
                    className={cn("h-8 rounded-full px-3 text-xs", activeType === tab.key && "shadow-none")}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
                {statusTabs.map((tab) => (
                  <Button
                    key={tab.key}
                    type="button"
                    size="sm"
                    variant={activeStatus === tab.key ? "default" : "outline"}
                    onClick={() => setActiveStatus(tab.key)}
                    className={cn("h-8 rounded-full px-3 text-xs", activeStatus === tab.key && "shadow-none")}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {filteredRecords.length === 0 ? (
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="px-4 py-8 text-center text-sm text-muted-foreground">
                当前筛选条件下暂无申请记录
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="space-y-3 px-3 py-3 sm:px-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">申请记录</p>
                  <Badge variant="outline" className="rounded-full border-border/60 bg-muted/40 text-[11px]">
                    共 {filteredRecords.length} 条
                  </Badge>
                </div>

                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full min-w-[920px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="border-b border-border/60 bg-muted/40 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          申请类别
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          款项性质
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          项目/活动
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          金额
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                          状态
                        </th>
                        <th className="border-b border-border/60 bg-muted/40 px-4 py-2 text-right text-xs font-medium text-muted-foreground">
                          操作
                        </th>
                        <th className="w-14 border-b border-border/60 bg-muted/40 px-4 py-2 text-right" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="align-middle hover:bg-muted/20">
                          <td className="border-b border-border/40 px-4 py-3">
                            <span className="text-sm text-foreground">{getCategoryLabel(record.category)}</span>
                          </td>
                          <td className="border-b border-border/40 px-4 py-3">
                            <span className="text-sm text-foreground">{getPaymentNatureLabel(record)}</span>
                          </td>
                          <td className="border-b border-border/40 px-4 py-3">
                            <p className="text-sm text-foreground">{record.relatedProject || "-"}</p>
                          </td>
                          <td className="border-b border-border/40 px-4 py-3">
                            <p className="text-sm text-foreground">{formatCurrency(record.amount)}</p>
                          </td>
                          <td className="border-b border-border/40 px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                statusClassMap[record.status] ||
                                  STATUS_LABELS[record.status]?.color ||
                                  "bg-muted text-foreground",
                              )}
                            >
                              {STATUS_LABELS[record.status]?.label || record.status}
                            </span>
                          </td>
                          <td className="border-b border-border/40 px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-lg border-border/60 bg-background px-2.5 text-xs shadow-none"
                              >
                                <Link href={`/finance/edit/${record.id}`}>
                                  <Eye className="h-3.5 w-3.5" />
                                  查看
                                </Link>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicate(record.id)}
                                disabled={duplicatingId === record.id}
                                className="h-8 gap-1.5 rounded-lg border-border/60 bg-background px-2.5 text-xs shadow-none"
                              >
                                {duplicatingId === record.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                                复制
                              </Button>
                            </div>
                          </td>
                          <td className="border-b border-border/40 px-4 py-3 text-right">
                            {record.status === "pending" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(record.id)}
                                className="h-8 w-8 text-muted-foreground/70 hover:bg-muted hover:text-rose-600"
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">删除</span>
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
