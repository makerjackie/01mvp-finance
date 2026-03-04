"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PlusCircle, ShoppingCart, Receipt, Users, ArrowRight, Loader2 } from "lucide-react";
import {
  getApplicationTypeConfig,
  getAllApplicationTypes,
  isValidApplicationType,
  type FinanceApplicationType,
  type FormField,
} from "@/lib/finance-config";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";

type UploadedFile = {
  key: string;
  url: string;
  name: string;
};

type SessionData = {
  user?: {
    name?: string | null;
  };
} | null;

type FinanceCreatePayload = {
  type: "income" | "expense";
  category: FinanceApplicationType;
  attachments: UploadedFile[];
  subcategory?: string;
  amount?: number;
  transactionDate?: string;
  relatedProject?: string;
  description?: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
  recipientIdCard?: string;
  summary?: string;
  taxHandling?: string;
};

const LEGACY_TYPE_MAPPING: Record<string, FinanceApplicationType> = {
  income: "income_registration",
  expense: "procurement",
};

export default function SubmitFinanceRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const typeParam = searchParams.get("type");

  // 如果是旧类型，自动重定向到新类型
  useEffect(() => {
    if (typeParam && LEGACY_TYPE_MAPPING[typeParam]) {
      router.replace(`/finance/submit?type=${LEGACY_TYPE_MAPPING[typeParam]}`);
    }
  }, [typeParam, router]);

  // 如果没有 type 参数，显示类型选择页面
  if (!typeParam) {
    return <TypeSelectionPage />;
  }

  const applicationType = (LEGACY_TYPE_MAPPING[typeParam] || typeParam) as FinanceApplicationType;

  // 验证申请类型
  if (!isValidApplicationType(applicationType)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-10">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-red-800">无效的申请类型</p>
          <Link
            href="/finance/submit"
            className="mt-3 inline-flex items-center text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            返回新建申请
          </Link>
        </div>
      </div>
    );
  }

  return <ApplicationForm applicationType={applicationType} session={session} />;
}

// 类型选择页面组件
function TypeSelectionPage() {
  const allTypes = getAllApplicationTypes();

  const iconMap: Record<string, typeof PlusCircle> = {
    PlusCircle: PlusCircle,
    ShoppingCart: ShoppingCart,
    Receipt: Receipt,
    Users: Users,
  };

  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-10">
      <div className="mb-4 space-y-2 sm:mb-6">
        <FinanceBreadcrumb items={[{ label: "财务系统", href: "/finance" }, { label: "新建申请" }]} />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">选择申请类型</h1>
        <p className="text-sm text-muted-foreground">请选择您要提交的申请类型</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {allTypes.map((type) => {
          const Icon = iconMap[type.icon];
          const colorClass = colorMap[type.color];

          return (
            <Link key={type.key} href={`/finance/submit?type=${type.key}`} className="group">
              <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99]">
                <CardContent className="px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{type.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
                    </div>
                    {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
                  </div>
                  <div className="mt-3 inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                    去申请
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// 表单组件
function ApplicationForm({
  applicationType,
  session,
}: {
  applicationType: FinanceApplicationType;
  session: SessionData;
}) {
  const router = useRouter();
  const config = getApplicationTypeConfig(applicationType)!;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // 初始化表单数据
  useEffect(() => {
    const initialData: Record<string, string> = {};
    config.fields.forEach((field) => {
      if (field.type === "auto") {
        if (field.autoValue === "date") {
          initialData[field.name] = new Date().toISOString().split("T")[0];
        } else if (field.autoValue === "userName") {
          initialData[field.name] = session?.user?.name || "";
        }
      } else {
        initialData[field.name] = "";
      }
    });
    setFormData(initialData);
  }, [config, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 构建提交数据
      const payload: FinanceCreatePayload = {
        type: config.dbType,
        category: applicationType,
        attachments: uploadedFiles,
      };

      // 映射表单字段到数据库字段
      config.fields.forEach((field) => {
        if (field.name === "attachments") {
          return;
        }

        const value = formData[field.name] || "";

        if (field.name === "subcategory") {
          payload.subcategory = value || undefined;
        } else if (field.name === "amount") {
          payload.amount = value ? parseFloat(value) : undefined;
        } else if (field.name === "transactionDate") {
          payload.transactionDate = value || undefined;
        } else if (field.name === "relatedProject") {
          payload.relatedProject = value || undefined;
        } else if (field.name === "description") {
          payload.description = value || undefined;
        } else if (field.name === "recipientName") {
          payload.recipientName = value || undefined;
        } else if (field.name === "recipientAccount") {
          payload.recipientAccount = value || undefined;
        } else if (field.name === "recipientBank") {
          payload.recipientBank = value || undefined;
        } else if (field.name === "recipientIdCard") {
          payload.recipientIdCard = value || undefined;
        } else if (field.name === "summary") {
          payload.summary = value || undefined;
        } else if (field.name === "taxHandling") {
          payload.taxHandling = value || undefined;
        }
      });

      if (!payload.description) {
        payload.description = `${config.label}申请`;
      }

      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await res.json()) as { success?: boolean; error?: string };

      if (result.success) {
        alert("提交成功！");
        router.push("/finance/my-records");
      } else {
        alert(result.error || "提交失败");
      }
    } catch (error) {
      console.error(error);
      alert("提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const result = (await res.json()) as { success?: boolean; data?: UploadedFile; error?: string };

        if (result.success && result.data) {
          const uploadedFile = result.data;
          setUploadedFiles((prev) => [...prev, uploadedFile]);
        } else {
          alert(`上传失败: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (key: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.key !== key));
  };

  const renderField = (field: FormField) => {
    if (field.type === "auto") {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="text"
            value={formData[field.name] || ""}
            readOnly
            className="h-11 rounded-xl border-border/60 bg-muted/50 text-sm shadow-sm"
          />
        </div>
      );
    }

    if (field.type === "text") {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="text"
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="min-h-[112px] rounded-xl border-border/60 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
            placeholder={field.placeholder}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="number"
            step="0.01"
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === "date") {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="date"
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <select
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">请选择</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "file") {
      return (
        <div key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 sm:p-5">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            {field.helpText && <p className="mt-2 text-xs text-muted-foreground">{field.helpText}</p>}

            {uploading && (
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                上传中...
              </p>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.key}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2.5"
                  >
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.key)}
                      className="ml-2 text-sm text-destructive transition-colors hover:text-destructive/80"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 pb-24 sm:px-6 sm:py-6 sm:pb-10">
      <div className="mb-4 space-y-2 sm:mb-6">
        <FinanceBreadcrumb
          items={[
            { label: "财务系统", href: "/finance" },
            { label: "新建申请", href: "/finance/submit" },
            { label: config.label },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{config.label}</h1>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {config.fields.map((field) => renderField(field))}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                asChild
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl border-border/60 sm:w-auto sm:min-w-28"
              >
                <Link href="/finance/submit">取消</Link>
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] sm:w-auto sm:min-w-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  "提交申请"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
