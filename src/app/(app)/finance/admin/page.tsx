"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Check, CheckCircle2, Download, Eye, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { TYPE_LABELS, STATUS_LABELS, getCategoryLabel } from "@/lib/finance-config";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";

interface FinanceRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  relatedProject?: string;
  description: string;
  status: string;
  paymentStatus: string;
  paymentDate?: string;
  createdAt: string;
  isCommunity: boolean;
  user: {
    id: string;
    name: string;
    phoneNumber?: string;
  };
  reviewNote?: string;
  reviewedAt?: string;
  recipientName?: string;
  recipientAccount?: string;
  attachments?: unknown[];
}

interface ProjectOption {
  id: string;
  name: string;
  createdAt: string;
}

type CommunityChoice = "" | "yes" | "no";
type PaymentStatusFilter = "" | "paid" | "unpaid";

const formatCurrency = (value: number) =>
  `¥${new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

const formatDate = (value: string) => new Date(value).toLocaleDateString("zh-CN");

const statusClassMap: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const typeClassMap: Record<string, string> = {
  income: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expense: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function AdminPage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("");
  const [communityChoices, setCommunityChoices] = useState<Record<string, CommunityChoice>>({});
  const [communitySavingId, setCommunitySavingId] = useState<string | null>(null);
  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);

  const paymentFilteredRecords = useMemo(() => {
    if (!paymentStatusFilter) {
      return records;
    }
    return records.filter((record) => record.type === "expense" && record.paymentStatus === paymentStatusFilter);
  }, [records, paymentStatusFilter]);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, projectOptionsRes] = await Promise.all([
        fetch("/api/finance/admin/all"),
        fetch("/api/finance/admin/project-options"),
      ]);

      const recordsResult = await recordsRes.json();
      const projectOptionsResult = await projectOptionsRes.json();

      if (recordsResult.success && Array.isArray(recordsResult.data)) {
        const nextRecords = recordsResult.data as FinanceRecord[];
        setRecords(nextRecords);
        setCommunityChoices((prev) => {
          const next: Record<string, CommunityChoice> = {};
          nextRecords.forEach((record) => {
            const previous = prev[record.id];
            if (previous === "yes" || previous === "no") {
              next[record.id] = previous;
              return;
            }
            next[record.id] = record.status === "pending" ? "" : record.isCommunity ? "yes" : "no";
          });
          return next;
        });

        if (!projectOptionsResult.success || !Array.isArray(projectOptionsResult.data)) {
          const fallbackProjectOptions = nextRecords
            .filter((record) => Boolean(record.relatedProject))
            .map((record) => record.relatedProject!.trim())
            .filter((name, index, arr) => name.length > 0 && arr.indexOf(name) === index)
            .map((name, index) => ({ id: `record-${index}`, name, createdAt: new Date(0).toISOString() }));
          setProjectOptions(fallbackProjectOptions);
        }
      }

      if (projectOptionsResult.success && Array.isArray(projectOptionsResult.data)) {
        const normalized = (projectOptionsResult.data as ProjectOption[])
          .filter((item) => typeof item.name === "string" && item.name.trim().length > 0)
          .map((item) => ({
            id: item.id,
            name: item.name.trim(),
            createdAt: item.createdAt,
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjectOptions(normalized);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCommunityChoice = (record: FinanceRecord): CommunityChoice => {
    const current = communityChoices[record.id];
    if (current === "yes" || current === "no") {
      return current;
    }
    if (record.status === "pending") {
      return "";
    }
    return record.isCommunity ? "yes" : "no";
  };

  const persistCommunityChoice = async (recordId: string, isCommunity: boolean) => {
    setCommunitySavingId(recordId);
    try {
      const res = await fetch(`/api/finance/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCommunity }),
      });

      const result = await res.json();
      if (!result.success) {
        alert(result.error || "保存“是否社区账目”失败");
        return false;
      }

      setRecords((prev) =>
        prev.map((item) =>
          item.id === recordId
            ? {
                ...item,
                isCommunity,
              }
            : item,
        ),
      );
      setCommunityChoices((prev) => ({
        ...prev,
        [recordId]: isCommunity ? "yes" : "no",
      }));
      return true;
    } catch (error) {
      console.error(error);
      alert("保存“是否社区账目”失败");
      return false;
    } finally {
      setCommunitySavingId(null);
    }
  };

  const handleCommunityChoiceChange = async (record: FinanceRecord, nextChoice: CommunityChoice) => {
    const previousChoice = getCommunityChoice(record);

    setCommunityChoices((prev) => ({
      ...prev,
      [record.id]: nextChoice,
    }));

    if (!nextChoice) return;

    const ok = await persistCommunityChoice(record.id, nextChoice === "yes");
    if (!ok) {
      setCommunityChoices((prev) => ({
        ...prev,
        [record.id]: previousChoice,
      }));
    }
  };

  const handleExport = async () => {
    try {
      const typeFilter = table.getColumn("type")?.getFilterValue() as string;
      const statusFilter = table.getColumn("status")?.getFilterValue() as string;
      const projectFilter = table.getColumn("details")?.getFilterValue() as string;

      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (projectFilter) params.append("relatedProject", projectFilter);
      if (paymentStatusFilter) params.append("paymentStatus", paymentStatusFilter);

      const url = `/api/finance/admin/export${params.toString() ? `?${params.toString()}` : ""}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      alert("导出失败");
    }
  };

  const handleReview = async (record: FinanceRecord, status: "approved" | "rejected") => {
    const choice = getCommunityChoice(record);
    if (!choice) {
      alert("请先选择“是否社区账目”");
      return;
    }

    const selectedIsCommunity = choice === "yes";
    if (record.isCommunity !== selectedIsCommunity) {
      const synced = await persistCommunityChoice(record.id, selectedIsCommunity);
      if (!synced) return;
    }

    const reviewNote = prompt("请输入审核备注（可选）：");

    try {
      const res = await fetch(`/api/finance/${record.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });

      const result = await res.json();

      if (result.success) {
        alert("审核成功");
        await fetchData();
      } else {
        alert(result.error || "审核失败");
      }
    } catch (error) {
      console.error(error);
      alert("审核失败");
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
        await fetchData();
      } else {
        alert(result.error || "删除失败");
      }
    } catch (error) {
      console.error(error);
      alert("删除失败");
    }
  };

  const handleMarkPaid = async (id: string) => {
    const paymentDate = prompt("请输入支付日期（格式：YYYY-MM-DD），留空则使用当前日期：");

    try {
      const res = await fetch(`/api/finance/${id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentDate: paymentDate || undefined }),
      });

      const result = await res.json();

      if (result.success) {
        alert("标记成功");
        await fetchData();
      } else {
        alert(result.error || "操作失败");
      }
    } catch (error) {
      console.error(error);
      alert("操作失败");
    }
  };

  const ActionButtons = ({ record, compact = false }: { record: FinanceRecord; compact?: boolean }) => {
    const buttonSize = compact ? "h-8 px-2 text-xs" : "h-8 px-2.5 text-xs";
    const missingCommunityChoice = record.status === "pending" && !getCommunityChoice(record);

    return (
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className={cn(
              "rounded-lg border-border/60 bg-background shadow-none transition-all duration-200 active:scale-[0.98]",
              buttonSize,
            )}
          >
            <Link href={`/finance/edit/${record.id}`}>
              <Eye className="h-3.5 w-3.5" />
              查看
            </Link>
          </Button>

          {record.status === "pending" && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() => void handleReview(record, "approved")}
                disabled={missingCommunityChoice || communitySavingId === record.id}
                className={cn(
                  "rounded-lg bg-emerald-600 text-white shadow-none transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
                  buttonSize,
                )}
              >
                <Check className="h-3.5 w-3.5" />
                通过
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleReview(record, "rejected")}
                disabled={missingCommunityChoice || communitySavingId === record.id}
                className={cn(
                  "rounded-lg border-rose-200 bg-rose-50 text-rose-700 shadow-none transition-all duration-200 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
                  buttonSize,
                )}
              >
                <X className="h-3.5 w-3.5" />
                拒绝
              </Button>
            </>
          )}

          {record.status === "approved" && record.type === "expense" && record.paymentStatus === "unpaid" && (
            <Button
              type="button"
              size="sm"
              onClick={() => void handleMarkPaid(record.id)}
              className={cn(
                "rounded-lg bg-blue-600 text-white shadow-none transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]",
                buttonSize,
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              标记已支付
            </Button>
          )}
        </div>

        {missingCommunityChoice && (
          <p className="text-[11px] leading-4 text-amber-700">请先选择“是否社区账目”为是或否，再进行审核</p>
        )}
      </div>
    );
  };

  const DeleteButton = ({ record, compact = false }: { record: FinanceRecord; compact?: boolean }) => (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "icon"}
      onClick={() => void handleDelete(record.id)}
      className={cn(
        "border-rose-200 bg-rose-50 text-rose-700 shadow-none transition-all duration-200 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.98]",
        compact ? "h-8 px-2" : "h-9 w-9",
      )}
      title="删除"
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">删除</span>
    </Button>
  );

  const columns: ColumnDef<FinanceRecord>[] = [
    {
      id: "request",
      accessorFn: (row) => row.user.name,
      filterFn: (row, _columnId, filterValue) => {
        const search = String(filterValue || "")
          .trim()
          .toLowerCase();
        if (!search) return true;
        return (
          row.original.user.name.toLowerCase().includes(search) ||
          (row.original.user.phoneNumber || "").toLowerCase().includes(search)
        );
      },
      header: "申请信息",
      cell: ({ row }) => (
        <div className="min-w-[220px] space-y-1">
          <div className="text-sm font-semibold leading-tight">{row.original.user.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.user.phoneNumber || "-"}</div>
          <div className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</div>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span
              className={cn(
                "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
                typeClassMap[row.original.type] || "border-border/60 bg-muted/60 text-foreground",
              )}
            >
              {TYPE_LABELS[row.original.type]}
            </span>
            <span className="text-xs text-muted-foreground">{getCategoryLabel(row.original.category)}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        return row.getValue(columnId) === filterValue;
      },
      header: "类型",
      cell: () => null,
    },
    {
      accessorKey: "amount",
      header: "金额",
      cell: ({ row }) => (
        <div className="text-base font-semibold whitespace-nowrap">{formatCurrency(row.original.amount)}</div>
      ),
    },
    {
      id: "details",
      accessorFn: (row) => row.relatedProject || "",
      filterFn: (row, _columnId, filterValue) => {
        if (!filterValue) return true;
        const relatedProject = (row.original.relatedProject || "").trim();
        return relatedProject === String(filterValue).trim();
      },
      header: "项目 / 说明",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-[260px] space-y-1 text-sm">
          <p className="truncate text-foreground">项目：{row.original.relatedProject || "-"}</p>
          <p className="line-clamp-2 text-muted-foreground">说明：{row.original.description || "-"}</p>
        </div>
      ),
    },
    {
      accessorKey: "recipientName",
      header: "收款人",
      cell: ({ row }) => <div className="text-sm">{row.original.recipientName || "-"}</div>,
    },
    {
      accessorKey: "status",
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        return row.getValue(columnId) === filterValue;
      },
      header: "审核状态",
      cell: ({ row }) => (
        <div className="space-y-1">
          <span
            className={cn(
              "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
              statusClassMap[row.original.status] ||
                STATUS_LABELS[row.original.status]?.color ||
                "bg-muted text-foreground",
            )}
          >
            {STATUS_LABELS[row.original.status].label}
          </span>
          <div>
            {row.original.type === "income" ? (
              <span className="text-xs text-muted-foreground">支付状态：-</span>
            ) : (
              <span
                className={cn(
                  "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  row.original.paymentStatus === "paid"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-gray-200 bg-gray-50 text-gray-700",
                )}
              >
                {row.original.paymentStatus === "paid" ? "已支付" : "未支付"}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "communityChoice",
      header: "是否社区账目",
      enableSorting: false,
      cell: ({ row }) => {
        const record = row.original;
        const value = getCommunityChoice(record);
        return (
          <select
            value={value}
            onChange={(e) => void handleCommunityChoiceChange(record, e.target.value as CommunityChoice)}
            disabled={communitySavingId === record.id || record.status !== "pending"}
            className="h-9 min-w-[130px] rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">请选择</option>
            <option value="yes">是</option>
            <option value="no">否</option>
          </select>
        );
      },
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => <ActionButtons record={row.original} />,
    },
    {
      id: "delete",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DeleteButton record={row.original} />
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: paymentFilteredRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      columnVisibility: {
        type: false,
      },
      pagination: {
        pageSize: 20,
      },
    },
  });

  if (loading) {
    return (
      <div className="space-y-3 md:space-y-4">
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="px-4 py-4 sm:px-5">
            <p className="text-sm text-muted-foreground">正在加载审核后台数据...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pagedRows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const filteredRecords = table.getFilteredRowModel().rows.map((row) => row.original);
  const pageCount = table.getPageCount();
  const currentPage = pageCount === 0 ? 0 : table.getState().pagination.pageIndex + 1;
  const summaryCounts = filteredRecords.reduce(
    (acc, record) => {
      if (record.status === "pending") acc.pending += 1;
      if (record.status === "approved") acc.approved += 1;
      if (record.status === "rejected") acc.rejected += 1;
      if (record.type === "expense") {
        if (record.paymentStatus === "paid") {
          acc.paid += 1;
        } else {
          acc.unpaid += 1;
        }
      }
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, paid: 0, unpaid: 0 },
  );

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="space-y-3 px-1">
        <FinanceBreadcrumb items={[{ label: "财务系统", href: "/finance" }, { label: "审核后台" }]} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">审核后台</h1>
          </div>
          <p className="text-sm text-muted-foreground">集中处理财务申请审核，支持筛选、导出与状态流转。</p>
        </div>
      </section>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">筛选条件</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                按类型、审核状态、支付状态、项目/活动和申请人快速过滤记录
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
              <Download className="h-3.5 w-3.5" />
              导出CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 pt-0 sm:px-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">类型</span>
              <select
                value={(table.getColumn("type")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("type")?.setFilterValue(e.target.value || undefined)}
                className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
              >
                <option value="">全部类型</option>
                <option value="income">收入</option>
                <option value="expense">支出</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">状态</span>
              <select
                value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("status")?.setFilterValue(e.target.value || undefined)}
                className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
              >
                <option value="">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="rejected">已拒绝</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">支付状态</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter((e.target.value || "") as PaymentStatusFilter)}
                className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
              >
                <option value="">全部支付状态</option>
                <option value="paid">已支付（支出）</option>
                <option value="unpaid">未支付（支出）</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">项目/活动</span>
              <select
                value={(table.getColumn("details")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("details")?.setFilterValue(e.target.value || undefined)}
                className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
              >
                <option value="">全部项目/活动</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.name}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">申请人搜索</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={(table.getColumn("request")?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn("request")?.setFilterValue(e.target.value)}
                  placeholder="姓名或手机号"
                  className="h-9 border-border/60 pl-8 text-xs"
                />
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">申请记录</CardTitle>
            <Badge variant="outline" className="rounded-full border-border/60 bg-muted/40 text-[11px]">
              共 {filteredCount} 条
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
              <p className="text-[11px] text-amber-700">待审核</p>
              <p className="mt-1 text-lg font-semibold text-amber-800">{summaryCounts.pending}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2">
              <p className="text-[11px] text-emerald-700">已通过</p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">{summaryCounts.approved}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
              <p className="text-[11px] text-rose-700">已拒绝</p>
              <p className="mt-1 text-lg font-semibold text-rose-800">{summaryCounts.rejected}</p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2">
              <p className="text-[11px] text-sky-700">已支付（支出）</p>
              <p className="mt-1 text-lg font-semibold text-sky-800">{summaryCounts.paid}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
              <p className="text-[11px] text-slate-700">未支付（支出）</p>
              <p className="mt-1 text-lg font-semibold text-slate-800">{summaryCounts.unpaid}</p>
            </div>
          </div>

          <div className="md:hidden">
            {pagedRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                暂无符合条件的记录
              </div>
            ) : (
              <div className="space-y-2">
                {pagedRows.map((row) => {
                  const record = row.original;
                  const communityChoice = getCommunityChoice(record);

                  return (
                    <div key={record.id} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm leading-tight font-semibold">{record.user.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {record.user.phoneNumber || "-"} · {formatDate(record.createdAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                            statusClassMap[record.status] ||
                              STATUS_LABELS[record.status]?.color ||
                              "bg-muted text-foreground",
                          )}
                        >
                          {STATUS_LABELS[record.status].label}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium",
                              typeClassMap[record.type] || "border-border/60 bg-muted/60 text-foreground",
                            )}
                          >
                            {TYPE_LABELS[record.type]}
                          </span>
                          <span className="text-xs text-muted-foreground">{getCategoryLabel(record.category)}</span>
                        </div>
                        <p className="text-base font-semibold">{formatCurrency(record.amount)}</p>
                      </div>

                      <div className="mt-2 rounded-lg bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
                        <p className="truncate">项目：{record.relatedProject || "-"}</p>
                        <p className="mt-1 line-clamp-2">说明：{record.description || "-"}</p>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <label className="space-y-1">
                          <span className="text-[11px] font-medium text-muted-foreground">是否社区账目</span>
                          <select
                            value={communityChoice}
                            onChange={(e) =>
                              void handleCommunityChoiceChange(record, e.target.value as CommunityChoice)
                            }
                            disabled={communitySavingId === record.id || record.status !== "pending"}
                            className="h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <option value="">请选择</option>
                            <option value="yes">是</option>
                            <option value="no">否</option>
                          </select>
                        </label>
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-muted-foreground">支付状态</span>
                          <div>
                            {record.type === "income" ? (
                              <span className="text-xs text-muted-foreground">-</span>
                            ) : (
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                  record.paymentStatus === "paid"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-gray-200 bg-gray-50 text-gray-700",
                                )}
                              >
                                {record.paymentStatus === "paid" ? "已支付" : "未支付"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-start justify-between gap-2 border-t border-border/50 pt-2">
                        <ActionButtons record={record} compact />
                        <DeleteButton record={record} compact />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1120px] border-separate border-spacing-0">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-b border-border/60 bg-muted/40 px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            className={cn(
                              "inline-flex select-none items-center gap-1",
                              header.column.getCanSort() ? "transition-colors hover:text-foreground" : "cursor-default",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!header.column.getCanSort()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: "↑",
                              desc: "↓",
                            }[header.column.getIsSorted() as string] ?? null}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      暂无符合条件的记录
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row) => (
                    <tr key={row.id} className="align-top hover:bg-muted/20">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="border-b border-border/40 px-3 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              第 {currentPage} / {pageCount} 页
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 rounded-lg border-border/60 px-2.5 text-xs"
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 rounded-lg border-border/60 px-2.5 text-xs"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
