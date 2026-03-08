"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus, ScrollText, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { FinanceBreadcrumb } from "@/components/finance-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ExpenseCategoryConfigItem {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export default function FinanceAdminFormConfigPage() {
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchExpenseCategories();
  }, []);

  const fetchExpenseCategories = async () => {
    try {
      const res = await fetch("/api/finance/admin/expense-categories");
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const sorted = [...(result.data as ExpenseCategoryConfigItem[])].sort((a, b) => a.sortOrder - b.sortOrder);
        setExpenseCategories(sorted);
      } else {
        alert(result.error || "加载类别配置失败");
      }
    } catch (error) {
      console.error(error);
      alert("加载类别配置失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpenseCategory = () => {
    const uniqueSuffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setExpenseCategories((prev) => [
      ...prev,
      {
        id: `temp-${uniqueSuffix}`,
        value: `custom_expense_${uniqueSuffix}`,
        label: "",
        sortOrder: prev.length,
        isActive: true,
      },
    ]);
  };

  const handleRemoveExpenseCategory = (index: number) => {
    setExpenseCategories((prev) => {
      if (prev.length <= 1) {
        alert("至少保留一个费用归属类别");
        return prev;
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleSaveExpenseCategories = async () => {
    const categories = expenseCategories
      .map((item, index) => ({
        value: item.value,
        label: item.label.trim(),
        isActive: item.isActive,
        sortOrder: index,
      }))
      .filter((item) => item.label.length > 0);

    if (categories.length === 0) {
      alert("请至少填写一个费用归属类别");
      return;
    }

    if (!categories.some((item) => item.isActive)) {
      alert("请至少启用一个费用归属类别");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/finance/admin/expense-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      const result = await res.json();

      if (result.success && Array.isArray(result.data)) {
        const sorted = [...(result.data as ExpenseCategoryConfigItem[])].sort((a, b) => a.sortOrder - b.sortOrder);
        setExpenseCategories(sorted);
        alert("费用归属类别配置已保存");
        return;
      }

      alert(result.error || "保存失败");
    } catch (error) {
      console.error(error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 md:space-y-4">
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardContent className="px-4 py-4 sm:px-5">
            <p className="text-sm text-muted-foreground">正在加载表单配置...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:space-y-5">
      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm">
        <CardHeader className="space-y-2 px-4 py-4 sm:px-5">
          <FinanceBreadcrumb
            items={[
              { label: "财务系统", href: "/finance" },
              { label: "管理员后台", href: "/finance/admin" },
              { label: "表单配置" },
            ]}
          />
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="rounded-full border-border/60 bg-muted/50 text-xs">
              Form Config
            </Badge>
            <div className="flex items-center gap-1.5">
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                <Link href="/finance/admin">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  审核后台
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                <Link href="/finance/admin/project-stats">
                  <BarChart3 className="h-3.5 w-3.5" />
                  数据统计
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs">
                <Link href="/admin/audit-logs">
                  <ScrollText className="h-3.5 w-3.5" />
                  审计日志
                </Link>
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">表单配置</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              管理费用报销申请中的费用归属类别，支持新增、启停与排序保存。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">费用归属类别配置</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                用于“费用报销”申请表，支持按公司常见费用类别自定义维护。
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddExpenseCategory}
              className="h-8 gap-1.5 rounded-lg text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              新增类别
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 pt-0 sm:px-5">
          {expenseCategories.map((item, index) => (
            <div key={`${item.id}-${index}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_auto]">
              <Input
                value={item.label}
                onChange={(e) =>
                  setExpenseCategories((prev) =>
                    prev.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, label: e.target.value } : current,
                    ),
                  )
                }
                placeholder="例如：物料费、交通费、软件服务费"
                className="h-9 border-border/60 text-xs"
              />
              <select
                value={item.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setExpenseCategories((prev) =>
                    prev.map((current, currentIndex) =>
                      currentIndex === index ? { ...current, isActive: e.target.value === "active" } : current,
                    ),
                  )
                }
                className="h-9 w-full rounded-md border border-border/60 bg-background px-2.5 text-xs outline-none transition-colors focus:ring-1 focus:ring-ring"
              >
                <option value="active">启用</option>
                <option value="inactive">停用</option>
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleRemoveExpenseCategory(index)}
                className="h-9 rounded-md border-border/60 px-3 text-xs"
              >
                删除
              </Button>
            </div>
          ))}

          <div className="flex justify-end pt-1">
            <Button
              type="button"
              onClick={handleSaveExpenseCategories}
              disabled={saving}
              className="h-9 rounded-lg px-4 text-xs"
            >
              {saving ? "保存中..." : "保存类别配置"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
