// 财务类别配置
export const FINANCE_CATEGORIES = {
  income: [
    { value: "project_income", label: "项目收入" },
    { value: "service_income", label: "服务收入" },
    { value: "consulting_income", label: "咨询收入" },
    { value: "donation", label: "捐赠收入" },
    { value: "other_income", label: "其他收入" },
  ],
  expense: [
    { value: "material_fee", label: "物料费" },
    { value: "transportation_fee", label: "交通费" },
    { value: "accommodation_fee", label: "住宿费" },
    { value: "office_fee", label: "办公费" },
    { value: "communication_fee", label: "通讯费" },
    { value: "competition_bonus", label: "比赛奖金" },
    { value: "labor_subsidy", label: "劳务补贴" },
    { value: "welfare_fee", label: "福利费" },
    { value: "salary", label: "工资" },
    { value: "other_expense", label: "其他支出" },
  ],
} as const;

export const TYPE_LABELS: Record<string, string> = {
  income: "收入",
  expense: "支出",
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "已通过", color: "bg-green-100 text-green-800" },
  rejected: { label: "已拒绝", color: "bg-red-100 text-red-800" },
};

// 获取类别标签
export function getCategoryLabel(type: string, category: string): string {
  const categories = type === "income" ? FINANCE_CATEGORIES.income : FINANCE_CATEGORIES.expense;
  return categories.find((c) => c.value === category)?.label || category;
}
