import type { FinanceApplicationType } from "@/lib/finance-config";

export const PROJECT_CATEGORY_VALUES = [
  "entry_activity",
  "advanced_activity",
  "promotion_consulting",
  "community_operations",
  "human_resources",
  "donation",
  "other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORY_VALUES)[number];

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  entry_activity: "入门活动",
  advanced_activity: "进阶活动",
  promotion_consulting: "推广咨询",
  community_operations: "社区运营",
  human_resources: "人力劳务",
  donation: "捐赠公益",
  other: "其他/未归类",
};

export const PROJECT_CATEGORY_OPTIONS = PROJECT_CATEGORY_VALUES.map((value) => ({
  value,
  label: PROJECT_CATEGORY_LABELS[value],
}));

const SUBCATEGORY_TO_PROJECT_CATEGORY: Record<string, ProjectCategory> = {
  entry_activity: "entry_activity",
  entry_activity_cost: "entry_activity",
  advanced_activity: "advanced_activity",
  advanced_activity_cost: "advanced_activity",
  project_profit_share: "advanced_activity",
  lecturer_fee: "advanced_activity",
  promotion_consulting: "promotion_consulting",
  community_public_expense: "community_operations",
  community_operation: "community_operations",
  intern_salary: "human_resources",
  labor_subsidy: "human_resources",
  member_donation: "donation",
};

const APPLICATION_TYPE_TO_CATEGORY: Record<FinanceApplicationType, ProjectCategory> = {
  income_registration: "other",
  procurement: "community_operations",
  reimbursement: "community_operations",
  labor_settlement: "human_resources",
};

export const isProjectCategory = (value: unknown): value is ProjectCategory =>
  typeof value === "string" && PROJECT_CATEGORY_VALUES.includes(value as ProjectCategory);

export const normalizeProjectName = (name: string) => name.trim().replace(/\s+/g, " ");

export const toProjectNormalizedName = (name: string) => normalizeProjectName(name).toLocaleLowerCase("zh-CN");

export const inferProjectCategory = ({
  subcategory,
  applicationType,
}: {
  subcategory?: string | null;
  applicationType?: FinanceApplicationType | string | null;
}): ProjectCategory => {
  const normalizedSubcategory = typeof subcategory === "string" ? subcategory.trim() : "";

  if (normalizedSubcategory && normalizedSubcategory in SUBCATEGORY_TO_PROJECT_CATEGORY) {
    return SUBCATEGORY_TO_PROJECT_CATEGORY[normalizedSubcategory];
  }

  if (applicationType && applicationType in APPLICATION_TYPE_TO_CATEGORY) {
    return APPLICATION_TYPE_TO_CATEGORY[applicationType as FinanceApplicationType];
  }

  return "other";
};
