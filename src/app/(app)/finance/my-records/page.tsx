"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3, Eye, FilePlus2, Trash2 } from "lucide-react";
import {
  TYPE_LABELS,
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

const formatCurrency = (value: number) =>
  `¥${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

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
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<TypeFilter>("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/finance/my-records");
      const result = await res.json();
      if (result.success) {
        setRecords(result.data);
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
            <div className="space-y-2">
              {filteredRecords.map((record) => (
                <Card
                  key={record.id}
                  className={cn(
                    "rounded-xl border border-border/60 shadow-sm",
                    record.status === "pending" && "border-amber-200/80 bg-amber-50/20",
                    record.status === "approved" && "border-emerald-200/70 bg-emerald-50/20",
                    record.status === "rejected" && "border-rose-200/70 bg-rose-50/20",
                  )}
                >
                  <CardContent className="space-y-2 px-3 py-3 sm:px-4 sm:py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-lg font-semibold sm:text-xl">
                        {record.relatedProject || "未关联项目"}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                          {TYPE_LABELS[record.type]}-{getCategoryLabel(record.category)}
                        </Badge>
                        <Badge
                          className={cn(
                            "rounded-full border px-2 py-0 text-[10px]",
                            statusClassMap[record.status] ||
                              STATUS_LABELS[record.status]?.color ||
                              "bg-muted text-foreground",
                          )}
                        >
                          {STATUS_LABELS[record.status]?.label || record.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>提交：{formatDateTime(record.createdAt)}</span>
                        {record.reviewedAt ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            审核：{formatDateTime(record.reviewedAt)}
                          </span>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-xl font-semibold tracking-tight text-primary">
                        {formatCurrency(record.amount)}
                      </p>
                    </div>

                    <p className="line-clamp-1 text-xs text-muted-foreground">说明：{record.description}</p>
                    {record.reviewNote ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">备注：{record.reviewNote}</p>
                    ) : null}

                    <div className="flex items-center justify-end gap-1.5 border-t border-border/50 pt-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg border-border/60 bg-background px-2.5 text-xs shadow-none"
                      >
                        <Link href={`/finance/edit/${record.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </Link>
                      </Button>

                      {record.status === "pending" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                          className="h-8 rounded-lg border-rose-200 bg-rose-50 px-2.5 text-xs text-rose-700 shadow-none hover:bg-rose-100 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
