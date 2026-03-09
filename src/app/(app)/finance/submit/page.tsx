"use client";

import { useEffect, useState } from "react";
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
import { type FinanceApplicationFormConfig, type FinanceFormFieldConfig } from "@/lib/finance-form-config";
import { DEFAULT_EXPENSE_CATEGORY_OPTIONS, type ExpenseCategoryOption } from "@/lib/finance-expense-categories";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";
import { FinanceProjectSelector } from "@/components/finance-project-selector";

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

type ProfileResponse = {
  profile?: {
    name?: string;
    idCardNumber?: string;
    bankAccountNumber?: string;
    bankName?: string;
  };
};

type FinanceCreatePayload = {
  type: "income" | "expense";
  category: FinanceApplicationType;
  attachments: string[];
  formPayload?: Record<string, unknown>;
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

type ExpenseCategoryConfigItem = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

type SubmitFieldType = "text" | "textarea" | "number" | "date" | "select" | "multi_select" | "file" | "auto";

type SubmitField = {
  name: string;
  label: string;
  type: SubmitFieldType;
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  helpText?: string;
  autoValue?: "date" | "userName";
};

const LEGACY_TYPE_MAPPING: Record<string, FinanceApplicationType> = {
  income: "income_registration",
  expense: "procurement",
};

const mapLegacyFieldToSubmitField = (field: FormField): SubmitField => ({
  name: field.name,
  label: field.label,
  type: field.type === "select" ? "select" : field.type,
  required: field.required,
  placeholder: field.placeholder,
  options: field.options,
  helpText: field.helpText,
  autoValue: field.autoValue,
});

const mapServerFieldToSubmitField = (field: FinanceFormFieldConfig): SubmitField => {
  if (field.widgetType === "single_select") {
    return {
      name: field.name,
      label: field.label,
      type: "select",
      required: field.required,
      placeholder: field.placeholder || undefined,
      options: field.options
        .filter((option) => option.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({ value: option.value, label: option.label })),
      helpText: field.helpText || undefined,
    };
  }

  if (field.widgetType === "multi_select") {
    return {
      name: field.name,
      label: field.label,
      type: "multi_select",
      required: field.required,
      placeholder: field.placeholder || undefined,
      options: field.options
        .filter((option) => option.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({ value: option.value, label: option.label })),
      helpText: field.helpText || undefined,
    };
  }

  if (field.inputMode === "textarea") {
    return {
      name: field.name,
      label: field.label,
      type: "textarea",
      required: field.required,
      placeholder: field.placeholder || undefined,
      helpText: field.helpText || undefined,
    };
  }

  if (field.inputMode === "number") {
    return {
      name: field.name,
      label: field.label,
      type: "number",
      required: field.required,
      placeholder: field.placeholder || undefined,
      helpText: field.helpText || undefined,
    };
  }

  if (field.inputMode === "date") {
    return {
      name: field.name,
      label: field.label,
      type: "date",
      required: field.required,
      helpText: field.helpText || undefined,
    };
  }

  if (field.inputMode === "file") {
    return {
      name: field.name,
      label: field.label,
      type: "file",
      required: field.required,
      helpText: field.helpText || undefined,
    };
  }

  if (field.inputMode === "auto") {
    return {
      name: field.name,
      label: field.label,
      type: "auto",
      required: field.required,
      autoValue: field.autoValue || undefined,
      helpText: field.helpText || undefined,
    };
  }

  return {
    name: field.name,
    label: field.label,
    type: "text",
    required: field.required,
    placeholder: field.placeholder || undefined,
    helpText: field.helpText || undefined,
  };
};

export default function SubmitFinanceRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const typeParam = searchParams.get("type");

  useEffect(() => {
    if (typeParam && LEGACY_TYPE_MAPPING[typeParam]) {
      router.replace(`/finance/submit?type=${LEGACY_TYPE_MAPPING[typeParam]}`);
    }
  }, [typeParam, router]);

  if (!typeParam) {
    return <TypeSelectionPage />;
  }

  const applicationType = (LEGACY_TYPE_MAPPING[typeParam] || typeParam) as FinanceApplicationType;

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
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-2 px-1">
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
              <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between gap-6 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold">{type.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{type.description}</p>
                    </div>
                    {Icon && <Icon className={`h-5 w-5 ${colorClass}`} />}
                  </div>
                  <div className="inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground sm:text-sm">
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

function ApplicationForm({
  applicationType,
  session,
}: {
  applicationType: FinanceApplicationType;
  session: SessionData;
}) {
  const router = useRouter();
  const staticConfig = getApplicationTypeConfig(applicationType)!;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingFormConfig, setLoadingFormConfig] = useState(true);
  const [usingServerConfig, setUsingServerConfig] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [formFields, setFormFields] = useState<SubmitField[]>(() =>
    staticConfig.fields.map(mapLegacyFieldToSubmitField),
  );
  const [formData, setFormData] = useState<Record<string, string | string[]>>({});
  const [expenseCategoryOptions, setExpenseCategoryOptions] = useState<ExpenseCategoryOption[]>(
    DEFAULT_EXPENSE_CATEGORY_OPTIONS,
  );
  const [loadingExpenseCategories, setLoadingExpenseCategories] = useState(applicationType === "reimbursement");

  useEffect(() => {
    let cancelled = false;

    const loadPublishedFormConfig = async () => {
      setLoadingFormConfig(true);
      setUsingServerConfig(false);

      try {
        const response = await fetch(`/api/finance/form-config?applicationType=${applicationType}`);
        if (!response.ok || cancelled) {
          throw new Error("load failed");
        }

        const result = (await response.json()) as {
          success?: boolean;
          data?: FinanceApplicationFormConfig;
        };

        if (!result.success || !result.data || !Array.isArray(result.data.fields) || cancelled) {
          throw new Error("empty config");
        }

        const mappedFields = result.data.fields.map(mapServerFieldToSubmitField);
        if (mappedFields.length === 0) {
          throw new Error("empty fields");
        }

        setFormFields(mappedFields);
        setUsingServerConfig(true);
        return;
      } catch {
        if (!cancelled) {
          setFormFields(staticConfig.fields.map(mapLegacyFieldToSubmitField));
          setUsingServerConfig(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingFormConfig(false);
        }
      }
    };

    void loadPublishedFormConfig();

    return () => {
      cancelled = true;
    };
  }, [applicationType, staticConfig]);

  useEffect(() => {
    if (applicationType !== "reimbursement" || usingServerConfig) {
      setLoadingExpenseCategories(false);
      return;
    }

    let cancelled = false;

    const loadExpenseCategories = async () => {
      setLoadingExpenseCategories(true);
      try {
        const response = await fetch("/api/finance/expense-categories");
        if (!response.ok || cancelled) {
          return;
        }

        const result = (await response.json()) as {
          success?: boolean;
          data?: ExpenseCategoryConfigItem[];
        };

        if (!result.success || !Array.isArray(result.data) || cancelled) {
          return;
        }

        const options = result.data
          .filter((item) => item.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            value: item.value,
            label: item.label,
          }));

        if (options.length > 0) {
          setExpenseCategoryOptions(options);
        }
      } catch (error) {
        console.error("加载费用归属类别失败", error);
      } finally {
        if (!cancelled) {
          setLoadingExpenseCategories(false);
        }
      }
    };

    void loadExpenseCategories();

    return () => {
      cancelled = true;
    };
  }, [applicationType, usingServerConfig]);

  useEffect(() => {
    let cancelled = false;
    const initialData: Record<string, string | string[]> = {};

    formFields.forEach((field) => {
      if (field.type === "auto") {
        if (field.autoValue === "date") {
          initialData[field.name] = new Date().toISOString().split("T")[0];
        } else if (field.autoValue === "userName") {
          initialData[field.name] = session?.user?.name || "";
        }
      } else if (field.type === "multi_select") {
        initialData[field.name] = [];
      } else {
        initialData[field.name] = "";
      }
    });

    setFormData(initialData);

    const hasReusableFields = ["recipientName", "recipientIdCard", "recipientAccount", "recipientBank"].some(
      (fieldName) => fieldName in initialData,
    );

    if (!hasReusableFields) {
      return () => {
        cancelled = true;
      };
    }

    const loadProfileDefaults = async () => {
      try {
        const response = await fetch("/api/user/profile");
        if (!response.ok || cancelled) {
          return;
        }

        const result = (await response.json()) as ProfileResponse;
        const profile = result.profile;

        if (!profile || cancelled) {
          return;
        }

        setFormData((prev) => {
          const next = { ...prev };
          if (typeof next.recipientName === "string" && !next.recipientName) {
            next.recipientName = profile.name?.trim() || "";
          }
          if (typeof next.recipientIdCard === "string" && !next.recipientIdCard) {
            next.recipientIdCard = profile.idCardNumber?.trim() || "";
          }
          if (typeof next.recipientAccount === "string" && !next.recipientAccount) {
            next.recipientAccount = profile.bankAccountNumber?.trim() || "";
          }
          if (typeof next.recipientBank === "string" && !next.recipientBank) {
            next.recipientBank = profile.bankName?.trim() || "";
          }
          return next;
        });
      } catch (error) {
        console.error("加载个人资料失败", error);
      }
    };

    void loadProfileDefaults();

    return () => {
      cancelled = true;
    };
  }, [formFields, session]);

  const getStringValue = (fieldName: string) => {
    const value = formData[fieldName];
    return typeof value === "string" ? value : "";
  };

  const getMultiValues = (fieldName: string) => {
    const value = formData[fieldName];
    return Array.isArray(value) ? value : [];
  };

  const setStringValue = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const toggleMultiValue = (fieldName: string, optionValue: string) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      const next = current.includes(optionValue)
        ? current.filter((item) => item !== optionValue)
        : [...current, optionValue];

      return {
        ...prev,
        [fieldName]: next,
      };
    });
  };

  const getFieldOptions = (field: SubmitField) => {
    if (!usingServerConfig && applicationType === "reimbursement" && field.name === "subcategory") {
      return expenseCategoryOptions;
    }
    return field.options || [];
  };

  const focusFieldByName = (fieldName: string) => {
    const wrapper = document.getElementById(`field-wrapper-${fieldName}`);
    if (!wrapper) {
      return;
    }

    wrapper.scrollIntoView({ behavior: "smooth", block: "center" });

    const firstInput = wrapper.querySelector(
      "input:not([type='hidden']):not([disabled]), textarea:not([disabled]), select:not([disabled])",
    ) as HTMLElement | null;
    firstInput?.focus();
  };

  const getMissingRequiredFields = () => {
    const missingFields: SubmitField[] = [];

    for (const field of formFields) {
      if (!field.required) {
        continue;
      }

      if (field.type === "file" || field.name === "attachments") {
        if (uploadedFiles.length === 0) {
          missingFields.push(field);
        }
        continue;
      }

      if (field.type === "multi_select") {
        if (getMultiValues(field.name).length === 0) {
          missingFields.push(field);
        }
        continue;
      }

      if (!getStringValue(field.name).trim()) {
        missingFields.push(field);
      }
    }

    return missingFields;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields = getMissingRequiredFields();
    if (missingFields.length > 0) {
      const missingLabels = missingFields.map((field) => field.label).join("、");
      alert(`请先填写必填项：${missingLabels}`);
      focusFieldByName(missingFields[0].name);
      return;
    }

    setLoading(true);

    try {
      const payload: FinanceCreatePayload = {
        type: staticConfig.dbType,
        category: applicationType,
        attachments: uploadedFiles.map((file) => file.url),
      };

      const formPayload: Record<string, unknown> = {};

      formFields.forEach((field) => {
        if (field.name === "attachments") {
          return;
        }

        if (field.type === "multi_select") {
          const values = getMultiValues(field.name);
          if (values.length > 0) {
            formPayload[field.name] = values;
          }
          return;
        }

        const value = getStringValue(field.name).trim();
        if (value) {
          formPayload[field.name] = value;
        }

        if (field.name === "subcategory") {
          payload.subcategory = value || undefined;
        } else if (field.name === "amount") {
          payload.amount = value ? Number(value) : undefined;
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

      payload.formPayload = formPayload;

      if (!payload.description) {
        payload.description = `${staticConfig.label}申请`;
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

  const renderField = (field: SubmitField) => {
    if (field.type === "auto") {
      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="text"
            value={getStringValue(field.name)}
            readOnly
            className="h-11 rounded-xl border-border/60 bg-muted/50 text-sm shadow-sm"
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.name === "relatedProject") {
      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <FinanceProjectSelector
            value={getStringValue(field.name)}
            onChange={(value) => setStringValue(field.name, value)}
            applicationType={applicationType}
            subcategory={getStringValue("subcategory")}
            required={field.required}
            placeholder={field.placeholder}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "text") {
      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="text"
            required={field.required}
            value={getStringValue(field.name)}
            onChange={(e) => setStringValue(field.name, e.target.value)}
            className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
            placeholder={field.placeholder}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Textarea
            required={field.required}
            value={getStringValue(field.name)}
            onChange={(e) => setStringValue(field.name, e.target.value)}
            className="min-h-[112px] rounded-xl border-border/60 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
            placeholder={field.placeholder}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="number"
            step="0.01"
            required={field.required}
            value={getStringValue(field.name)}
            onChange={(e) => setStringValue(field.name, e.target.value)}
            className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
            placeholder={field.placeholder}
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "date") {
      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <Input
            type="date"
            required={field.required}
            value={getStringValue(field.name)}
            onChange={(e) => setStringValue(field.name, e.target.value)}
            className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
          />
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "select") {
      const options = getFieldOptions(field);
      const currentValue = getStringValue(field.name);
      const optionsWithFallback =
        currentValue && !options.some((option) => option.value === currentValue)
          ? [...options, { value: currentValue, label: `${currentValue}（历史值）` }]
          : options;

      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <select
            required={field.required}
            value={currentValue}
            onChange={(e) => setStringValue(field.name, e.target.value)}
            className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">请选择</option>
            {optionsWithFallback.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {!usingServerConfig && applicationType === "reimbursement" && field.name === "subcategory" && (
            <p className="text-xs text-muted-foreground">
              {loadingExpenseCategories ? "正在加载后台配置..." : "可由管理员在后台自定义费用归属类别"}
            </p>
          )}
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "multi_select") {
      const options = getFieldOptions(field);
      const selected = getMultiValues(field.name);

      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-destructive">*</span>}
          </Label>
          <div className="space-y-2 rounded-xl border border-border/60 bg-background p-3">
            {options.length === 0 && <p className="text-xs text-muted-foreground">暂无可选项</p>}
            {options.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleMultiValue(field.name, option.value)}
                  className="h-4 w-4"
                />
                {option.label}
              </label>
            ))}
          </div>
          {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === "file") {
      return (
        <div id={`field-wrapper-${field.name}`} key={field.name} className="space-y-2">
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
            { label: staticConfig.label },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{staticConfig.label}</h1>
        <p className="text-sm text-muted-foreground">{staticConfig.description}</p>
        <p className="text-xs text-muted-foreground">
          {loadingFormConfig ? "正在加载表单配置..." : usingServerConfig ? "已应用后台发布配置" : "使用默认配置"}
        </p>
      </div>

      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5 sm:space-y-6">
            {formFields.map((field) => renderField(field))}

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
