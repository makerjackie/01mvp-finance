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

export const PROJECT_SETTLEMENT_MODE_VALUES = ["cost_only", "profit_share"] as const;

export type ProjectSettlementMode = (typeof PROJECT_SETTLEMENT_MODE_VALUES)[number];

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

export const PROJECT_SETTLEMENT_MODE_LABELS: Record<ProjectSettlementMode, string> = {
  cost_only: "仅覆盖成本",
  profit_share: "盈利分成",
};

export const DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT = 20;

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
  labor_service_fee: "human_resources",
  salary: "human_resources",
  member_donation: "donation",
  material_fee: "community_operations",
  transportation_fee: "community_operations",
  travel_fee: "community_operations",
  accommodation_fee: "community_operations",
  meal_fee: "community_operations",
  office_fee: "community_operations",
  communication_fee: "community_operations",
  software_service_fee: "community_operations",
  marketing_fee: "community_operations",
  conference_fee: "community_operations",
  training_fee: "community_operations",
  business_entertainment_fee: "community_operations",
  maintenance_fee: "community_operations",
  welfare_fee: "community_operations",
  other_expense: "community_operations",
};

const APPLICATION_TYPE_TO_CATEGORY: Record<FinanceApplicationType, ProjectCategory> = {
  income_registration: "other",
  procurement: "community_operations",
  reimbursement: "community_operations",
  labor_settlement: "human_resources",
};

export const isProjectCategory = (value: unknown): value is ProjectCategory =>
  typeof value === "string" && PROJECT_CATEGORY_VALUES.includes(value as ProjectCategory);

export const isProjectSettlementMode = (value: unknown): value is ProjectSettlementMode =>
  typeof value === "string" && PROJECT_SETTLEMENT_MODE_VALUES.includes(value as ProjectSettlementMode);

export const clampCommunitySharePercent = (value: unknown): number => {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) return DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT;
  return Math.min(100, Math.max(0, Math.round(numeric)));
};

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

export const inferProjectSettlementConfig = ({
  subcategory,
}: {
  subcategory?: string | null;
  applicationType?: FinanceApplicationType | string | null;
}): {
  settlementMode: ProjectSettlementMode;
  communitySharePercent: number;
} => {
  const normalizedSubcategory = typeof subcategory === "string" ? subcategory.trim() : "";

  if (normalizedSubcategory === "project_profit_share") {
    return {
      settlementMode: "profit_share",
      communitySharePercent: DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT,
    };
  }

  return {
    settlementMode: "cost_only",
    communitySharePercent: DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT,
  };
};

export const getSettlementDescription = (settlementMode: ProjectSettlementMode, communitySharePercent: number) => {
  if (settlementMode === "profit_share") {
    const community = clampCommunitySharePercent(communitySharePercent);
    const team = 100 - community;
    return `分成规则：社区 ${community}% / 项目团队 ${team}%`;
  }

  return "仅覆盖成本，不做利润分成";
};
