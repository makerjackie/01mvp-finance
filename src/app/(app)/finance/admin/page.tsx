"use client";

import { useEffect, useState } from "react";
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
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
  Eye,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { TYPE_LABELS, STATUS_LABELS, getCategoryLabel } from "@/lib/finance-config";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  attachments?: any[];
}

interface Stats {
  company: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  community: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [viewMode, setViewMode] = useState<"company" | "community">("company");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recordsRes, statsRes] = await Promise.all([
        fetch("/api/finance/admin/all"),
        fetch("/api/finance/admin/stats"),
      ]);

      const recordsResult = await recordsRes.json();
      const statsResult = await statsRes.json();

      if (recordsResult.success) {
        setRecords(recordsResult.data);
      }
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const typeFilter = table.getColumn("type")?.getFilterValue() as string;
      const statusFilter = table.getColumn("status")?.getFilterValue() as string;
      const isCommunityFilter = table.getColumn("isCommunity")?.getFilterValue() as string;

      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (isCommunityFilter) {
        params.append("isCommunity", isCommunityFilter === "community" ? "true" : "false");
      }

      const url = `/api/finance/admin/export${params.toString() ? `?${params.toString()}` : ""}`;
      window.open(url, "_blank");
    } catch (error) {
      console.error(error);
      alert("导出失败");
    }
  };

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    const reviewNote = prompt("请输入审核备注（可选）：");

    try {
      const res = await fetch(`/api/finance/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
      });

      const result = await res.json();

      if (result.success) {
        alert("审核成功");
        fetchData();
      } else {
        alert(result.error || "审核失败");
      }
    } catch (error) {
      console.error(error);
      alert("审核失败");
    }
  };

  const handleToggleCommunity = async (id: string, currentValue: boolean) => {
    if (!confirm(`确定要将此记录标记为${currentValue ? "公司" : "社区"}账目吗？`)) return;

    try {
      const res = await fetch(`/api/finance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCommunity: !currentValue }),
      });

      const result = await res.json();

      if (result.success) {
        alert("修改成功");
        fetchData();
      } else {
        alert(result.error || "修改失败");
      }
    } catch (error) {
      console.error(error);
      alert("修改失败");
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
        fetchData();
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
        fetchData();
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

    return (
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
              onClick={() => handleReview(record.id, "approved")}
              className={cn(
                "rounded-lg bg-emerald-600 text-white shadow-none transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98]",
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
              onClick={() => handleReview(record.id, "rejected")}
              className={cn(
                "rounded-lg border-rose-200 bg-rose-50 text-rose-700 shadow-none transition-all duration-200 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.98]",
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
            onClick={() => handleMarkPaid(record.id)}
            className={cn(
              "rounded-lg bg-blue-600 text-white shadow-none transition-all duration-200 hover:bg-blue-700 active:scale-[0.98]",
              buttonSize,
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            标记已支付
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleDelete(record.id)}
          className={cn(
            "rounded-lg border-rose-200 bg-rose-50 text-rose-700 shadow-none transition-all duration-200 hover:bg-rose-100 hover:text-rose-700 active:scale-[0.98]",
            buttonSize,
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          删除
        </Button>
      </div>
    );
  };

  const columns: ColumnDef<FinanceRecord>[] = [
    {
      accessorKey: "createdAt",
      header: "提交时间",
      cell: ({ row }) => (
        <span className="text-xs whitespace-nowrap text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: "applicant",
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
      header: "申请人",
      cell: ({ row }) => (
        <div className="text-sm leading-tight">
          <div className="font-medium">{row.original.user.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.user.phoneNumber || "—"}</div>
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
      cell: ({ row }) => (
        <span
          className={cn(
            "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
            typeClassMap[row.original.type] || "border-border/60 bg-muted/60 text-foreground",
          )}
        >
          {TYPE_LABELS[row.original.type]}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "类别",
      cell: ({ row }) => <div className="text-sm whitespace-nowrap">{getCategoryLabel(row.original.category)}</div>,
    },
    {
      accessorKey: "amount",
      header: "金额",
      cell: ({ row }) => (
        <div className="text-sm font-semibold whitespace-nowrap">{formatCurrency(row.original.amount)}</div>
      ),
    },
    {
      accessorKey: "isCommunity",
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        const isCommunity = row.getValue<boolean>(columnId);
        return filterValue === "community" ? isCommunity : !isCommunity;
      },
      header: "账目",
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleToggleCommunity(row.original.id, row.original.isCommunity)}
          className={cn(
            "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all duration-200 active:scale-[0.98]",
            row.original.isCommunity
              ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted",
          )}
        >
          {row.original.isCommunity ? "社区" : "公司"}
        </button>
      ),
    },
    {
      accessorKey: "relatedProject",
      header: "项目",
      cell: ({ row }) => <div className="max-w-[150px] truncate text-sm">{row.original.relatedProject || "-"}</div>,
    },
    {
      accessorKey: "description",
      header: "说明",
      cell: ({ row }) => (
        <div className="max-w-[220px] truncate text-sm" title={row.original.description}>
          {row.original.description}
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
      header: "状态",
      cell: ({ row }) => (
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
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "支付状态",
      cell: ({ row }) => {
        if (row.original.type === "income") return <span className="text-xs text-muted-foreground">-</span>;
        return (
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
        );
      },
    },
    {
      id: "actions",
      header: "操作",
      enableSorting: false,
      cell: ({ row }) => <ActionButtons record={row.original} />,
    },
  ];

  const table = useReactTable({
    data: records,
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
            <p className="text-sm text-muted-foreground">正在加载管理员后台数据...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStats = viewMode === "company" ? stats?.company : stats?.community;
  const pagedRows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const currentPage = pageCount === 0 ? 0 : table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-3 md:space-y-5">
      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="space-y-2 px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <Button asChild variant="ghost" size="sm" className="h-8 rounded-lg px-2 text-muted-foreground">
              <Link href="/finance">
                <ArrowLeft className="h-3.5 w-3.5" />
                返回
              </Link>
            </Button>
            <Badge variant="outline" className="rounded-full border-border/60 bg-muted/50 text-xs">
              Finance Admin
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">管理员后台</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              审核申请、查看统计、管理账目归属。移动端采用紧凑布局，便于快速处理。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="px-3 py-3 sm:px-4 sm:py-4">
          <div className="inline-flex w-full rounded-xl border border-border/60 bg-muted/40 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode("company")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.98] sm:min-w-[130px]",
                viewMode === "company"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <ArrowDownRight className="h-3.5 w-3.5" />
              公司账目
            </button>
            <button
              type="button"
              onClick={() => setViewMode("community")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.98] sm:min-w-[130px]",
                viewMode === "community"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              社区账目
            </button>
          </div>
        </CardContent>
      </Card>

      {currentStats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
            <CardContent className="px-3 py-3">
              <p className="text-[11px] text-muted-foreground">总收入</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600 sm:text-base">
                {formatCurrency(currentStats.totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
            <CardContent className="px-3 py-3">
              <p className="text-[11px] text-muted-foreground">总支出</p>
              <p className="mt-1 text-sm font-semibold text-rose-600 sm:text-base">
                {formatCurrency(currentStats.totalExpense)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
            <CardContent className="px-3 py-3">
              <p className="text-[11px] text-muted-foreground">余额</p>
              <p className="mt-1 text-sm font-semibold text-primary sm:text-base">
                {formatCurrency(currentStats.balance)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
            <CardContent className="flex items-center justify-between px-3 py-3">
              <div>
                <p className="text-[11px] text-muted-foreground">待审核</p>
                <p className="mt-1 text-sm font-semibold">{stats?.pendingCount ?? 0}</p>
              </div>
              <Badge className="rounded-full border-amber-200 bg-amber-50 px-2 py-0 text-[11px] text-amber-700">
                <RefreshCcw className="mr-1 h-3 w-3" />
                待办
              </Badge>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
            <CardContent className="flex items-center justify-between px-3 py-3">
              <div>
                <p className="text-[11px] text-muted-foreground">已通过</p>
                <p className="mt-1 text-sm font-semibold">{stats?.approvedCount ?? 0}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/60 bg-card shadow-sm">
            <CardContent className="flex items-center justify-between px-3 py-3">
              <div>
                <p className="text-[11px] text-muted-foreground">已拒绝</p>
                <p className="mt-1 text-sm font-semibold">{stats?.rejectedCount ?? 0}</p>
              </div>
              <XCircle className="h-4 w-4 text-rose-600" />
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">筛选条件</CardTitle>
              <CardDescription className="text-xs sm:text-sm">按类型、状态、账目和申请人快速过滤记录</CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
              <Download className="h-3.5 w-3.5" />
              导出CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 pt-0 sm:px-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
              <span className="text-[11px] font-medium text-muted-foreground">账目归属</span>
              <select
                value={(table.getColumn("isCommunity")?.getFilterValue() as string) ?? ""}
                onChange={(e) => table.getColumn("isCommunity")?.setFilterValue(e.target.value || undefined)}
                className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
              >
                <option value="">全部账目</option>
                <option value="community">社区账目</option>
                <option value="company">公司账目</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">申请人搜索</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={(table.getColumn("applicant")?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn("applicant")?.setFilterValue(e.target.value)}
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
          <div className="md:hidden">
            {pagedRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                暂无符合条件的记录
              </div>
            ) : (
              <div className="space-y-2">
                {pagedRows.map((row) => {
                  const record = row.original;
                  return (
                    <div key={record.id} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm leading-tight font-medium">{record.user.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDate(record.createdAt)}</p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full border px-2 py-0 text-[10px]",
                            statusClassMap[record.status] ||
                              STATUS_LABELS[record.status]?.color ||
                              "bg-muted text-foreground",
                          )}
                        >
                          {STATUS_LABELS[record.status].label}
                        </Badge>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                        <p className="text-muted-foreground">
                          类型：<span className="text-foreground">{TYPE_LABELS[record.type]}</span>
                        </p>
                        <p className="text-muted-foreground">
                          金额：<span className="font-semibold text-foreground">{formatCurrency(record.amount)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          分类：
                          <span className="text-foreground">{getCategoryLabel(record.category)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          账目：<span className="text-foreground">{record.isCommunity ? "社区" : "公司"}</span>
                        </p>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{record.description}</p>

                      <div className="mt-2 border-t border-border/50 pt-2">
                        <ActionButtons record={record} compact />
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
                    <tr key={row.id} className="border-b border-border/40">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="border-b border-border/40 px-3 py-2 align-top">
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
