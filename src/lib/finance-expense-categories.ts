export type ExpenseCategoryOption = {
  value: string;
  label: string;
};

export const DEFAULT_EXPENSE_CATEGORY_OPTIONS: ExpenseCategoryOption[] = [
  { value: "material_fee", label: "物料费" },
  { value: "transportation_fee", label: "交通费" },
  { value: "travel_fee", label: "差旅费" },
  { value: "accommodation_fee", label: "住宿费" },
  { value: "meal_fee", label: "餐饮费" },
  { value: "office_fee", label: "办公费" },
  { value: "communication_fee", label: "通讯费" },
  { value: "software_service_fee", label: "软件服务费" },
  { value: "marketing_fee", label: "市场推广费" },
  { value: "conference_fee", label: "会务费" },
  { value: "training_fee", label: "培训费" },
  { value: "business_entertainment_fee", label: "业务招待费" },
  { value: "labor_service_fee", label: "劳务费" },
  { value: "maintenance_fee", label: "设备维修费" },
  { value: "welfare_fee", label: "福利费" },
  { value: "other_expense", label: "其他费用" },
];
