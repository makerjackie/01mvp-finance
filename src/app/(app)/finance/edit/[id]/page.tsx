"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Loader2, Save, ShieldAlert } from "lucide-react";
import { FINANCE_CATEGORIES, TYPE_LABELS, getCategoryLabel, STATUS_LABELS } from "@/lib/finance-config";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";

type FinanceType = "income" | "expense";

type Attachment = {
  key: string;
  url: string;
  name: string;
};

interface FinanceRecord {
  id: string;
  type: FinanceType;
  category: string;
  amount: number;
  relatedProject?: string;
  description: string;
  status: string;
  paymentStatus?: string;
  paymentDate?: string;
  createdAt: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
  recipientIdCard?: string;
  transactionNo?: string;
  transactionDate?: string;
  summary?: string;
  purpose?: string;
  accountPeriod?: string;
  taxHandling?: string;
  reviewNote?: string;
  reviewedAt?: string;
  attachments?: Attachment[];
}

type EditFormData = {
  type: FinanceType;
  category: string;
  amount: string;
  relatedProject: string;
  description: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  recipientIdCard: string;
  transactionNo: string;
  transactionDate: string;
  summary: string;
  purpose: string;
  accountPeriod: string;
  taxHandling: string;
};

const statusClassMap: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const defaultFormData: EditFormData = {
  type: "income",
  category: "",
  amount: "",
  relatedProject: "",
  description: "",
  recipientName: "",
  recipientAccount: "",
  recipientBank: "",
  recipientIdCard: "",
  transactionNo: "",
  transactionDate: "",
  summary: "",
  purpose: "",
  accountPeriod: "",
  taxHandling: "",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function EditRecordPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<FinanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EditFormData>(defaultFormData);

  const fetchRecord = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/${id}`);
      const result = await res.json();
      if (result.success) {
        const data = result.data as FinanceRecord;
        setRecord(data);
        setFormData({
          type: data.type,
          category: data.category,
          amount: String(data.amount),
          relatedProject: data.relatedProject || "",
          description: data.description || "",
          recipientName: data.recipientName || "",
          recipientAccount: data.recipientAccount || "",
          recipientBank: data.recipientBank || "",
          recipientIdCard: data.recipientIdCard || "",
          transactionNo: data.transactionNo || "",
          transactionDate: data.transactionDate ? data.transactionDate.slice(0, 10) : "",
          summary: data.summary || "",
          purpose: data.purpose || "",
          accountPeriod: data.accountPeriod || "",
          taxHandling: data.taxHandling || "",
        });
      } else {
        alert(result.error || "加载失败");
        router.push("/finance/my-records");
      }
    } catch (error) {
      console.error(error);
      alert("加载失败");
      router.push("/finance/my-records");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  const updateField = <K extends keyof EditFormData>(key: K, value: EditFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        relatedProject: formData.relatedProject || undefined,
        description: formData.description,
        recipientName: formData.recipientName || undefined,
        recipientAccount: formData.recipientAccount || undefined,
        recipientBank: formData.recipientBank || undefined,
        recipientIdCard: formData.recipientIdCard || undefined,
        transactionNo: formData.transactionNo || undefined,
        transactionDate: formData.transactionDate || undefined,
        summary: formData.summary || undefined,
        purpose: formData.purpose || undefined,
        accountPeriod: formData.accountPeriod || undefined,
        taxHandling: formData.taxHandling || undefined,
      };

      const res = await fetch(`/api/finance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert("保存成功！");
        router.push("/finance/my-records");
      } else {
        alert(result.error || "保存失败");
      }
    } catch (error) {
      console.error(error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="px-4 py-4 sm:px-5">
          <p className="text-sm text-muted-foreground">正在加载记录...</p>
        </CardContent>
      </Card>
    );
  }

  if (!record) {
    return null;
  }

  const canEdit = record.status === "pending";
  const categories = FINANCE_CATEGORIES[formData.type];

  return (
    <div className="space-y-3 md:space-y-5">
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="space-y-2 px-4 py-4 sm:px-5">
          <FinanceBreadcrumb
            items={[
              { label: "财务系统", href: "/finance" },
              { label: "我的记录", href: "/finance/my-records" },
              { label: "编辑记录" },
            ]}
          />

          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
                {TYPE_LABELS[record.type]} · {getCategoryLabel(record.category)}
              </CardTitle>
              <CardDescription className="text-xs">提交时间：{formatDateTime(record.createdAt)}</CardDescription>
            </div>
            <Badge
              className={cn(
                "rounded-full border px-2 py-0 text-[11px]",
                statusClassMap[record.status] || STATUS_LABELS[record.status]?.color || "bg-muted text-foreground",
              )}
            >
              {STATUS_LABELS[record.status]?.label || record.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {!canEdit && (
        <Card className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
          <CardContent className="space-y-1 px-4 py-3 text-xs text-amber-800 sm:text-sm">
            <p className="flex items-center gap-1 font-medium">
              <ShieldAlert className="h-4 w-4" />
              此记录已审核，当前为只读模式
            </p>
            {record.reviewNote && <p>审核备注：{record.reviewNote}</p>}
            {record.reviewedAt && <p>审核时间：{formatDateTime(record.reviewedAt)}</p>}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
        <Card className="rounded-xl border border-border/60 shadow-sm">
          <CardHeader className="px-4 py-3 sm:px-5">
            <CardTitle className="text-base">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 px-4 pb-4 pt-0 sm:px-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">类型</Label>
                <select
                  disabled={!canEdit}
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value as FinanceType, category: "" }))
                  }
                  className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">类别</Label>
                <select
                  disabled={!canEdit}
                  value={formData.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">请选择类别</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">金额（元）</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  disabled={!canEdit}
                  value={formData.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  className="h-9 border-border/60 text-xs disabled:opacity-60"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">关联项目/活动名称</Label>
                <Input
                  disabled={!canEdit}
                  value={formData.relatedProject}
                  onChange={(e) => updateField("relatedProject", e.target.value)}
                  className="h-9 border-border/60 text-xs disabled:opacity-60"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">详细说明</Label>
              <Textarea
                required
                disabled={!canEdit}
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="min-h-[92px] border-border/60 px-2.5 py-2 text-xs disabled:opacity-60"
              />
            </div>
          </CardContent>
        </Card>

        {formData.type === "expense" && (
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">收款信息（支出）</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 px-4 pb-4 pt-0 sm:grid-cols-2 sm:px-5">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">收款人/供应商名称</Label>
                <Input
                  disabled={!canEdit}
                  value={formData.recipientName}
                  onChange={(e) => updateField("recipientName", e.target.value)}
                  className="h-9 border-border/60 text-xs disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">收款账号</Label>
                <Input
                  disabled={!canEdit}
                  value={formData.recipientAccount}
                  onChange={(e) => updateField("recipientAccount", e.target.value)}
                  className="h-9 border-border/60 text-xs disabled:opacity-60"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">收款人开户行</Label>
                <Input
                  disabled={!canEdit}
                  value={formData.recipientBank}
                  onChange={(e) => updateField("recipientBank", e.target.value)}
                  className="h-9 border-border/60 text-xs disabled:opacity-60"
                />
              </div>

              {formData.category === "salary" && (
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">收款人身份证号</Label>
                  <Input
                    disabled={!canEdit}
                    value={formData.recipientIdCard}
                    onChange={(e) => updateField("recipientIdCard", e.target.value)}
                    className="h-9 border-border/60 text-xs disabled:opacity-60"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-xl border border-border/60 shadow-sm">
          <CardHeader className="px-4 py-3 sm:px-5">
            <CardTitle className="text-base">银行流水信息（可选）</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 px-4 pb-4 pt-0 sm:grid-cols-2 sm:px-5">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">流水号</Label>
              <Input
                disabled={!canEdit}
                value={formData.transactionNo}
                onChange={(e) => updateField("transactionNo", e.target.value)}
                className="h-9 border-border/60 text-xs disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">交易日期</Label>
              <Input
                type="date"
                disabled={!canEdit}
                value={formData.transactionDate}
                onChange={(e) => updateField("transactionDate", e.target.value)}
                className="h-9 border-border/60 text-xs disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">摘要</Label>
              <Input
                disabled={!canEdit}
                value={formData.summary}
                onChange={(e) => updateField("summary", e.target.value)}
                className="h-9 border-border/60 text-xs disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">用途</Label>
              <Input
                disabled={!canEdit}
                value={formData.purpose}
                onChange={(e) => updateField("purpose", e.target.value)}
                className="h-9 border-border/60 text-xs disabled:opacity-60"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">账期</Label>
              <Input
                type="month"
                disabled={!canEdit}
                value={formData.accountPeriod}
                onChange={(e) => updateField("accountPeriod", e.target.value)}
                className="h-9 border-border/60 text-xs disabled:opacity-60"
              />
            </div>

            {formData.type === "expense" && formData.category === "salary" && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">个人所得税处理</Label>
                <select
                  disabled={!canEdit}
                  value={formData.taxHandling}
                  onChange={(e) => updateField("taxHandling", e.target.value)}
                  className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">请选择</option>
                  <option value="withhold">代扣代缴</option>
                  <option value="self">自行申报</option>
                  <option value="none">无需处理</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {record.attachments && record.attachments.length > 0 && (
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">附件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 pb-4 pt-0 sm:px-5">
              {record.attachments.map((file, index) => (
                <div
                  key={`${file.key}-${index}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-2"
                >
                  <p className="min-w-0 flex-1 truncate text-xs">{file.name}</p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-md border-border/60 px-2 text-[11px] shadow-none"
                  >
                    <a href={file.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      查看
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {record.type === "expense" && record.status === "approved" && (
          <Card className="rounded-xl border border-border/60 shadow-sm">
            <CardHeader className="px-4 py-3 sm:px-5">
              <CardTitle className="text-base">支付信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 px-4 pb-4 pt-0 text-xs text-muted-foreground sm:px-5">
              <p>
                支付状态：
                <span className={record.paymentStatus === "paid" ? "font-medium text-emerald-600" : "font-medium"}>
                  {record.paymentStatus === "paid" ? "已支付" : "未支付"}
                </span>
              </p>
              {record.paymentDate && <p>支付日期：{formatDateTime(record.paymentDate)}</p>}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {canEdit ? (
            <>
              <Button type="submit" disabled={saving} className="h-9 rounded-lg text-xs sm:text-sm">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    保存修改
                  </>
                )}
              </Button>
              <Button asChild variant="outline" className="h-9 rounded-lg border-border/60 text-xs sm:text-sm">
                <Link href="/finance/my-records">取消</Link>
              </Button>
            </>
          ) : (
            <Button
              asChild
              variant="outline"
              className="h-9 rounded-lg border-border/60 text-xs sm:text-sm sm:col-span-2"
            >
              <Link href="/finance/my-records">返回记录列表</Link>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
