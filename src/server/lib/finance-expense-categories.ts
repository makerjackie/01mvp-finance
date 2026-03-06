import { DEFAULT_EXPENSE_CATEGORY_OPTIONS } from "@/lib/finance-expense-categories";
import { prisma } from "@/server/lib/db";

export type ExpenseCategoryConfigItem = {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
};

type ExpenseCategoryInput = {
  value?: unknown;
  label?: unknown;
  isActive?: unknown;
};

const MAX_VALUE_LENGTH = 64;
const FALLBACK_VALUE_PREFIX = "custom_expense";

const normalizeLabel = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\s+/g, " ");
};

const normalizeValue = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized.slice(0, MAX_VALUE_LENGTH);
};

const deriveValueFromLabel = (label: string) =>
  normalizeValue(
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, ""),
  );

const withUniqueSuffix = (candidate: string, usedValues: Set<string>) => {
  const initialValue = (candidate || FALLBACK_VALUE_PREFIX).slice(0, MAX_VALUE_LENGTH);
  if (!usedValues.has(initialValue)) {
    return initialValue;
  }

  const base = initialValue.replace(/_\d+$/, "");
  let suffix = 2;

  while (suffix < 10_000) {
    const suffixText = `_${suffix}`;
    const allowedBaseLength = Math.max(1, MAX_VALUE_LENGTH - suffixText.length);
    const next = `${base.slice(0, allowedBaseLength)}${suffixText}`;
    if (!usedValues.has(next)) {
      return next;
    }
    suffix += 1;
  }

  throw new Error("费用归属类别编码重复，请调整后重试");
};

const mapConfigRows = (
  rows: Array<{ id: string; value: string; label: string; sortOrder: number; isActive: boolean }>,
): ExpenseCategoryConfigItem[] =>
  rows.map((row) => ({
    id: row.id,
    value: row.value,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }));

const ensureExpenseCategoriesSeeded = async () => {
  const count = await prisma.financeExpenseCategory.count();
  if (count > 0) {
    return;
  }

  await prisma.financeExpenseCategory.createMany({
    data: DEFAULT_EXPENSE_CATEGORY_OPTIONS.map((option, index) => ({
      value: option.value,
      label: option.label,
      sortOrder: index,
      isActive: true,
    })),
  });
};

const normalizeExpenseCategoryInputs = (categories: ExpenseCategoryInput[]) => {
  const normalized: Array<{ value: string; label: string; sortOrder: number; isActive: boolean }> = [];
  const usedValues = new Set<string>();

  for (const [index, category] of categories.entries()) {
    const label = normalizeLabel(category?.label);
    if (!label) {
      throw new Error(`第 ${index + 1} 项类别名称不能为空`);
    }

    const explicitValue = normalizeValue(category?.value);
    const inferredValue = deriveValueFromLabel(label);
    const fallbackValue = `${FALLBACK_VALUE_PREFIX}_${index + 1}`;
    const rawValue = explicitValue || inferredValue || fallbackValue;
    const value = withUniqueSuffix(rawValue, usedValues);
    usedValues.add(value);

    normalized.push({
      value,
      label,
      sortOrder: normalized.length,
      isActive: category?.isActive !== false,
    });
  }

  if (normalized.length === 0) {
    throw new Error("至少保留一个费用归属类别");
  }

  if (!normalized.some((item) => item.isActive)) {
    throw new Error("至少启用一个费用归属类别");
  }

  return normalized;
};

export async function listExpenseCategories(options?: {
  includeInactive?: boolean;
}): Promise<ExpenseCategoryConfigItem[]> {
  await ensureExpenseCategoriesSeeded();

  const rows = await prisma.financeExpenseCategory.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return mapConfigRows(rows);
}

export async function replaceExpenseCategories(
  categories: ExpenseCategoryInput[],
  updatedById?: string,
): Promise<ExpenseCategoryConfigItem[]> {
  const normalizedCategories = normalizeExpenseCategoryInputs(categories);

  await prisma.$transaction(async (tx) => {
    await tx.financeExpenseCategory.deleteMany({});

    await tx.financeExpenseCategory.createMany({
      data: normalizedCategories.map((item) => ({
        value: item.value,
        label: item.label,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        createdById: updatedById,
        updatedById: updatedById,
      })),
    });
  });

  return listExpenseCategories({ includeInactive: true });
}
