"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PlusCircle, ShoppingCart, Receipt, Users, ArrowRight } from "lucide-react";
import {
  getApplicationTypeConfig,
  getAllApplicationTypes,
  isValidApplicationType,
  type FinanceApplicationType,
  type FormField,
} from "@/lib/finance-config";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">无效的申请类型</p>
          <Link href="/finance/submit" className="text-blue-600 hover:underline mt-2 inline-block">
            返回选择页面
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
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/finance" className="text-blue-600 hover:underline mb-4 inline-block text-sm sm:text-base">
          ← 返回首页
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">选择申请类型</h1>
        <p className="text-sm text-gray-600">请选择您要提交的申请类型</p>
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
function ApplicationForm({ applicationType, session }: { applicationType: FinanceApplicationType; session: SessionData }) {
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
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={formData[field.name] || ""}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
          />
        </div>
      );
    }

    if (field.type === "text") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            rows={4}
            placeholder={field.placeholder}
          />
          {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            step="0.01"
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === "date") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          >
            <option value="">请选择</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "file") {
      return (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-2">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-sm"
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-2">{field.helpText}</p>}

            {uploading && <p className="text-sm text-blue-600 mt-2">上传中...</p>}

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.key)}
                      className="ml-2 text-red-600 hover:text-red-800 text-sm"
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
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/finance/submit" className="text-blue-600 hover:underline mb-4 inline-block text-sm sm:text-base">
          ← 返回选择页面
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{config.label}</h1>
        <p className="text-sm text-gray-600">{config.description}</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6"
      >
        {config.fields.map((field) => renderField(field))}

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 sm:py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
          >
            {loading ? "提交中..." : "提交申请"}
          </button>
          <Link
            href="/finance/submit"
            className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-2 px-4 rounded-md hover:bg-gray-300 text-center text-sm sm:text-base font-medium"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
