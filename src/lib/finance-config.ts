// 财务申请类型配置
import { DEFAULT_EXPENSE_CATEGORY_OPTIONS } from "@/lib/finance-expense-categories";

export type FinanceApplicationType =
  | "income_registration" // 收入登记
  | "procurement" // 采购支出
  | "reimbursement" // 费用报销
  | "labor_settlement"; // 劳务结算

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "file" | "auto"; // 自动填充字段

export interface FormField {
  name: string; // 数据库字段名
  label: string; // 显示标签
  type: FieldType; // 字段类型
  required: boolean; // 是否必填
  placeholder?: string; // 占位符
  options?: Array<{ value: string; label: string }>; // 选项（select类型）
  helpText?: string; // 帮助文本
  autoValue?: "date" | "userName"; // 自动填充值类型
}

export interface ApplicationTypeConfig {
  key: FinanceApplicationType;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  dbType: "income" | "expense"; // 数据库type字段值
  fields: FormField[];
}

// 4种申请类型的完整配置
export const APPLICATION_TYPES: Record<FinanceApplicationType, ApplicationTypeConfig> = {
  income_registration: {
    key: "income_registration",
    label: "收入登记",
    description: "登记入门活动、进阶活动、推广咨询、成员捐赠等收入",
    icon: "PlusCircle",
    color: "emerald",
    dbType: "income",
    fields: [
      {
        name: "transactionDate",
        label: "登记日期",
        type: "date",
        required: true,
      },
      {
        name: "subcategory",
        label: "收入类型",
        type: "select",
        required: true,
        options: [
          { value: "entry_activity", label: "A.入门活动" },
          { value: "advanced_activity", label: "B.进阶活动" },
          { value: "promotion_consulting", label: "C.推广/咨询收入" },
          { value: "member_donation", label: "D.成员捐赠" },
        ],
      },
      {
        name: "relatedProject",
        label: "关联活动/项目名称",
        type: "text",
        required: false,
        placeholder: "请输入活动或项目名称",
      },
      {
        name: "amount",
        label: "总入账金额",
        type: "number",
        required: true,
        placeholder: "请输入金额",
      },
      {
        name: "summary",
        label: "收款渠道",
        type: "select",
        required: true,
        options: [
          { value: "corporate_account", label: "对公银行账户" },
          { value: "other", label: "其他" },
        ],
      },
      {
        name: "attachments",
        label: "资金到账截图/凭证",
        type: "file",
        required: false,
        helpText: "支持上传图片或PDF文件",
      },
    ],
  },

  procurement: {
    key: "procurement",
    label: "采购支出",
    description: "申请采购物料、设备、软件订阅等支出",
    icon: "ShoppingCart",
    color: "blue",
    dbType: "expense",
    fields: [
      {
        name: "createdAt",
        label: "申请日期",
        type: "auto",
        required: true,
        autoValue: "date",
      },
      {
        name: "userName",
        label: "需求发起人",
        type: "auto",
        required: true,
        autoValue: "userName",
      },
      {
        name: "subcategory",
        label: "支出归属类别",
        type: "select",
        required: true,
        options: [
          { value: "entry_activity_cost", label: "A.入门活动直接成本" },
          { value: "advanced_activity_cost", label: "B.进阶活动直接成本" },
          { value: "community_public_expense", label: "C.社区日常公共开支" },
        ],
      },
      {
        name: "relatedProject",
        label: "关联项目/活动名称",
        type: "text",
        required: false,
        placeholder: "请输入项目或活动名称",
      },
      {
        name: "description",
        label: "采购事由及明细",
        type: "textarea",
        required: true,
        placeholder: "请详细说明采购内容、用途、规格等信息",
      },
      {
        name: "amount",
        label: "申请付款总金额",
        type: "number",
        required: true,
        placeholder: "请输入金额",
      },
      {
        name: "recipientName",
        label: "供应商全称",
        type: "text",
        required: true,
        placeholder: "请输入供应商名称",
      },
      {
        name: "recipientAccount",
        label: "供应商收款账号",
        type: "text",
        required: true,
        placeholder: "请输入收款账号",
      },
      {
        name: "recipientBank",
        label: "供应商开户行",
        type: "text",
        required: true,
        placeholder: "请输入开户行信息",
      },
      {
        name: "attachments",
        label: "发票类型及合同凭证",
        type: "file",
        required: true,
        helpText: "请上传发票、合同等相关凭证",
      },
    ],
  },

  reimbursement: {
    key: "reimbursement",
    label: "费用报销",
    description: "报销交通费、办公费等垫付费用",
    icon: "Receipt",
    color: "purple",
    dbType: "expense",
    fields: [
      {
        name: "createdAt",
        label: "申请日期",
        type: "auto",
        required: true,
        autoValue: "date",
      },
      {
        name: "userName",
        label: "报销人姓名",
        type: "auto",
        required: true,
        autoValue: "userName",
      },
      {
        name: "subcategory",
        label: "费用归属类别",
        type: "select",
        required: true,
        options: DEFAULT_EXPENSE_CATEGORY_OPTIONS,
      },
      {
        name: "relatedProject",
        label: "关联项目/活动名称",
        type: "text",
        required: false,
        placeholder: "请输入项目或活动名称",
      },
      {
        name: "amount",
        label: "报销总金额",
        type: "number",
        required: true,
        placeholder: "请输入金额",
      },
      {
        name: "description",
        label: "报销明细清单",
        type: "textarea",
        required: true,
        placeholder: "请详细列出报销项目、金额等信息",
      },
      {
        name: "recipientAccount",
        label: "收款人账号",
        type: "text",
        required: false,
        placeholder: "请输入收款账号",
      },
      {
        name: "recipientBank",
        label: "收款人开户行",
        type: "text",
        required: false,
        placeholder: "请输入开户行信息",
      },
      {
        name: "attachments",
        label: "消费发票及支付截图",
        type: "file",
        required: false,
        helpText: "请上传发票、支付凭证等",
      },
    ],
  },

  labor_settlement: {
    key: "labor_settlement",
    label: "劳务结算",
    description: "结算实习生工资、讲师费、项目分润等",
    icon: "Users",
    color: "orange",
    dbType: "expense",
    fields: [
      {
        name: "createdAt",
        label: "申请日期",
        type: "auto",
        required: true,
        autoValue: "date",
      },
      {
        name: "recipientName",
        label: "收款人姓名",
        type: "text",
        required: true,
        placeholder: "请输入收款人姓名",
      },
      {
        name: "recipientIdCard",
        label: "收款人身份证号码",
        type: "text",
        required: true,
        placeholder: "请输入身份证号码",
      },
      {
        name: "subcategory",
        label: "结算款项性质",
        type: "select",
        required: true,
        options: [
          { value: "intern_salary", label: "A.社区日常运营-实习生/兼职工资" },
          { value: "lecturer_fee", label: "B.进阶活动-讲师/嘉宾劳务费" },
          { value: "project_profit_share", label: "C.进阶活动-项目负责人结余分成" },
        ],
      },
      {
        name: "relatedProject",
        label: "关联项目/活动名称",
        type: "text",
        required: false,
        placeholder: "请输入项目或活动名称",
      },
      {
        name: "amount",
        label: "申请结算金额",
        type: "number",
        required: true,
        placeholder: "请输入金额",
      },
      {
        name: "description",
        label: "结算依据/计算明细",
        type: "textarea",
        required: true,
        placeholder: "请详细说明结算依据、计算方式等",
      },
      {
        name: "recipientAccount",
        label: "收款人账号",
        type: "text",
        required: true,
        placeholder: "请输入收款账号",
      },
      {
        name: "recipientBank",
        label: "收款人开户行",
        type: "text",
        required: true,
        placeholder: "请输入开户行信息",
      },
      {
        name: "taxHandling",
        label: "个人所得税处理方式",
        type: "select",
        required: true,
        options: [
          { value: "self", label: "A.收款人自行提供劳务代开发票" },
          { value: "withhold", label: "B.由社区公账代扣代缴个税" },
        ],
        helpText: "金额800元以下免交增值税，超出800元以上金额代扣20%增值税",
      },
    ],
  },
};

// 审批状态配置
export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "已通过", color: "bg-green-100 text-green-800" },
  rejected: { label: "已拒绝", color: "bg-red-100 text-red-800" },
};

// 类型标签（向后兼容）
export const TYPE_LABELS: Record<string, string> = {
  income: "收入",
  expense: "支出",
};

// 旧的类别配置（向后兼容）
export const FINANCE_CATEGORIES = {
  income: [
    { value: "project_income", label: "项目收入" },
    { value: "service_income", label: "服务收入" },
    { value: "consulting_income", label: "咨询收入" },
    { value: "donation", label: "捐赠收入" },
    { value: "other_income", label: "其他收入" },
  ],
  expense: [
    ...DEFAULT_EXPENSE_CATEGORY_OPTIONS,
    { value: "competition_bonus", label: "比赛奖金" },
    { value: "labor_subsidy", label: "劳务补贴" },
    { value: "salary", label: "工资" },
  ],
} as const;

// 旧类别到新类别的映射（向后兼容）
export const LEGACY_CATEGORY_MAP: Record<string, FinanceApplicationType> = {
  project_income: "income_registration",
  service_income: "income_registration",
  consulting_income: "income_registration",
  donation: "income_registration",
  other_income: "income_registration",
  material_fee: "procurement",
  transportation_fee: "reimbursement",
  accommodation_fee: "reimbursement",
  office_fee: "reimbursement",
  communication_fee: "reimbursement",
  competition_bonus: "labor_settlement",
  labor_subsidy: "labor_settlement",
  welfare_fee: "reimbursement",
  salary: "labor_settlement",
  other_expense: "procurement",
};

// 获取申请类型配置
export function getApplicationTypeConfig(type: FinanceApplicationType): ApplicationTypeConfig | undefined {
  return APPLICATION_TYPES[type];
}

const APPLICATION_TYPE_DISPLAY_ORDER: FinanceApplicationType[] = [
  "reimbursement",
  "income_registration",
  "procurement",
  "labor_settlement",
];

// 获取所有申请类型列表
export function getAllApplicationTypes(): ApplicationTypeConfig[] {
  return APPLICATION_TYPE_DISPLAY_ORDER.map((type) => APPLICATION_TYPES[type]);
}

// 获取类别标签（支持新旧类别）
export function getCategoryLabel(category: string): string {
  // 先检查是否是新类别
  const config = APPLICATION_TYPES[category as FinanceApplicationType];
  if (config) {
    return config.label;
  }

  // 检查是否是旧类别
  const mappedType = LEGACY_CATEGORY_MAP[category];
  if (mappedType) {
    return APPLICATION_TYPES[mappedType].label;
  }

  // 返回原始值
  return category;
}

// 根据数据库type和category获取申请类型
export function getApplicationTypeFromRecord(type: string, category: string): FinanceApplicationType | null {
  // 如果category是新类别，直接返回
  if (category in APPLICATION_TYPES) {
    return category as FinanceApplicationType;
  }

  // 如果是旧类别，映射到新类别
  if (category in LEGACY_CATEGORY_MAP) {
    return LEGACY_CATEGORY_MAP[category];
  }

  // 无法识别，返回null
  return null;
}

// 验证申请类型是否有效
export function isValidApplicationType(type: string): type is FinanceApplicationType {
  return type in APPLICATION_TYPES;
}
