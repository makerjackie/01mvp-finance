import {
  APPLICATION_TYPES,
  isValidApplicationType,
  type FinanceApplicationType,
  type FormField,
} from "@/lib/finance-config";
import {
  FINANCE_APPLICATION_TYPE_ORDER,
  isFinanceFieldAutoValue,
  isFinanceFieldDataType,
  isFinanceFieldInputMode,
  isFinanceFieldWidgetType,
  type FinanceApplicationFormConfig,
  type FinanceFieldDataType,
  type FinanceFieldInputMode,
  type FinanceFieldWidgetType,
  type FinanceFormFieldConfig,
  type FinanceFormFieldOptionConfig,
} from "@/lib/finance-form-config";
import { prisma } from "@/server/lib/db";
import { listExpenseCategories } from "@/server/lib/finance-expense-categories";
import type { Prisma } from "@/server/prisma/generated/prisma/client";

type RawOptionInput = {
  value?: unknown;
  label?: unknown;
  isActive?: unknown;
};

type RawFieldInput = {
  name?: unknown;
  label?: unknown;
  dataType?: unknown;
  widgetType?: unknown;
  inputMode?: unknown;
  autoValue?: unknown;
  required?: unknown;
  placeholder?: unknown;
  helpText?: unknown;
  defaultValue?: unknown;
  isActive?: unknown;
  isSystemField?: unknown;
  options?: unknown;
};

type NormalizedOptionInput = {
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
};

type NormalizedFieldInput = {
  name: string;
  label: string;
  dataType: FinanceFieldDataType;
  widgetType: FinanceFieldWidgetType;
  inputMode: FinanceFieldInputMode;
  autoValue: "date" | "userName" | null;
  required: boolean;
  placeholder: string | null;
  helpText: string | null;
  defaultValue: string | null;
  isActive: boolean;
  isSystemField: boolean;
  sortOrder: number;
  options: NormalizedOptionInput[];
};

const TEMPLATE_STATUS_DRAFT = "draft";
const TEMPLATE_STATUS_PUBLISHED = "published";
const TEMPLATE_STATUS_ARCHIVED = "archived";

const MAX_FIELD_NAME_LENGTH = 64;
const MAX_TEXT_LENGTH = 200;
const FIELD_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

const isUniqueConstraintError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  if ("code" in error && (error as { code?: unknown }).code === "P2002") {
    return true;
  }

  const message = "message" in error ? String((error as { message?: unknown }).message || "") : "";
  return message.includes("Unique constraint failed");
};

const normalizeText = (value: unknown, maxLength = MAX_TEXT_LENGTH) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
};

const normalizeOptionalText = (value: unknown, maxLength = MAX_TEXT_LENGTH) => {
  const normalized = normalizeText(value, maxLength);
  return normalized || null;
};

const normalizeFieldName = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim().slice(0, MAX_FIELD_NAME_LENGTH);
  if (!normalized || !FIELD_NAME_PATTERN.test(normalized)) {
    return "";
  }

  return normalized;
};

const parseNumericOptionValue = (rawValue: unknown) => {
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue) ? rawValue : null;
  }

  if (typeof rawValue === "string" && rawValue.trim()) {
    const value = Number(rawValue.trim());
    return Number.isFinite(value) ? value : null;
  }

  return null;
};

const normalizeOptionValueByDataType = (value: unknown, dataType: FinanceFieldDataType) => {
  if (dataType === "string") {
    const normalized = normalizeText(value, MAX_TEXT_LENGTH);
    return normalized || null;
  }

  const numericValue = parseNumericOptionValue(value);
  if (numericValue === null) {
    return null;
  }

  if (dataType === "int") {
    if (!Number.isInteger(numericValue)) {
      return null;
    }
    return String(numericValue);
  }

  return String(numericValue);
};

const normalizeOptionInputs = (
  fieldName: string,
  dataType: FinanceFieldDataType,
  options: unknown,
): NormalizedOptionInput[] => {
  if (!Array.isArray(options)) {
    throw new Error(`字段 ${fieldName} 的选项必须是数组`);
  }

  const normalizedOptions: NormalizedOptionInput[] = [];
  const usedValues = new Set<string>();

  for (const [index, item] of options.entries()) {
    const option = item as RawOptionInput;
    const label = normalizeText(option?.label);
    if (!label) {
      throw new Error(`字段 ${fieldName} 的第 ${index + 1} 个选项名称不能为空`);
    }

    const rawOptionValue = typeof option?.value === "string" && option.value.trim().length > 0 ? option.value : label;
    const normalizedValue = normalizeOptionValueByDataType(rawOptionValue, dataType);
    if (!normalizedValue) {
      throw new Error(`字段 ${fieldName} 的第 ${index + 1} 个选项值无效`);
    }

    if (usedValues.has(normalizedValue)) {
      throw new Error(`字段 ${fieldName} 的选项值重复：${normalizedValue}`);
    }
    usedValues.add(normalizedValue);

    normalizedOptions.push({
      value: normalizedValue,
      label,
      isActive: option?.isActive !== false,
      sortOrder: normalizedOptions.length,
    });
  }

  if (normalizedOptions.length === 0) {
    throw new Error(`字段 ${fieldName} 至少需要一个选项`);
  }

  if (!normalizedOptions.some((item) => item.isActive)) {
    throw new Error(`字段 ${fieldName} 至少需要一个启用选项`);
  }

  return normalizedOptions;
};

const normalizeInputMode = (
  widgetType: FinanceFieldWidgetType,
  dataType: FinanceFieldDataType,
  value: unknown,
): FinanceFieldInputMode => {
  if (widgetType !== "input") {
    return "text";
  }

  if (isFinanceFieldInputMode(value)) {
    return value;
  }

  if (dataType === "int" || dataType === "float") {
    return "number";
  }

  return "text";
};

const normalizeFieldInputs = (fields: unknown): NormalizedFieldInput[] => {
  if (!Array.isArray(fields)) {
    throw new Error("fields 必须是数组");
  }

  const normalizedFields: NormalizedFieldInput[] = [];
  const usedNames = new Set<string>();

  for (const [index, item] of fields.entries()) {
    const field = item as RawFieldInput;

    const name = normalizeFieldName(field?.name);
    if (!name) {
      throw new Error(`第 ${index + 1} 个字段名称无效，仅支持字母开头和下划线`);
    }

    if (usedNames.has(name)) {
      throw new Error(`字段名称重复：${name}`);
    }
    usedNames.add(name);

    const label = normalizeText(field?.label);
    if (!label) {
      throw new Error(`字段 ${name} 的显示名称不能为空`);
    }

    if (!isFinanceFieldDataType(field?.dataType)) {
      throw new Error(`字段 ${name} 的数据类型无效`);
    }
    const dataType = field.dataType;

    if (!isFinanceFieldWidgetType(field?.widgetType)) {
      throw new Error(`字段 ${name} 的控件类型无效`);
    }
    const widgetType = field.widgetType;

    const inputMode = normalizeInputMode(widgetType, dataType, field?.inputMode);
    const autoValue = isFinanceFieldAutoValue(field?.autoValue) ? field.autoValue : null;

    if (inputMode === "auto" && !autoValue) {
      throw new Error(`字段 ${name} 为自动填充时必须配置 autoValue`);
    }

    const options =
      widgetType === "single_select" || widgetType === "multi_select"
        ? normalizeOptionInputs(name, dataType, field?.options)
        : [];

    normalizedFields.push({
      name,
      label,
      dataType,
      widgetType,
      inputMode,
      autoValue,
      required: field?.required === true,
      placeholder: normalizeOptionalText(field?.placeholder),
      helpText: normalizeOptionalText(field?.helpText),
      defaultValue: normalizeOptionalText(field?.defaultValue),
      isActive: field?.isActive !== false,
      isSystemField: field?.isSystemField === true,
      sortOrder: normalizedFields.length,
      options,
    });
  }

  if (normalizedFields.length === 0) {
    throw new Error("至少保留一个字段");
  }

  if (!normalizedFields.some((item) => item.isActive)) {
    throw new Error("至少启用一个字段");
  }

  return normalizedFields;
};

const includeTemplateFields: Prisma.FinanceFormTemplateInclude = {
  fields: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      options: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  },
};

type TemplateWithFields = Prisma.FinanceFormTemplateGetPayload<{
  include: typeof includeTemplateFields;
}>;

type TemplateOptionRecord = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

type TemplateFieldRecord = {
  id: string;
  name: string;
  label: string;
  dataType: string;
  widgetType: string;
  inputMode: string;
  autoValue: string | null;
  required: boolean;
  placeholder: string | null;
  helpText: string | null;
  defaultValue: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystemField: boolean;
  options?: TemplateOptionRecord[] | null;
};

type TemplateRecord = {
  applicationType: string;
  version: number;
  status: string;
  updatedAt: Date;
  fields: TemplateFieldRecord[];
};

const mapOption = (
  option: TemplateOptionRecord,
  options?: { activeOnly?: boolean },
): FinanceFormFieldOptionConfig | null => {
  if (options?.activeOnly && !option.isActive) {
    return null;
  }

  return {
    id: option.id,
    value: option.value,
    label: option.label,
    sortOrder: option.sortOrder,
    isActive: option.isActive,
  };
};

const mapField = (field: TemplateFieldRecord, options?: { activeOnly?: boolean }): FinanceFormFieldConfig | null => {
  if (options?.activeOnly && !field.isActive) {
    return null;
  }

  const dataType = isFinanceFieldDataType(field.dataType) ? field.dataType : "string";
  const widgetType = isFinanceFieldWidgetType(field.widgetType) ? field.widgetType : "input";
  const inputMode = isFinanceFieldInputMode(field.inputMode) ? field.inputMode : "text";
  const autoValue = isFinanceFieldAutoValue(field.autoValue) ? field.autoValue : null;

  const mappedOptions = (field.options || [])
    .map((item: TemplateOptionRecord) => mapOption(item, options))
    .filter((item: FinanceFormFieldOptionConfig | null): item is FinanceFormFieldOptionConfig => Boolean(item));

  return {
    id: field.id,
    name: field.name,
    label: field.label,
    dataType,
    widgetType,
    inputMode,
    autoValue,
    required: field.required,
    placeholder: field.placeholder,
    helpText: field.helpText,
    defaultValue: field.defaultValue,
    sortOrder: field.sortOrder,
    isActive: field.isActive,
    isSystemField: field.isSystemField,
    options: mappedOptions,
  };
};

const mapTemplate = (template: TemplateRecord, options?: { activeOnly?: boolean }): FinanceApplicationFormConfig => {
  const applicationType = isValidApplicationType(template.applicationType) ? template.applicationType : "reimbursement";

  return {
    applicationType,
    version: template.version,
    status:
      template.status === TEMPLATE_STATUS_PUBLISHED ||
      template.status === TEMPLATE_STATUS_DRAFT ||
      template.status === TEMPLATE_STATUS_ARCHIVED
        ? template.status
        : TEMPLATE_STATUS_DRAFT,
    fields: template.fields
      .map((item: TemplateFieldRecord) => mapField(item, options))
      .filter((item: FinanceFormFieldConfig | null): item is FinanceFormFieldConfig => Boolean(item)),
    updatedAt: template.updatedAt.toISOString(),
  };
};

const normalizeLegacyFieldDataType = (field: FormField): FinanceFieldDataType => {
  if (field.type === "number") {
    return "float";
  }
  return "string";
};

const normalizeLegacyFieldWidgetType = (field: FormField): FinanceFieldWidgetType => {
  if (field.type === "select") {
    return "single_select";
  }
  return "input";
};

const normalizeLegacyFieldInputMode = (field: FormField): FinanceFieldInputMode => {
  if (field.type === "textarea") return "textarea";
  if (field.type === "number") return "number";
  if (field.type === "date") return "date";
  if (field.type === "file") return "file";
  if (field.type === "auto") return "auto";
  return "text";
};

const toSeedOptions = async (
  applicationType: FinanceApplicationType,
  field: FormField,
): Promise<NormalizedOptionInput[]> => {
  if (field.type !== "select") {
    return [];
  }

  if (applicationType === "reimbursement" && field.name === "subcategory") {
    const categories = await listExpenseCategories({ includeInactive: true });
    return categories.map((item, index) => ({
      value: item.value,
      label: item.label,
      sortOrder: index,
      isActive: item.isActive,
    }));
  }

  return (field.options || []).map((item, index) => ({
    value: item.value,
    label: item.label,
    sortOrder: index,
    isActive: true,
  }));
};

const buildDefaultFields = async (applicationType: FinanceApplicationType) => {
  const baseConfig = APPLICATION_TYPES[applicationType];
  if (!baseConfig) {
    return [] as NormalizedFieldInput[];
  }

  const fields: NormalizedFieldInput[] = [];

  for (const [index, field] of baseConfig.fields.entries()) {
    const options = await toSeedOptions(applicationType, field);

    fields.push({
      name: field.name,
      label: field.label,
      dataType: normalizeLegacyFieldDataType(field),
      widgetType: normalizeLegacyFieldWidgetType(field),
      inputMode: normalizeLegacyFieldInputMode(field),
      autoValue: field.type === "auto" && isFinanceFieldAutoValue(field.autoValue) ? field.autoValue : null,
      required: field.required,
      placeholder: normalizeOptionalText(field.placeholder),
      helpText: normalizeOptionalText(field.helpText),
      defaultValue: null,
      isActive: true,
      isSystemField: false,
      sortOrder: index,
      options,
    });
  }

  return fields;
};

const createTemplateWithFields = async (
  applicationType: FinanceApplicationType,
  status: "draft" | "published" | "archived",
  version: number,
  fields: NormalizedFieldInput[],
  userId?: string,
) => {
  return prisma.financeFormTemplate.create({
    data: {
      applicationType,
      status,
      version,
      createdById: userId,
      ...(status === TEMPLATE_STATUS_PUBLISHED
        ? {
            publishedById: userId,
            publishedAt: new Date(),
          }
        : {}),
      fields: {
        create: fields.map((field) => ({
          name: field.name,
          label: field.label,
          dataType: field.dataType,
          widgetType: field.widgetType,
          inputMode: field.inputMode,
          autoValue: field.autoValue,
          required: field.required,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          sortOrder: field.sortOrder,
          isActive: field.isActive,
          isSystemField: field.isSystemField,
          options: {
            create: field.options.map((option) => ({
              value: option.value,
              label: option.label,
              sortOrder: option.sortOrder,
              isActive: option.isActive,
            })),
          },
        })),
      },
    },
    include: includeTemplateFields,
  });
};

const cloneFieldsFromTemplate = (template: { fields: TemplateFieldRecord[] }): NormalizedFieldInput[] =>
  template.fields.map((field: TemplateFieldRecord, index: number) => ({
    name: field.name,
    label: field.label,
    dataType: isFinanceFieldDataType(field.dataType) ? field.dataType : "string",
    widgetType: isFinanceFieldWidgetType(field.widgetType) ? field.widgetType : "input",
    inputMode: isFinanceFieldInputMode(field.inputMode) ? field.inputMode : "text",
    autoValue: isFinanceFieldAutoValue(field.autoValue) ? field.autoValue : null,
    required: field.required,
    placeholder: field.placeholder,
    helpText: field.helpText,
    defaultValue: field.defaultValue,
    isActive: field.isActive,
    isSystemField: field.isSystemField,
    sortOrder: index,
    options: (field.options || []).map((option: TemplateOptionRecord, optionIndex: number) => ({
      value: option.value,
      label: option.label,
      sortOrder: optionIndex,
      isActive: option.isActive,
    })),
  }));

const ensureSeededApplicationType = async (applicationType: FinanceApplicationType) => {
  const published = await prisma.financeFormTemplate.findFirst({
    where: {
      applicationType,
      status: TEMPLATE_STATUS_PUBLISHED,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    include: includeTemplateFields,
  });

  if (!published) {
    const defaultFields = await buildDefaultFields(applicationType);
    try {
      await createTemplateWithFields(applicationType, TEMPLATE_STATUS_PUBLISHED, 1, defaultFields);
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  const draft = await prisma.financeFormTemplate.findFirst({
    where: {
      applicationType,
      status: TEMPLATE_STATUS_DRAFT,
    },
    orderBy: [{ updatedAt: "desc" }],
    include: includeTemplateFields,
  });

  if (draft) {
    return;
  }

  const latestPublished = await prisma.financeFormTemplate.findFirst({
    where: {
      applicationType,
      status: TEMPLATE_STATUS_PUBLISHED,
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    include: includeTemplateFields,
  });

  if (!latestPublished) {
    return;
  }

  const clonedFields = cloneFieldsFromTemplate(latestPublished);
  try {
    await createTemplateWithFields(applicationType, TEMPLATE_STATUS_DRAFT, latestPublished.version, clonedFields);
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }
};

const ensureSeededAllApplicationTypes = async () => {
  for (const applicationType of FINANCE_APPLICATION_TYPE_ORDER) {
    await ensureSeededApplicationType(applicationType);
  }
};

const getLatestTemplate = async (
  applicationType: FinanceApplicationType,
  status: "draft" | "published",
): Promise<TemplateWithFields> => {
  const template = await prisma.financeFormTemplate.findFirst({
    where: {
      applicationType,
      status,
    },
    orderBy:
      status === TEMPLATE_STATUS_PUBLISHED ? [{ version: "desc" }, { updatedAt: "desc" }] : [{ updatedAt: "desc" }],
    include: includeTemplateFields,
  });

  if (!template) {
    throw new Error("未找到表单配置");
  }

  return template as TemplateWithFields;
};

export async function getAdminFormConfig(applicationType: FinanceApplicationType) {
  await ensureSeededApplicationType(applicationType);

  const [draft, published] = await Promise.all([
    getLatestTemplate(applicationType, TEMPLATE_STATUS_DRAFT),
    getLatestTemplate(applicationType, TEMPLATE_STATUS_PUBLISHED),
  ]);

  return {
    applicationType,
    draft: mapTemplate(draft),
    published: mapTemplate(published),
  };
}

export async function listAdminFormConfigSummaries() {
  await ensureSeededAllApplicationTypes();

  const rows = await prisma.financeFormTemplate.findMany({
    where: {
      status: {
        in: [TEMPLATE_STATUS_DRAFT, TEMPLATE_STATUS_PUBLISHED],
      },
    },
    orderBy: [{ applicationType: "asc" }, { version: "desc" }, { updatedAt: "desc" }],
  });

  const summaryMap = new Map<
    FinanceApplicationType,
    {
      applicationType: FinanceApplicationType;
      draftVersion: number | null;
      draftUpdatedAt: string | null;
      publishedVersion: number | null;
      publishedUpdatedAt: string | null;
    }
  >();

  for (const applicationType of FINANCE_APPLICATION_TYPE_ORDER) {
    summaryMap.set(applicationType, {
      applicationType,
      draftVersion: null,
      draftUpdatedAt: null,
      publishedVersion: null,
      publishedUpdatedAt: null,
    });
  }

  for (const row of rows) {
    if (!isValidApplicationType(row.applicationType)) {
      continue;
    }

    const current = summaryMap.get(row.applicationType);
    if (!current) {
      continue;
    }

    if (row.status === TEMPLATE_STATUS_DRAFT && current.draftVersion === null) {
      current.draftVersion = row.version;
      current.draftUpdatedAt = row.updatedAt.toISOString();
    }

    if (row.status === TEMPLATE_STATUS_PUBLISHED && current.publishedVersion === null) {
      current.publishedVersion = row.version;
      current.publishedUpdatedAt = row.updatedAt.toISOString();
    }
  }

  return FINANCE_APPLICATION_TYPE_ORDER.map((applicationType) => summaryMap.get(applicationType)!);
}

export async function saveDraftFormConfig(applicationType: FinanceApplicationType, fields: unknown, userId: string) {
  await ensureSeededApplicationType(applicationType);
  const draft = await getLatestTemplate(applicationType, TEMPLATE_STATUS_DRAFT);
  const normalizedFields = normalizeFieldInputs(fields);

  await prisma.$transaction(async (tx) => {
    await tx.financeFormField.deleteMany({
      where: {
        templateId: draft.id,
      },
    });

    for (const field of normalizedFields) {
      await tx.financeFormField.create({
        data: {
          templateId: draft.id,
          name: field.name,
          label: field.label,
          dataType: field.dataType,
          widgetType: field.widgetType,
          inputMode: field.inputMode,
          autoValue: field.autoValue,
          required: field.required,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          sortOrder: field.sortOrder,
          isActive: field.isActive,
          isSystemField: field.isSystemField,
          options: {
            create: field.options.map((option) => ({
              value: option.value,
              label: option.label,
              sortOrder: option.sortOrder,
              isActive: option.isActive,
            })),
          },
        },
      });
    }

    await tx.financeFormTemplate.update({
      where: { id: draft.id },
      data: {
        createdById: userId,
      },
    });
  });

  return getAdminFormConfig(applicationType);
}

export async function publishDraftFormConfig(applicationType: FinanceApplicationType, userId: string) {
  await ensureSeededApplicationType(applicationType);

  const [draft, latestPublished] = await Promise.all([
    getLatestTemplate(applicationType, TEMPLATE_STATUS_DRAFT),
    prisma.financeFormTemplate.findFirst({
      where: {
        applicationType,
        status: TEMPLATE_STATUS_PUBLISHED,
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      include: includeTemplateFields,
    }),
  ]);

  const nextVersion = (latestPublished?.version || 0) + 1;
  const draftFields = cloneFieldsFromTemplate(draft);

  await prisma.$transaction(async (tx) => {
    await tx.financeFormTemplate.updateMany({
      where: {
        applicationType,
        status: TEMPLATE_STATUS_PUBLISHED,
      },
      data: {
        status: TEMPLATE_STATUS_ARCHIVED,
      },
    });

    await tx.financeFormTemplate.create({
      data: {
        applicationType,
        status: TEMPLATE_STATUS_PUBLISHED,
        version: nextVersion,
        createdById: userId,
        publishedById: userId,
        publishedAt: new Date(),
        fields: {
          create: draftFields.map((field) => ({
            name: field.name,
            label: field.label,
            dataType: field.dataType,
            widgetType: field.widgetType,
            inputMode: field.inputMode,
            autoValue: field.autoValue,
            required: field.required,
            placeholder: field.placeholder,
            helpText: field.helpText,
            defaultValue: field.defaultValue,
            sortOrder: field.sortOrder,
            isActive: field.isActive,
            isSystemField: field.isSystemField,
            options: {
              create: field.options.map((option) => ({
                value: option.value,
                label: option.label,
                sortOrder: option.sortOrder,
                isActive: option.isActive,
              })),
            },
          })),
        },
      },
      include: includeTemplateFields,
    });

    await tx.financeFormTemplate.update({
      where: { id: draft.id },
      data: {
        version: nextVersion,
      },
    });
  });

  return getAdminFormConfig(applicationType);
}

export async function getPublishedFormConfig(applicationType: FinanceApplicationType) {
  await ensureSeededApplicationType(applicationType);
  const published = await getLatestTemplate(applicationType, TEMPLATE_STATUS_PUBLISHED);
  return mapTemplate(published, { activeOnly: true });
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const validateDataTypeValue = (value: unknown, dataType: FinanceFieldDataType) => {
  if (value === null || value === undefined || value === "") {
    return { valid: true, normalized: null as string | null };
  }

  if (dataType === "string") {
    if (typeof value === "string") {
      return { valid: true, normalized: value.trim() };
    }
    return { valid: true, normalized: String(value) };
  }

  const numericValue = parseNumericOptionValue(value);
  if (numericValue === null) {
    return { valid: false, normalized: null };
  }

  if (dataType === "int" && !Number.isInteger(numericValue)) {
    return { valid: false, normalized: null };
  }

  return { valid: true, normalized: String(numericValue) };
};

export function validateFormPayloadByConfig(config: FinanceApplicationFormConfig, payload: unknown) {
  if (!isObjectRecord(payload)) {
    return {
      valid: false,
      errors: ["formPayload 必须是对象"],
      normalized: {} as Record<string, unknown>,
    };
  }

  const errors: string[] = [];
  const normalized: Record<string, unknown> = {};

  for (const field of config.fields) {
    const rawValue = payload[field.name];

    if (field.widgetType === "multi_select") {
      if (rawValue === undefined || rawValue === null || rawValue === "") {
        if (field.required) {
          errors.push(`字段 ${field.label} 为必填`);
        }
        continue;
      }

      if (!Array.isArray(rawValue)) {
        errors.push(`字段 ${field.label} 必须为数组`);
        continue;
      }

      const activeOptionValues = new Set(
        field.options.filter((option) => option.isActive).map((option) => option.value),
      );
      const normalizedList: string[] = [];

      for (const item of rawValue) {
        const normalizedValue = normalizeOptionValueByDataType(item, field.dataType);
        if (!normalizedValue || !activeOptionValues.has(normalizedValue)) {
          errors.push(`字段 ${field.label} 包含无效选项`);
          break;
        }
        if (!normalizedList.includes(normalizedValue)) {
          normalizedList.push(normalizedValue);
        }
      }

      if (normalizedList.length === 0 && field.required) {
        errors.push(`字段 ${field.label} 至少选择一项`);
      }

      normalized[field.name] = normalizedList;
      continue;
    }

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (field.required && field.inputMode !== "file") {
        errors.push(`字段 ${field.label} 为必填`);
      }
      continue;
    }

    if (field.widgetType === "single_select") {
      const activeOptionValues = new Set(
        field.options.filter((option) => option.isActive).map((option) => option.value),
      );
      const normalizedValue = normalizeOptionValueByDataType(rawValue, field.dataType);
      if (!normalizedValue || !activeOptionValues.has(normalizedValue)) {
        errors.push(`字段 ${field.label} 选项无效`);
        continue;
      }
      normalized[field.name] = normalizedValue;
      continue;
    }

    const dataTypeValidation = validateDataTypeValue(rawValue, field.dataType);
    if (!dataTypeValidation.valid) {
      errors.push(`字段 ${field.label} 数据类型不匹配`);
      continue;
    }

    normalized[field.name] = dataTypeValidation.normalized;
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized,
  };
}
