"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Eye, FilePlus2, Trash2 } from "lucide-react";
import { TYPE_LABELS, STATUS_LABELS, getCategoryLabel } from "@/lib/finance-config";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";

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

export default function MyRecordsPage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="space-y-2 px-4 py-4 sm:px-5">
          <FinanceBreadcrumb items={[{ label: "财务系统", href: "/finance" }, { label: "我的记录" }]} />
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">我的申请记录</CardTitle>
            <CardDescription className="text-xs sm:text-sm">查看审核状态，待审核记录可继续修改或删除</CardDescription>
          </div>
        </CardHeader>
      </Card>

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
        <div className="space-y-2">
          {records.map((record) => (
            <Card key={record.id} className="rounded-xl border border-border/60 shadow-sm">
              <CardContent className="space-y-2 px-3 py-3 sm:px-4 sm:py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {TYPE_LABELS[record.type]} · {getCategoryLabel(record.category)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(record.createdAt)}</p>
                  </div>
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

                <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                  <p className="font-semibold text-primary">金额：{formatCurrency(record.amount)}</p>
                  {record.relatedProject ? (
                    <p className="truncate text-muted-foreground">项目：{record.relatedProject}</p>
                  ) : (
                    <p className="text-muted-foreground">项目：-</p>
                  )}
                </div>

                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{record.description}</p>

                {record.reviewedAt && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      审核时间：{formatDateTime(record.reviewedAt)}
                    </p>
                    {record.reviewNote && <p className="mt-1">审核备注：{record.reviewNote}</p>}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 border-t border-border/50 pt-2">
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
    </div>
  );
}
