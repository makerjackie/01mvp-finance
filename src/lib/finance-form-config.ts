import type { FinanceApplicationType } from "@/lib/finance-config";

export const FINANCE_APPLICATION_TYPE_ORDER: FinanceApplicationType[] = [
  "reimbursement",
  "income_registration",
  "procurement",
  "labor_settlement",
];

export const FINANCE_FIELD_DATA_TYPES = ["int", "float", "string"] as const;
export type FinanceFieldDataType = (typeof FINANCE_FIELD_DATA_TYPES)[number];

export const FINANCE_FIELD_WIDGET_TYPES = ["input", "single_select", "multi_select"] as const;
export type FinanceFieldWidgetType = (typeof FINANCE_FIELD_WIDGET_TYPES)[number];

export const FINANCE_FIELD_INPUT_MODES = ["text", "textarea", "number", "date", "file", "auto"] as const;
export type FinanceFieldInputMode = (typeof FINANCE_FIELD_INPUT_MODES)[number];

export const FINANCE_FIELD_AUTO_VALUES = ["date", "userName"] as const;
export type FinanceFieldAutoValue = (typeof FINANCE_FIELD_AUTO_VALUES)[number];

export type FinanceFormTemplateStatus = "draft" | "published" | "archived";

export type FinanceFormFieldOptionConfig = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

export type FinanceFormFieldConfig = {
  id: string;
  name: string;
  label: string;
  dataType: FinanceFieldDataType;
  widgetType: FinanceFieldWidgetType;
  inputMode: FinanceFieldInputMode;
  autoValue: FinanceFieldAutoValue | null;
  required: boolean;
  placeholder: string | null;
  helpText: string | null;
  defaultValue: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystemField: boolean;
  options: FinanceFormFieldOptionConfig[];
};

export type FinanceApplicationFormConfig = {
  applicationType: FinanceApplicationType;
  version: number;
  status: FinanceFormTemplateStatus;
  fields: FinanceFormFieldConfig[];
  updatedAt: string;
};

export const isFinanceFieldDataType = (value: unknown): value is FinanceFieldDataType =>
  typeof value === "string" && (FINANCE_FIELD_DATA_TYPES as readonly string[]).includes(value);

export const isFinanceFieldWidgetType = (value: unknown): value is FinanceFieldWidgetType =>
  typeof value === "string" && (FINANCE_FIELD_WIDGET_TYPES as readonly string[]).includes(value);

export const isFinanceFieldInputMode = (value: unknown): value is FinanceFieldInputMode =>
  typeof value === "string" && (FINANCE_FIELD_INPUT_MODES as readonly string[]).includes(value);

export const isFinanceFieldAutoValue = (value: unknown): value is FinanceFieldAutoValue =>
  typeof value === "string" && (FINANCE_FIELD_AUTO_VALUES as readonly string[]).includes(value);
