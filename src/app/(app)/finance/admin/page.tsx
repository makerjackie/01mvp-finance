"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, Download, Eye, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { APPLICATION_TYPES, FINANCE_CATEGORIES, STATUS_LABELS, getCategoryLabel } from "@/lib/finance-config";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";
import { authClient } from "@/lib/auth-client";
import { resolveRole } from "@/lib/rbac";

interface FinanceRecord {
  id: string;
  type: string;
  category: string;
  subcategory?: string | null;
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
  recipientBank?: string;
  transactionNo?: string;
  transactionDate?: string;
  summary?: string;
  purpose?: string;
  formPayload?: Record<string, unknown> | null;
}

interface ProjectOption {
  id: string;
  name: string;
  createdAt: string;
}

type CommunityChoice = "" | "yes" | "no";
type PaymentStatusFilter = "" | "paid" | "unpaid";
type TypeFilter = "" | "income" | "expense";
type StatusFilter = "" | "pending" | "approved" | "rejected";

const PAGE_SIZE = 12;

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

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    hour12: false,
  });

const statusClassMap: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function AdminPage() {
  const { data: sessionData } = authClient.useSession();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseCategoryLabelMap, setExpenseCategoryLabelMap] = useState<Record<string, string>>({});

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>("");
  const [projectFilter, setProjectFilter] = useState("");
  const [applicantQuery, setApplicantQuery] = useState("");

  const [communityChoices, setCommunityChoices] = useState<Record<string, CommunityChoice>>({});
  const [communitySavingId, setCommunitySavingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [projectOptions, setProjectOptions] = useState<ProjectOption[]>([]);

  const [page, setPage] = useState(1);

  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState("");
  const [paymentDateInput, setPaymentDateInput] = useState("");

  const viewerUserId = sessionData?.user?.id;
  const viewerRole = resolveRole((sessionData?.user as { role?: string | null } | undefined)?.role);

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, paymentStatusFilter, projectFilter, applicantQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, projectOptionsRes, expenseCategoryRes] = await Promise.all([
        fetch("/api/finance/admin/all"),
        fetch("/api/finance/admin/project-options"),
        fetch("/api/finance/expense-categories"),
      ]);

      const recordsResult = await recordsRes.json();
      const projectOptionsResult = await projectOptionsRes.json();
      const expenseCategoryResult = await expenseCategoryRes.json();

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
      alert("加载审核数据失败");
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const normalizedQuery = applicantQuery.trim().toLowerCase();

    return records.filter((record) => {
      if (typeFilter && record.type !== typeFilter) return false;
      if (statusFilter && record.status !== statusFilter) return false;
      if (paymentStatusFilter && !(record.type === "expense" && record.paymentStatus === paymentStatusFilter)) {
        return false;
      }
      if (projectFilter && (record.relatedProject || "").trim() !== projectFilter.trim()) return false;
      if (normalizedQuery) {
        const name = record.user.name.toLowerCase();
        const phone = (record.user.phoneNumber || "").toLowerCase();
        if (!name.includes(normalizedQuery) && !phone.includes(normalizedQuery)) {
          return false;
        }
      }
      return true;
    });
  }, [records, typeFilter, statusFilter, paymentStatusFilter, projectFilter, applicantQuery]);

  const summaryCounts = useMemo(
    () =>
      filteredRecords.reduce(
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
      ),
    [filteredRecords],
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === activeRecordId) || null,
    [records, activeRecordId],
  );

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

  const handleExport = () => {
    try {
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

  const handleReview = async (record: FinanceRecord, status: "approved" | "rejected", reviewNote?: string) => {
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

    const loadingKey = `${record.id}:review:${status}`;
    setActionLoading(loadingKey);

    try {
      const res = await fetch(`/api/finance/${record.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNote: reviewNote?.trim() || undefined }),
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaid = async (id: string, paymentDate?: string) => {
    const loadingKey = `${id}:mark-paid`;
    setActionLoading(loadingKey);

    try {
      const res = await fetch(`/api/finance/${id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentDate: paymentDate?.trim() || undefined }),
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (record: FinanceRecord) => {
    if (!confirm("确定要删除这条申请记录吗？")) return;

    const loadingKey = `${record.id}:delete`;
    setActionLoading(loadingKey);

    try {
      const res = await fetch(`/api/finance/${record.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        alert("删除成功");
        closeRecordDialog();
        await fetchData();
      } else {
        alert(result.error || "删除失败");
      }
    } catch (error) {
      console.error(error);
      alert("删除失败");
    } finally {
      setActionLoading(null);
    }
  };

  const canDeleteRecord = (record: FinanceRecord) => {
    if (!viewerUserId) return false;
    if (viewerRole === "admin") return true;
    return record.status === "pending" && record.user.id === viewerUserId;
  };

  const openRecordDialog = (record: FinanceRecord) => {
    setActiveRecordId(record.id);
    setReviewNoteInput(record.reviewNote || "");
    setPaymentDateInput("");
  };

  const closeRecordDialog = () => {
    setActiveRecordId(null);
    setReviewNoteInput("");
    setPaymentDateInput("");
  };

  const isModalBusy =
    Boolean(selectedRecord && actionLoading?.startsWith(`${selectedRecord.id}:`)) ||
    Boolean(selectedRecord && communitySavingId === selectedRecord.id);

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
      <div className="space-y-3 md:space-y-4">
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="px-4 py-4 sm:px-5">
            <p className="text-sm text-muted-foreground">正在加载审核后台数据...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="space-y-3 px-1">
        <FinanceBreadcrumb items={[{ label: "财务系统", href: "/finance" }, { label: "审核后台" }]} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight">审核后台</h1>
          </div>
          <p className="text-sm text-muted-foreground">列表仅展示关键信息，点击“查看”进入详情弹窗执行审核操作。</p>
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
                value={typeFilter}
                onChange={(e) => setTypeFilter((e.target.value || "") as TypeFilter)}
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
                value={statusFilter}
                onChange={(e) => setStatusFilter((e.target.value || "") as StatusFilter)}
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
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value || "")}
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
                  value={applicantQuery}
                  onChange={(e) => setApplicantQuery(e.target.value)}
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
              共 {filteredRecords.length} 条
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

          {pagedRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              暂无符合条件的记录
            </div>
          ) : (
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
                      申请人
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
                  {pagedRecords.map((record) => (
                    <tr key={record.id} className="align-middle hover:bg-muted/20">
                      <td className="border-b border-border/40 px-4 py-3">
                        <span className="text-sm text-foreground">{getCategoryLabel(record.category)}</span>
                      </td>
                      <td className="border-b border-border/40 px-4 py-3">
                        <span className="text-sm text-foreground">{getPaymentNatureLabel(record)}</span>
                      </td>
                      <td className="border-b border-border/40 px-4 py-3">
                        <p className="text-sm text-foreground">{record.user.name}</p>
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openRecordDialog(record)}
                          className="h-8 gap-1.5 rounded-lg border-border/60 bg-background px-2.5 text-xs shadow-none"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </Button>
                      </td>
                      <td className="border-b border-border/40 px-4 py-3 text-right">
                        {canDeleteRecord(record) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void handleDelete(record)}
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
          )}

          <div className="flex flex-col gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              第 {currentPage} / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
                className="h-8 rounded-lg border-border/60 px-2.5 text-xs"
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 rounded-lg border-border/60 px-2.5 text-xs"
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(activeRecordId)} onOpenChange={(open) => (!open ? closeRecordDialog() : undefined)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
            <DialogDescription>在弹窗内查看完整信息并执行审核、拒绝、标记支付等操作。</DialogDescription>
          </DialogHeader>

          {!selectedRecord ? (
            <div className="py-6 text-sm text-muted-foreground">记录不存在或已被更新，请关闭后重试。</div>
          ) : (
            <div className="space-y-4">
              <section className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">申请人</p>
                    <p className="font-medium">{selectedRecord.user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">手机号</p>
                    <p className="font-medium">{selectedRecord.user.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">提交时间</p>
                    <p className="font-medium">{formatDateTime(selectedRecord.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">金额</p>
                    <p className="font-medium">{formatCurrency(selectedRecord.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">申请类别</p>
                    <p className="font-medium">{getCategoryLabel(selectedRecord.category)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">款项性质</p>
                    <p className="font-medium">{getPaymentNatureLabel(selectedRecord)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">项目/活动</p>
                    <p className="font-medium">{selectedRecord.relatedProject || "-"}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">说明</p>
                  <p className="rounded-md border border-border/60 bg-background px-3 py-2">
                    {selectedRecord.description || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">收款人</p>
                    <p className="rounded-md border border-border/60 bg-background px-3 py-2">
                      {selectedRecord.recipientName || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">收款账号</p>
                    <p className="rounded-md border border-border/60 bg-background px-3 py-2">
                      {selectedRecord.recipientAccount || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">开户行</p>
                    <p className="rounded-md border border-border/60 bg-background px-3 py-2">
                      {selectedRecord.recipientBank || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">交易流水号</p>
                    <p className="rounded-md border border-border/60 bg-background px-3 py-2">
                      {selectedRecord.transactionNo || "-"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">审核状态</p>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      statusClassMap[selectedRecord.status] ||
                        STATUS_LABELS[selectedRecord.status]?.color ||
                        "bg-muted text-foreground",
                    )}
                  >
                    {STATUS_LABELS[selectedRecord.status]?.label || selectedRecord.status}
                  </span>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">支付状态</p>
                  {selectedRecord.type === "income" ? (
                    <p className="text-sm text-muted-foreground">-</p>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        selectedRecord.paymentStatus === "paid"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-gray-200 bg-gray-50 text-gray-700",
                      )}
                    >
                      {selectedRecord.paymentStatus === "paid" ? "已支付" : "未支付"}
                    </span>
                  )}
                </div>

                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">是否社区账目</Label>
                  <select
                    value={getCommunityChoice(selectedRecord)}
                    onChange={(e) =>
                      void handleCommunityChoiceChange(selectedRecord, e.target.value as CommunityChoice)
                    }
                    disabled={selectedRecord.status !== "pending" || communitySavingId === selectedRecord.id}
                    className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-sm outline-none transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">请选择</option>
                    <option value="yes">是</option>
                    <option value="no">否</option>
                  </select>
                  {selectedRecord.status !== "pending" && (
                    <p className="mt-1 text-[11px] text-muted-foreground">已审核记录不可修改账目归属。</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="payment-date" className="mb-1 block text-xs text-muted-foreground">
                    标记支付日期（可选）
                  </Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={paymentDateInput}
                    onChange={(e) => setPaymentDateInput(e.target.value)}
                    disabled={
                      !(
                        selectedRecord.status === "approved" &&
                        selectedRecord.type === "expense" &&
                        selectedRecord.paymentStatus === "unpaid"
                      )
                    }
                    className="h-9 border-border/60 text-sm"
                  />
                </div>
              </section>

              <section>
                <Label htmlFor="review-note" className="mb-1 block text-xs text-muted-foreground">
                  审核备注（可选）
                </Label>
                <Textarea
                  id="review-note"
                  value={reviewNoteInput}
                  onChange={(e) => setReviewNoteInput(e.target.value)}
                  placeholder="填写通过/拒绝原因，便于追踪"
                  className="min-h-[90px] border-border/60 text-sm"
                  disabled={selectedRecord.status !== "pending"}
                />
              </section>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={closeRecordDialog} disabled={isModalBusy}>
              关闭
            </Button>

            {selectedRecord && (
              <div className="flex flex-wrap justify-end gap-2">
                {selectedRecord.status === "pending" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleDelete(selectedRecord)}
                    disabled={isModalBusy}
                    className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    删除
                  </Button>
                )}

                {selectedRecord.status === "pending" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleReview(selectedRecord, "rejected", reviewNoteInput)}
                      disabled={isModalBusy}
                      className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-700"
                    >
                      <X className="mr-1.5 h-4 w-4" />
                      拒绝
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleReview(selectedRecord, "approved", reviewNoteInput)}
                      disabled={isModalBusy}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="mr-1.5 h-4 w-4" />
                      审核通过
                    </Button>
                  </>
                )}

                {selectedRecord.status === "approved" &&
                  selectedRecord.type === "expense" &&
                  selectedRecord.paymentStatus === "unpaid" && (
                    <Button
                      type="button"
                      onClick={() => void handleMarkPaid(selectedRecord.id, paymentDateInput)}
                      disabled={isModalBusy}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      标记已支付
                    </Button>
                  )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
