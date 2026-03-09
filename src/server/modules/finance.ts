import { Hono } from "hono";
import type { Prisma } from "@/server/prisma/generated/prisma/client";
import { prisma } from "@/server/lib/db";
import { auth } from "@/server/lib/auth";
import { requireRoles, type AuthEnv } from "@/server/middleware";
import { notifyAdmins, createNotification } from "@/server/lib/notification";
import { createAuditLog } from "@/server/lib/audit";
import { listExpenseCategories, replaceExpenseCategories } from "@/server/lib/finance-expense-categories";
import {
  getAdminFormConfig,
  getPublishedFormConfig,
  listAdminFormConfigSummaries,
  publishDraftFormConfig,
  saveDraftFormConfig,
  validateFormPayloadByConfig,
} from "@/server/lib/finance-form-config";
import { APPLICATION_TYPES, isValidApplicationType, type FinanceApplicationType } from "@/lib/finance-config";
import {
  clampCommunitySharePercent,
  DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT,
  getSettlementDescription,
  inferProjectSettlementConfig,
  inferProjectCategory,
  isProjectCategory,
  isProjectSettlementMode,
  normalizeProjectName,
  PROJECT_CATEGORY_LABELS,
  PROJECT_CATEGORY_VALUES,
  PROJECT_SETTLEMENT_MODE_LABELS,
  toProjectNormalizedName,
  type ProjectCategory,
  type ProjectSettlementMode,
} from "@/lib/project-categories";
import { canReviewFinance, resolveRole } from "@/lib/rbac";

const app = new Hono<AuthEnv>()
  .use("/admin/projects/:id/config", requireRoles("admin"))
  .use("/admin/expense-categories", requireRoles("admin"))
  .use("/admin/form-config", requireRoles("admin"))
  .use("/admin/form-config/publish", requireRoles("admin"))
  .use("/admin/all", requireRoles(["reviewer", "admin"]))
  .use("/admin/project-options", requireRoles(["reviewer", "admin"]))
  .use("/:id/review", requireRoles(["reviewer", "admin"]))
  .use("/:id/mark-paid", requireRoles(["reviewer", "admin"]))
  .use("/admin/stats", requireRoles(["reviewer", "admin"]))
  .use("/admin/project-stats", requireRoles(["reviewer", "admin"]))
  .use("/admin/export", requireRoles(["reviewer", "admin"]));

const PROJECT_SEARCH_MAX_LIMIT = 30;
const APPLICATION_TYPE_LABELS: Record<FinanceApplicationType, string> = {
  income_registration: APPLICATION_TYPES.income_registration.label,
  procurement: APPLICATION_TYPES.procurement.label,
  reimbursement: APPLICATION_TYPES.reimbursement.label,
  labor_settlement: APPLICATION_TYPES.labor_settlement.label,
};

const resolveProjectCategory = (value: unknown): ProjectCategory => (isProjectCategory(value) ? value : "other");
const resolveSettlementMode = (value: unknown): ProjectSettlementMode =>
  isProjectSettlementMode(value) ? value : "cost_only";

const parsePositiveAmount = (value: unknown): number | null => {
  const amount = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

const normalizeBankAccountNumber = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, "");
  return normalized ? normalized : null;
};

const normalizeBankName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
};

const normalizeAttachmentUrls = (value: unknown): string[] | null => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return null;

  const urls: string[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const url = item.trim();
      if (!url) continue;
      urls.push(url);
      continue;
    }

    if (item && typeof item === "object" && "url" in item) {
      const url = item.url;
      if (typeof url === "string" && url.trim()) {
        urls.push(url.trim());
        continue;
      }
    }

    return null;
  }

  return urls;
};

const normalizeOptionalText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const formatProjectDisplayName = (name: string, eventDate?: Date | null, city?: string | null) => {
  const parts = [name];

  if (eventDate) {
    parts.push(eventDate.toISOString().split("T")[0]);
  }

  const normalizedCity = normalizeOptionalText(city);
  if (normalizedCity) {
    parts.push(normalizedCity);
  }

  return parts.join(" ");
};

const runBackgroundTask = (label: string, task: Promise<unknown>) => {
  void task.catch((error) => {
    console.error(`[finance] background task failed: ${label}`, error);
  });
};

const getProjectDescriptionMap = async (projectNames: string[]) => {
  const normalizedNames = Array.from(
    new Set(projectNames.map((name) => normalizeProjectName(name)).filter((name): name is string => Boolean(name))),
  );

  if (normalizedNames.length === 0) {
    return new Map<string, string>();
  }

  const records = await prisma.financeRecord.findMany({
    where: {
      relatedProject: {
        in: normalizedNames,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      relatedProject: true,
      summary: true,
      description: true,
    },
    take: Math.max(normalizedNames.length * 4, 20),
  });

  const descriptionMap = new Map<string, string>();
  for (const record of records) {
    const projectName = normalizeProjectName(record.relatedProject || "");
    if (!projectName || descriptionMap.has(projectName)) {
      continue;
    }

    const description = normalizeOptionalText(record.summary) || normalizeOptionalText(record.description);
    if (!description) {
      continue;
    }

    descriptionMap.set(projectName, description);
    if (descriptionMap.size >= normalizedNames.length) {
      break;
    }
  }

  return descriptionMap;
};

const extractDescriptionFromJson = (value: Prisma.JsonValue | null | undefined) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return normalizeOptionalText((value as Record<string, unknown>).description);
};

const extractCityFromJson = (value: Prisma.JsonValue | null | undefined) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return normalizeOptionalText((value as Record<string, unknown>).city);
};

const getProjectDescriptionByAuditMap = async (projectIds: string[]) => {
  const uniqueIds = Array.from(new Set(projectIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      resource: "project",
      resourceId: {
        in: uniqueIds,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      resourceId: true,
      metadata: true,
      changes: true,
    },
    take: Math.max(uniqueIds.length * 5, 20),
  });

  const descriptionMap = new Map<string, string>();
  for (const log of logs) {
    if (descriptionMap.has(log.resourceId)) {
      continue;
    }

    const description = extractDescriptionFromJson(log.metadata) || extractDescriptionFromJson(log.changes);
    if (!description) {
      continue;
    }

    descriptionMap.set(log.resourceId, description);
    if (descriptionMap.size >= uniqueIds.length) {
      break;
    }
  }

  return descriptionMap;
};

const getProjectCityByAuditMap = async (projectIds: string[]) => {
  const uniqueIds = Array.from(new Set(projectIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      resource: "project",
      resourceId: {
        in: uniqueIds,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      resourceId: true,
      metadata: true,
      changes: true,
    },
    take: Math.max(uniqueIds.length * 5, 20),
  });

  const cityMap = new Map<string, string>();
  for (const log of logs) {
    if (cityMap.has(log.resourceId)) {
      continue;
    }

    const city = extractCityFromJson(log.metadata) || extractCityFromJson(log.changes);
    if (!city) {
      continue;
    }

    cityMap.set(log.resourceId, city);
    if (cityMap.size >= uniqueIds.length) {
      break;
    }
  }

  return cityMap;
};

const ensureProjectByName = async ({
  name,
  subcategory,
  applicationType,
  userId,
  settlementMode,
  communitySharePercent,
}: {
  name: string;
  subcategory?: string | null;
  applicationType?: string | null;
  userId: string;
  settlementMode?: ProjectSettlementMode;
  communitySharePercent?: number;
}) => {
  const normalizedName = normalizeProjectName(name);
  if (!normalizedName) return null;

  const normalizedKey = toProjectNormalizedName(normalizedName);
  if (!normalizedKey) return null;

  const inferredCategory = inferProjectCategory({
    subcategory,
    applicationType,
  });
  const inferredSettlement = inferProjectSettlementConfig({
    subcategory,
    applicationType,
  });
  const targetSettlementMode = settlementMode || inferredSettlement.settlementMode;
  const targetCommunitySharePercent = clampCommunitySharePercent(
    communitySharePercent ?? inferredSettlement.communitySharePercent,
  );

  const existing = await prisma.project.findUnique({
    where: {
      normalizedName: normalizedKey,
    },
  });

  if (existing) {
    const shouldUpdateCategory = existing.category === "other" && inferredCategory !== "other";
    const shouldUpdateSettlementMode = existing.settlementMode !== targetSettlementMode && settlementMode !== undefined;
    const shouldUpdateSharePercent =
      existing.communitySharePercent !== targetCommunitySharePercent &&
      (communitySharePercent !== undefined || shouldUpdateSettlementMode);

    if (shouldUpdateCategory || shouldUpdateSettlementMode || shouldUpdateSharePercent) {
      const updated = await prisma.project.update({
        where: {
          id: existing.id,
        },
        data: {
          ...(shouldUpdateCategory ? { category: inferredCategory } : {}),
          ...(shouldUpdateSettlementMode ? { settlementMode: targetSettlementMode } : {}),
          ...(shouldUpdateSharePercent ? { communitySharePercent: targetCommunitySharePercent } : {}),
        },
      });
      return updated;
    }
    return existing;
  }

  return prisma.project.create({
    data: {
      name: normalizedName,
      normalizedName: normalizedKey,
      category: inferredCategory,
      settlementMode: targetSettlementMode,
      communitySharePercent: targetCommunitySharePercent,
      createdById: userId,
    },
  });
};

// 获取项目目录（用于关联项目搜索）
app.get("/projects", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const query = c.req.query("query")?.trim() ?? "";
  const parsedLimit = Number(c.req.query("limit") || 8);
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(PROJECT_SEARCH_MAX_LIMIT, Math.floor(parsedLimit)))
    : 8;

  const projects = await prisma.project.findMany({
    where: {
      isActive: true,
      ...(query
        ? {
            name: {
              contains: query,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  const [auditDescriptionMap, auditCityMap, recordDescriptionMap] = await Promise.all([
    getProjectDescriptionByAuditMap(projects.map((project) => project.id)),
    getProjectCityByAuditMap(projects.map((project) => project.id)),
    getProjectDescriptionMap(projects.map((project) => project.name)),
  ]);

  return c.json({
    success: true,
    data: projects.map((project) => ({
      id: project.id,
      name: formatProjectDisplayName(project.name, project.eventDate, auditCityMap.get(project.id)),
      city: auditCityMap.get(project.id) || null,
      category: project.category,
      categoryLabel: PROJECT_CATEGORY_LABELS[resolveProjectCategory(project.category)],
      settlementMode: resolveSettlementMode(project.settlementMode),
      settlementModeLabel: PROJECT_SETTLEMENT_MODE_LABELS[resolveSettlementMode(project.settlementMode)],
      communitySharePercent: clampCommunitySharePercent(project.communitySharePercent),
      settlementDescription: getSettlementDescription(
        resolveSettlementMode(project.settlementMode),
        clampCommunitySharePercent(project.communitySharePercent),
      ),
      description: auditDescriptionMap.get(project.id) || recordDescriptionMap.get(project.name) || null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })),
  });
});

// 新建项目（搜索不到时快捷创建）
app.post("/projects", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const data = await c.req.json();

  const rawName = typeof data?.name === "string" ? data.name : "";
  const name = normalizeProjectName(rawName);

  if (name.length < 2 || name.length > 60) {
    return c.json({ error: "项目名称长度需在 2 到 60 个字符之间" }, 400);
  }

  const inferredCategory = inferProjectCategory({
    subcategory: typeof data?.subcategory === "string" ? data.subcategory : undefined,
    applicationType: typeof data?.applicationType === "string" ? data.applicationType : undefined,
  });
  const inferredSettlement = inferProjectSettlementConfig({
    subcategory: typeof data?.subcategory === "string" ? data.subcategory : undefined,
    applicationType: typeof data?.applicationType === "string" ? data.applicationType : undefined,
  });

  const requestedCategory = isProjectCategory(data?.category) ? data.category : inferredCategory;
  const requestedSettlementMode: ProjectSettlementMode = isProjectSettlementMode(data?.settlementMode)
    ? data.settlementMode
    : inferredSettlement.settlementMode;
  const requestedCommunitySharePercent = clampCommunitySharePercent(
    data?.communitySharePercent ?? inferredSettlement.communitySharePercent,
  );
  const requestedCity = normalizeOptionalText(data?.city);
  const requestedDescription = normalizeOptionalText(data?.description);

  // 处理活动日期
  let eventDate: Date | null = null;
  if (data?.eventDate) {
    const parsedDate = new Date(data.eventDate);
    if (!isNaN(parsedDate.getTime())) {
      eventDate = parsedDate;
    }
  }

  const normalizedName = toProjectNormalizedName(name);

  const existing = await prisma.project.findUnique({
    where: {
      normalizedName,
    },
  });

  if (existing) {
    const shouldUpdateCategory = existing.category === "other" && requestedCategory !== "other";
    const shouldUpdateSettlementMode = existing.settlementMode !== requestedSettlementMode;
    const shouldUpdateSharePercent = existing.communitySharePercent !== requestedCommunitySharePercent;
    const shouldUpdateEventDate = eventDate !== null && existing.eventDate?.getTime() !== eventDate.getTime();

    const project =
      shouldUpdateCategory || shouldUpdateSettlementMode || shouldUpdateSharePercent || shouldUpdateEventDate
        ? await prisma.project.update({
            where: { id: existing.id },
            data: {
              ...(shouldUpdateCategory && { category: requestedCategory }),
              ...(shouldUpdateSettlementMode && { settlementMode: requestedSettlementMode }),
              ...(shouldUpdateSharePercent && { communitySharePercent: requestedCommunitySharePercent }),
              ...(shouldUpdateEventDate && { eventDate }),
            },
          })
        : existing;

    if (requestedDescription || requestedCity) {
      await createAuditLog({
        userId: session.user.id,
        userName: session.user.name || "Unknown",
        action: "update",
        resource: "project",
        resourceId: project.id,
        changes: {
          ...(requestedDescription ? { description: requestedDescription } : {}),
          ...(requestedCity ? { city: requestedCity } : {}),
        },
        metadata: {
          name: project.name,
          ...(requestedDescription ? { description: requestedDescription } : {}),
          ...(requestedCity ? { city: requestedCity } : {}),
        },
        req: c.req.raw,
      });
    }

    const resolvedSettlementMode = resolveSettlementMode(project.settlementMode);
    const resolvedSharePercent = clampCommunitySharePercent(project.communitySharePercent);
    const [auditDescriptionMap, auditCityMap, recordDescriptionMap] = await Promise.all([
      getProjectDescriptionByAuditMap([project.id]),
      getProjectCityByAuditMap([project.id]),
      getProjectDescriptionMap([project.name]),
    ]);
    const projectCity = requestedCity || auditCityMap.get(project.id) || null;
    const displayName = formatProjectDisplayName(project.name, project.eventDate, projectCity);

    return c.json({
      success: true,
      data: {
        id: project.id,
        name: displayName,
        category: project.category,
        categoryLabel: PROJECT_CATEGORY_LABELS[resolveProjectCategory(project.category)],
        settlementMode: resolvedSettlementMode,
        settlementModeLabel: PROJECT_SETTLEMENT_MODE_LABELS[resolvedSettlementMode],
        communitySharePercent: resolvedSharePercent,
        settlementDescription: getSettlementDescription(resolvedSettlementMode, resolvedSharePercent),
        city: projectCity,
        description:
          requestedDescription || auditDescriptionMap.get(project.id) || recordDescriptionMap.get(project.name) || null,
        eventDate: project.eventDate?.toISOString(),
        created: false,
      },
    });
  }

  const project = await prisma.project.create({
    data: {
      name,
      normalizedName,
      category: requestedCategory,
      settlementMode: requestedSettlementMode,
      communitySharePercent: requestedCommunitySharePercent,
      eventDate,
      createdById: session.user.id,
    },
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "create",
    resource: "project",
    resourceId: project.id,
    metadata: {
      name: project.name,
      category: project.category,
      ...(requestedCity ? { city: requestedCity } : {}),
      ...(requestedDescription ? { description: requestedDescription } : {}),
    },
    req: c.req.raw,
  });

  const displayName = formatProjectDisplayName(project.name, project.eventDate, requestedCity);
  const descriptionMap = await getProjectDescriptionMap([project.name]);

  return c.json({
    success: true,
    data: {
      id: project.id,
      name: displayName,
      city: requestedCity || null,
      category: project.category,
      categoryLabel: PROJECT_CATEGORY_LABELS[resolveProjectCategory(project.category)],
      settlementMode: requestedSettlementMode,
      settlementModeLabel: PROJECT_SETTLEMENT_MODE_LABELS[requestedSettlementMode],
      communitySharePercent: requestedCommunitySharePercent,
      settlementDescription: getSettlementDescription(requestedSettlementMode, requestedCommunitySharePercent),
      description: requestedDescription || descriptionMap.get(project.name) || null,
      eventDate: project.eventDate?.toISOString(),
      created: true,
    },
  });
});

// 管理员：更新项目结算配置
app.put("/admin/projects/:id/config", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "未登录" }, 401);

  const projectId = c.req.param("id");
  const data = await c.req.json();

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    return c.json({ error: "项目不存在" }, 404);
  }

  const settlementMode: ProjectSettlementMode | null = isProjectSettlementMode(data?.settlementMode)
    ? data.settlementMode
    : null;
  if (!settlementMode) {
    return c.json({ error: "无效的结算模式" }, 400);
  }

  const communitySharePercent = clampCommunitySharePercent(
    data?.communitySharePercent ?? DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT,
  );

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      settlementMode,
      communitySharePercent,
    },
  });

  await createAuditLog({
    userId: user.id,
    userName: user.name || "Unknown",
    action: "update",
    resource: "project",
    resourceId: projectId,
    changes: {
      settlementMode,
      communitySharePercent,
    },
    req: c.req.raw,
  });

  return c.json({
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      categoryLabel: PROJECT_CATEGORY_LABELS[resolveProjectCategory(updated.category)],
      settlementMode,
      settlementModeLabel: PROJECT_SETTLEMENT_MODE_LABELS[settlementMode],
      communitySharePercent,
      settlementDescription: getSettlementDescription(settlementMode, communitySharePercent),
    },
  });
});

// 创建财务记录
app.post("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const data = await c.req.json();
  const categoryValue = typeof data.category === "string" ? data.category : "";

  // 基本验证
  if (!data.type || !data.category) {
    return c.json({ error: "缺少必填字段" }, 400);
  }

  if (!["income", "expense"].includes(data.type)) {
    return c.json({ error: "无效的记录类型" }, 400);
  }

  const amount = parsePositiveAmount(data.amount);
  if (amount === null) {
    return c.json({ error: "金额必须是大于0的数字" }, 400);
  }

  const attachmentUrls = normalizeAttachmentUrls(data.attachments);
  if (attachmentUrls === null) {
    return c.json({ error: "附件格式无效" }, 400);
  }

  const rawRelatedProject = typeof data.relatedProject === "string" ? data.relatedProject : "";
  const normalizedRelatedProject = normalizeProjectName(rawRelatedProject);
  let relatedProject: string | null = normalizedRelatedProject || null;

  let formPayload: Record<string, unknown> | null = null;
  let formVersion: number | null = null;

  if (isValidApplicationType(categoryValue)) {
    const publishedConfig = await getPublishedFormConfig(categoryValue);
    const payloadValidation = validateFormPayloadByConfig(
      publishedConfig,
      isRecordObject(data.formPayload) ? data.formPayload : {},
    );

    if (!payloadValidation.valid) {
      return c.json({ error: payloadValidation.errors[0] || "表单配置校验失败" }, 400);
    }

    formPayload = payloadValidation.normalized;
    formVersion = publishedConfig.version;
  }

  const normalizedDescription =
    normalizeOptionalText(data.description) ||
    (isValidApplicationType(categoryValue) ? `${APPLICATION_TYPE_LABELS[categoryValue]}申请` : "财务申请");

  if (normalizedRelatedProject) {
    const project = await ensureProjectByName({
      name: normalizedRelatedProject,
      subcategory: typeof data.subcategory === "string" ? data.subcategory : null,
      applicationType: typeof data.category === "string" ? data.category : null,
      userId: session.user.id,
    });

    if (project?.name) {
      relatedProject = project.name;
    }
  }

  const record = await prisma.financeRecord.create({
    data: {
      type: data.type,
      category: data.category,
      subcategory: data.subcategory || null,
      amount,
      relatedProject,
      description: normalizedDescription,
      attachments: attachmentUrls,
      recipientName: data.recipientName || null,
      recipientAccount: data.recipientAccount || null,
      recipientBank: data.recipientBank || null,
      recipientIdCard: data.recipientIdCard || null,
      transactionNo: data.transactionNo || null,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : null,
      summary: data.summary || null,
      purpose: data.purpose || null,
      paymentStatus: "unpaid",
      accountPeriod: data.accountPeriod || null,
      taxHandling: data.taxHandling || null,
      formPayload: (formPayload as Prisma.InputJsonValue | null) ?? undefined,
      formVersion,
      isCommunity: data.isCommunity !== undefined ? data.isCommunity : true, // 默认为社区账目
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (data.category === "reimbursement") {
    const bankAccountNumber = normalizeBankAccountNumber(data.recipientAccount);
    const bankName = normalizeBankName(data.recipientBank);

    if (bankAccountNumber || bankName) {
      runBackgroundTask(
        "sync-user-bank-info",
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            ...(bankAccountNumber ? { bankAccountNumber } : {}),
            ...(bankName ? { bankName } : {}),
          },
        }),
      );
    }
  }

  runBackgroundTask(
    "notify-admins",
    notifyAdmins({
      type: "finance_submitted",
      title: "新的财务申请",
      content: `${session.user.name} 提交了一条${data.type === "income" ? "收入" : "支出"}申请`,
      link: `/finance/edit/${record.id}`,
      financeRecordId: record.id,
    }),
  );

  runBackgroundTask(
    "create-audit-log",
    createAuditLog({
      userId: session.user.id,
      userName: session.user.name || "Unknown",
      action: "create",
      resource: "finance_record",
      resourceId: record.id,
      metadata: { type: data.type, amount: data.amount },
      req: c.req.raw,
    }),
  );

  return c.json({ success: true, data: record });
});

// 获取费用归属类别（前端提交表单使用）
app.get("/expense-categories", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const categories = await listExpenseCategories();
  return c.json({ success: true, data: categories });
});

// 管理员：获取费用归属类别配置
app.get("/admin/expense-categories", async (c) => {
  const categories = await listExpenseCategories({ includeInactive: true });
  return c.json({ success: true, data: categories });
});

// 管理员：更新费用归属类别配置
app.put("/admin/expense-categories", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "未登录" }, 401);

  const data = await c.req.json();
  if (!Array.isArray(data?.categories)) {
    return c.json({ error: "categories 必须是数组" }, 400);
  }

  try {
    const categories = await replaceExpenseCategories(data.categories, user.id);

    await createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "update",
      resource: "finance_expense_category_config",
      resourceId: "expense_categories",
      metadata: {
        count: categories.length,
      },
      req: c.req.raw,
    });

    return c.json({ success: true, data: categories });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "配置保存失败" }, 400);
  }
});

// 前端：获取指定申请类型的已发布表单配置
app.get("/form-config", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const applicationTypeParam = c.req.query("applicationType");
  if (typeof applicationTypeParam !== "string" || !isValidApplicationType(applicationTypeParam)) {
    return c.json({ error: "applicationType 无效" }, 400);
  }

  try {
    const config = await getPublishedFormConfig(applicationTypeParam);
    return c.json({ success: true, data: config });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "加载表单配置失败" }, 400);
  }
});

// 管理员：获取表单配置（支持汇总或单类型详情）
app.get("/admin/form-config", async (c) => {
  const applicationTypeParam = c.req.query("applicationType");

  try {
    if (!applicationTypeParam) {
      const summaries = await listAdminFormConfigSummaries();
      return c.json({ success: true, data: summaries });
    }

    if (!isValidApplicationType(applicationTypeParam)) {
      return c.json({ error: "applicationType 无效" }, 400);
    }

    const config = await getAdminFormConfig(applicationTypeParam);
    return c.json({ success: true, data: config });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "加载表单配置失败" }, 400);
  }
});

// 管理员：保存指定申请类型草稿配置
app.put("/admin/form-config", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "未登录" }, 401);

  const applicationTypeParam = c.req.query("applicationType");
  if (typeof applicationTypeParam !== "string" || !isValidApplicationType(applicationTypeParam)) {
    return c.json({ error: "applicationType 无效" }, 400);
  }

  const data = await c.req.json();

  try {
    const config = await saveDraftFormConfig(applicationTypeParam, data?.fields, user.id);

    await createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "update",
      resource: "finance_form_config",
      resourceId: applicationTypeParam,
      metadata: {
        actionType: "save_draft",
        draftVersion: config.draft.version,
        fieldCount: config.draft.fields.length,
      },
      req: c.req.raw,
    });

    return c.json({ success: true, data: config });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "保存草稿失败" }, 400);
  }
});

// 管理员：发布指定申请类型配置
app.post("/admin/form-config/publish", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "未登录" }, 401);

  const applicationTypeParam = c.req.query("applicationType");
  if (typeof applicationTypeParam !== "string" || !isValidApplicationType(applicationTypeParam)) {
    return c.json({ error: "applicationType 无效" }, 400);
  }

  try {
    const config = await publishDraftFormConfig(applicationTypeParam, user.id);

    await createAuditLog({
      userId: user.id,
      userName: user.name || "Unknown",
      action: "update",
      resource: "finance_form_config",
      resourceId: applicationTypeParam,
      metadata: {
        actionType: "publish",
        publishedVersion: config.published.version,
      },
      req: c.req.raw,
    });

    return c.json({ success: true, data: config });
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "发布失败" }, 400);
  }
});

// 获取当前用户的财务记录列表
app.get("/my-records", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const records = await prisma.financeRecord.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  return c.json({ success: true, data: records });
});

// 获取单条财务记录详情
app.get("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }
  const role = resolveRole(session.user.role);

  const id = c.req.param("id");
  const record = await prisma.financeRecord.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  // 审核员/管理员可查看全部，普通用户仅可查看本人
  if (!canReviewFinance(role) && record.userId !== session.user.id) {
    return c.json({ error: "无权访问" }, 403);
  }

  return c.json({ success: true, data: record });
});

// 更新财务记录（用户只能更新自己的待审核记录）
app.put("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }
  const role = resolveRole(session.user.role);
  const isAdmin = role === "admin";
  const canReview = canReviewFinance(role);

  const id = c.req.param("id");
  const data = await c.req.json();

  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  const isOwnRecord = record.userId === session.user.id;
  const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const requestedKeys = Object.keys(payload).filter((key) => payload[key] !== undefined);
  const reviewerCrossRecordAllowed =
    canReview &&
    !isAdmin &&
    !isOwnRecord &&
    requestedKeys.length > 0 &&
    requestedKeys.every((key) => key === "isCommunity");

  if (!isAdmin && !isOwnRecord && !reviewerCrossRecordAllowed) {
    return c.json({ error: "无权修改" }, 403);
  }

  if (!isAdmin && isOwnRecord && record.status !== "pending") {
    return c.json({ error: "只能修改待审核的记录" }, 403);
  }

  if (reviewerCrossRecordAllowed && record.status !== "pending") {
    return c.json({ error: "只能标记待审核记录的账目归属" }, 403);
  }

  if (data.isCommunity !== undefined && typeof data.isCommunity !== "boolean") {
    return c.json({ error: "isCommunity 必须是布尔值" }, 400);
  }

  const updateData: Prisma.FinanceRecordUpdateInput = {};
  if (data.type !== undefined) {
    if (!["income", "expense"].includes(data.type)) {
      return c.json({ error: "无效的记录类型" }, 400);
    }
    updateData.type = data.type;
  }
  if (data.category !== undefined) updateData.category = data.category;
  if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
  if (data.amount !== undefined) {
    const amount = parsePositiveAmount(data.amount);
    if (amount === null) {
      return c.json({ error: "金额必须是大于0的数字" }, 400);
    }
    updateData.amount = amount;
  }
  if (data.relatedProject !== undefined) {
    const normalizedRelatedProject = normalizeProjectName(
      typeof data.relatedProject === "string" ? data.relatedProject : "",
    );

    if (!normalizedRelatedProject) {
      updateData.relatedProject = null;
    } else {
      const project = await ensureProjectByName({
        name: normalizedRelatedProject,
        subcategory:
          typeof data.subcategory === "string"
            ? data.subcategory
            : typeof record.subcategory === "string"
              ? record.subcategory
              : null,
        applicationType:
          typeof data.category === "string"
            ? data.category
            : typeof record.category === "string"
              ? record.category
              : null,
        userId: session.user.id,
      });

      updateData.relatedProject = project?.name || normalizedRelatedProject;
    }
  }
  if (data.description !== undefined) updateData.description = data.description;
  if (data.recipientName !== undefined) updateData.recipientName = data.recipientName;
  if (data.recipientAccount !== undefined) updateData.recipientAccount = data.recipientAccount;
  if (data.recipientBank !== undefined) updateData.recipientBank = data.recipientBank;
  if (data.recipientIdCard !== undefined) updateData.recipientIdCard = data.recipientIdCard;
  if (data.transactionNo !== undefined) updateData.transactionNo = data.transactionNo;
  if (data.transactionDate !== undefined)
    updateData.transactionDate = data.transactionDate ? new Date(data.transactionDate) : null;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.purpose !== undefined) updateData.purpose = data.purpose;
  if (data.accountPeriod !== undefined) updateData.accountPeriod = data.accountPeriod;
  if (data.taxHandling !== undefined) updateData.taxHandling = data.taxHandling;
  if (data.attachments !== undefined) {
    const attachmentUrls = normalizeAttachmentUrls(data.attachments);
    if (attachmentUrls === null) {
      return c.json({ error: "附件格式无效" }, 400);
    }
    updateData.attachments = attachmentUrls;
  }

  // 审核流程中，管理员可修改全部；审核员仅可跨人修改 isCommunity
  if ((isAdmin || reviewerCrossRecordAllowed) && data.isCommunity !== undefined) {
    updateData.isCommunity = data.isCommunity;
  }

  const updated = await prisma.financeRecord.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "update",
    resource: "finance_record",
    resourceId: id,
    changes: updateData,
    req: c.req.raw,
  });

  return c.json({ success: true, data: updated });
});

// 删除财务记录（用户只能删除自己的待审核记录）
app.delete("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }
  const role = resolveRole(session.user.role);
  const isAdmin = role === "admin";

  const id = c.req.param("id");
  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  // 普通用户只能删除自己的待审核记录
  if (!isAdmin) {
    if (record.userId !== session.user.id) {
      return c.json({ error: "无权删除" }, 403);
    }
    if (record.status !== "pending") {
      return c.json({ error: "只能删除待审核的记录" }, 403);
    }
  }

  await prisma.financeRecord.delete({
    where: { id },
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "delete",
    resource: "finance_record",
    resourceId: id,
    req: c.req.raw,
  });

  return c.json({ success: true });
});

// 审核员/管理员：获取所有财务记录
app.get("/admin/all", async (c) => {
  const { type, status, category } = c.req.query();

  const records = await prisma.financeRecord.findMany({
    where: {
      ...(type && { type }),
      ...(status && { status }),
      ...(category && { category }),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  return c.json({ success: true, data: records });
});

// 审核员/管理员：获取项目/活动名称选项（按新增时间倒序）
app.get("/admin/project-options", async (c) => {
  const projects = await prisma.project.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return c.json({
    success: true,
    data: projects.map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
    })),
  });
});

// 审核员/管理员：审核财务记录
app.post("/:id/review", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "未登录" }, 401);

  const id = c.req.param("id");
  const data = await c.req.json();

  if (!data.status || !["approved", "rejected"].includes(data.status)) {
    return c.json({ error: "无效的审核状态" }, 400);
  }

  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  const updated = await prisma.financeRecord.update({
    where: { id },
    data: {
      status: data.status,
      reviewNote: data.reviewNote || null,
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  await createNotification({
    userId: record.userId,
    type: "finance_reviewed",
    title: data.status === "approved" ? "申请已通过" : "申请已拒绝",
    content: `您的财务申请已${data.status === "approved" ? "通过" : "拒绝"}审核`,
    link: `/finance/edit/${record.id}`,
    financeRecordId: record.id,
  });

  await createAuditLog({
    userId: user.id,
    userName: user.name || "Unknown",
    action: "review",
    resource: "finance_record",
    resourceId: id,
    changes: { status: data.status, reviewNote: data.reviewNote },
    req: c.req.raw,
  });

  return c.json({ success: true, data: updated });
});

// 审核员/管理员：标记为已支付
app.post("/:id/mark-paid", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "未登录" }, 401);

  const id = c.req.param("id");
  const data = await c.req.json();

  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  if (record.status !== "approved") {
    return c.json({ error: "只能标记已审核通过的记录为已支付" }, 400);
  }

  const updated = await prisma.financeRecord.update({
    where: { id },
    data: {
      paymentStatus: "paid",
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paidBy: user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  await createNotification({
    userId: record.userId,
    type: "finance_paid",
    title: "款项已支付",
    content: "您的财务申请款项已支付",
    link: `/finance/edit/${record.id}`,
    financeRecordId: record.id,
  });

  await createAuditLog({
    userId: user.id,
    userName: user.name || "Unknown",
    action: "mark_paid",
    resource: "finance_record",
    resourceId: id,
    changes: { paymentStatus: "paid", paymentDate: data.paymentDate },
    req: c.req.raw,
  });

  return c.json({ success: true, data: updated });
});

// 审核员/管理员：获取财务统计
app.get("/admin/stats", async (c) => {
  const [totalIncome, totalExpense, communityIncome, communityExpense, pendingCount, approvedCount, rejectedCount] =
    await Promise.all([
      // 总收入（已通过的收入记录 - 公司账目）
      prisma.financeRecord.aggregate({
        where: {
          type: "income",
          status: "approved",
        },
        _sum: {
          amount: true,
        },
      }),
      // 总支出（已通过的支出记录 - 公司账目）
      prisma.financeRecord.aggregate({
        where: {
          type: "expense",
          status: "approved",
        },
        _sum: {
          amount: true,
        },
      }),
      // 社区收入（已通过的社区收入记录）
      prisma.financeRecord.aggregate({
        where: {
          type: "income",
          status: "approved",
          isCommunity: true,
        },
        _sum: {
          amount: true,
        },
      }),
      // 社区支出（已通过的社区支出记录）
      prisma.financeRecord.aggregate({
        where: {
          type: "expense",
          status: "approved",
          isCommunity: true,
        },
        _sum: {
          amount: true,
        },
      }),
      // 待审核数量
      prisma.financeRecord.count({
        where: { status: "pending" },
      }),
      // 已通过数量
      prisma.financeRecord.count({
        where: { status: "approved" },
      }),
      // 已拒绝数量
      prisma.financeRecord.count({
        where: { status: "rejected" },
      }),
    ]);

  const companyBalance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);
  const communityBalance = (communityIncome._sum.amount || 0) - (communityExpense._sum.amount || 0);

  return c.json({
    success: true,
    data: {
      // 公司账目（全部）
      company: {
        totalIncome: totalIncome._sum.amount || 0,
        totalExpense: totalExpense._sum.amount || 0,
        balance: companyBalance,
      },
      // 社区账目（公开）
      community: {
        totalIncome: communityIncome._sum.amount || 0,
        totalExpense: communityExpense._sum.amount || 0,
        balance: communityBalance,
      },
      pendingCount,
      approvedCount,
      rejectedCount,
    },
  });
});

// 审核员/管理员：按项目类别查看统计
app.get("/admin/project-stats", async (c) => {
  const scope = c.req.query("scope");
  const daysQuery = c.req.query("days");
  const startDateQuery = c.req.query("startDate");
  const endDateQuery = c.req.query("endDate");
  const scopeFilter = scope === "community" ? { isCommunity: true } : scope === "company" ? { isCommunity: false } : {};
  const days = Number(daysQuery);

  const parsedStartDate =
    typeof startDateQuery === "string" && startDateQuery.trim()
      ? new Date(`${startDateQuery.trim()}T00:00:00.000`)
      : null;
  const parsedEndDateRaw =
    typeof endDateQuery === "string" && endDateQuery.trim() ? new Date(`${endDateQuery.trim()}T23:59:59.999`) : null;

  const startDate = parsedStartDate && !Number.isNaN(parsedStartDate.getTime()) ? parsedStartDate : null;
  const endDate = parsedEndDateRaw && !Number.isNaN(parsedEndDateRaw.getTime()) ? parsedEndDateRaw : null;

  const hasCustomDateRange = Boolean(startDate || endDate);
  const createdAtFilter = hasCustomDateRange
    ? {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    : Number.isFinite(days) && days > 0
      ? {
          gte: new Date(Date.now() - Math.floor(days) * 24 * 60 * 60 * 1000),
        }
      : undefined;

  const [projects, approvedRecords] = await Promise.all([
    prisma.project.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        normalizedName: true,
        category: true,
        settlementMode: true,
        communitySharePercent: true,
      },
    }),
    prisma.financeRecord.findMany({
      where: {
        status: "approved",
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        ...scopeFilter,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        type: true,
        category: true,
        subcategory: true,
        amount: true,
        relatedProject: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const categoryStatsMap = new Map<
    ProjectCategory,
    {
      category: ProjectCategory;
      label: string;
      projectCount: number;
      recordCount: number;
      totalIncome: number;
      totalExpense: number;
      balance: number;
    }
  >();

  for (const category of PROJECT_CATEGORY_VALUES) {
    categoryStatsMap.set(category, {
      category,
      label: PROJECT_CATEGORY_LABELS[category],
      projectCount: 0,
      recordCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    });
  }

  const projectLookup = new Map<
    string,
    {
      id: string;
      name: string;
      category: ProjectCategory;
      settlementMode: ProjectSettlementMode;
      communitySharePercent: number;
    }
  >();

  for (const project of projects) {
    const category = resolveProjectCategory(project.category);
    const settlementMode = resolveSettlementMode(project.settlementMode);
    const communitySharePercent = clampCommunitySharePercent(project.communitySharePercent);
    const bucket = categoryStatsMap.get(category);
    if (bucket) {
      bucket.projectCount += 1;
    }

    projectLookup.set(project.normalizedName, {
      id: project.id,
      name: project.name,
      category,
      settlementMode,
      communitySharePercent,
    });
  }

  const projectStatsMap = new Map<
    string,
    {
      projectId: string | null;
      name: string;
      category: ProjectCategory;
      categoryLabel: string;
      settlementMode: ProjectSettlementMode;
      settlementModeLabel: string;
      communitySharePercent: number;
      settlementDescription: string;
      recordCount: number;
      totalIncome: number;
      totalExpense: number;
      balance: number;
      communityShareIncome: number;
      teamShareIncome: number;
    }
  >();

  let totalIncome = 0;
  let totalExpense = 0;
  let unmatchedProjectCount = 0;
  let trackedRecords = 0;
  let estimatedCommunityShareIncome = 0;
  let estimatedTeamShareIncome = 0;

  for (const record of approvedRecords) {
    if (record.type === "income") {
      totalIncome += record.amount;
    } else {
      totalExpense += record.amount;
    }

    if (!record.relatedProject) continue;

    const normalizedProjectName = toProjectNormalizedName(record.relatedProject);
    if (!normalizedProjectName) continue;
    trackedRecords += 1;

    const linkedProject = projectLookup.get(normalizedProjectName);
    const category = linkedProject?.category ?? "other";
    const displayName = linkedProject?.name || normalizeProjectName(record.relatedProject);
    const settlementMode = linkedProject?.settlementMode ?? "cost_only";
    const communitySharePercent = linkedProject?.communitySharePercent ?? DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT;
    const categoryBucket = categoryStatsMap.get(category);

    if (categoryBucket) {
      categoryBucket.recordCount += 1;
    }

    const projectBucket = projectStatsMap.get(normalizedProjectName) || {
      projectId: linkedProject?.id || null,
      name: displayName,
      category,
      categoryLabel: PROJECT_CATEGORY_LABELS[category],
      settlementMode,
      settlementModeLabel: PROJECT_SETTLEMENT_MODE_LABELS[settlementMode],
      communitySharePercent,
      settlementDescription: getSettlementDescription(settlementMode, communitySharePercent),
      recordCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      communityShareIncome: 0,
      teamShareIncome: 0,
    };

    projectBucket.recordCount += 1;

    if (record.type === "income") {
      projectBucket.totalIncome += record.amount;
      if (categoryBucket) {
        categoryBucket.totalIncome += record.amount;
      }

      if (projectBucket.settlementMode === "profit_share") {
        const communityIncomePart = (record.amount * projectBucket.communitySharePercent) / 100;
        const teamIncomePart = record.amount - communityIncomePart;
        projectBucket.communityShareIncome += communityIncomePart;
        projectBucket.teamShareIncome += teamIncomePart;
        estimatedCommunityShareIncome += communityIncomePart;
        estimatedTeamShareIncome += teamIncomePart;
      } else {
        projectBucket.communityShareIncome += record.amount;
        estimatedCommunityShareIncome += record.amount;
      }
    } else {
      projectBucket.totalExpense += record.amount;
      if (categoryBucket) {
        categoryBucket.totalExpense += record.amount;
      }
    }

    projectBucket.balance = projectBucket.totalIncome - projectBucket.totalExpense;
    projectStatsMap.set(normalizedProjectName, projectBucket);
  }

  for (const [normalizedName, stats] of projectStatsMap.entries()) {
    if (!projectLookup.has(normalizedName) && stats.category === "other") {
      unmatchedProjectCount += 1;
    }
  }

  const categoryStats = Array.from(categoryStatsMap.values()).map((item) => ({
    ...item,
    balance: item.totalIncome - item.totalExpense,
  }));

  const projectStats = Array.from(projectStatsMap.values()).sort((a, b) => {
    if (b.recordCount !== a.recordCount) {
      return b.recordCount - a.recordCount;
    }
    return Math.abs(b.balance) - Math.abs(a.balance);
  });

  const projectCatalog = projects
    .map((project) => {
      const settlementMode = resolveSettlementMode(project.settlementMode);
      const communitySharePercent = clampCommunitySharePercent(project.communitySharePercent);
      const statsKey = project.normalizedName;
      const recordStats = projectStatsMap.get(statsKey);

      return {
        id: project.id,
        name: project.name,
        category: resolveProjectCategory(project.category),
        categoryLabel: PROJECT_CATEGORY_LABELS[resolveProjectCategory(project.category)],
        settlementMode,
        settlementModeLabel: PROJECT_SETTLEMENT_MODE_LABELS[settlementMode],
        communitySharePercent,
        settlementDescription: getSettlementDescription(settlementMode, communitySharePercent),
        recordCount: recordStats?.recordCount || 0,
        totalIncome: recordStats?.totalIncome || 0,
      };
    })
    .sort((a, b) => {
      if (b.recordCount !== a.recordCount) {
        return b.recordCount - a.recordCount;
      }
      return b.totalIncome - a.totalIncome;
    });

  const incomeRecords = approvedRecords
    .filter((record) => record.type === "income")
    .map((record) => ({
      id: record.id,
      type: "income" as const,
      amount: record.amount,
      relatedProject: record.relatedProject || "未关联项目",
      description: record.description || "",
      category: record.category,
      subcategory: record.subcategory || null,
      applicantName: record.user.name || "未知申请人",
      createdAt: record.createdAt.toISOString(),
    }));

  const expenseRecords = approvedRecords
    .filter((record) => record.type === "expense")
    .map((record) => ({
      id: record.id,
      type: "expense" as const,
      amount: record.amount,
      relatedProject: record.relatedProject || "未关联项目",
      description: record.description || "",
      category: record.category,
      subcategory: record.subcategory || null,
      applicantName: record.user.name || "未知申请人",
      createdAt: record.createdAt.toISOString(),
    }));

  return c.json({
    success: true,
    data: {
      scope: scope === "community" || scope === "company" ? scope : "all",
      summary: {
        totalProjects: projects.length,
        involvedProjects: projectStats.length,
        trackedRecords,
        unmatchedProjectCount,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        estimatedCommunityShareIncome,
        estimatedTeamShareIncome,
      },
      categories: categoryStats,
      projects: projectStats,
      catalog: projectCatalog,
      incomeRecords,
      expenseRecords,
    },
  });
});

// 公开接口：获取社区财务统计（无需登录）
app.get("/public/stats", async (c) => {
  const [communityIncome, communityExpense] = await Promise.all([
    // 社区收入（已通过的社区收入记录）
    prisma.financeRecord.aggregate({
      where: {
        type: "income",
        status: "approved",
        isCommunity: true,
      },
      _sum: {
        amount: true,
      },
    }),
    // 社区支出（已通过的社区支出记录）
    prisma.financeRecord.aggregate({
      where: {
        type: "expense",
        status: "approved",
        isCommunity: true,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const communityBalance = (communityIncome._sum.amount || 0) - (communityExpense._sum.amount || 0);

  return c.json({
    success: true,
    data: {
      totalIncome: communityIncome._sum.amount || 0,
      totalExpense: communityExpense._sum.amount || 0,
      balance: communityBalance,
    },
  });
});

// 审核员/管理员：导出CSV
app.get("/admin/export", async (c) => {
  const { type, status, isCommunity, relatedProject, paymentStatus } = c.req.query();
  const normalizedPaymentStatus = paymentStatus === "paid" || paymentStatus === "unpaid" ? paymentStatus : null;

  const filters: Prisma.FinanceRecordWhereInput[] = [];
  if (type) filters.push({ type });
  if (status) filters.push({ status });
  if (isCommunity !== undefined) filters.push({ isCommunity: isCommunity === "true" });
  if (relatedProject) filters.push({ relatedProject });
  if (normalizedPaymentStatus) {
    // 支付状态仅对支出记录生效；若同时选择“类型=收入”，AND 条件会自然返回空结果。
    filters.push({ type: "expense" });
    filters.push({ paymentStatus: normalizedPaymentStatus });
  }

  const records = await prisma.financeRecord.findMany({
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  // 计算累计余额
  let balance = 0;
  const recordsWithBalance = records
    .reverse()
    .map((record) => {
      if (record.status === "approved") {
        if (record.type === "income") {
          balance += record.amount;
        } else {
          balance -= record.amount;
        }
      }
      return { ...record, balance };
    })
    .reverse();

  // 生成CSV内容
  const headers = [
    "流水号",
    "交易日期",
    "收入",
    "支出",
    "余额",
    "摘要",
    "对方户名",
    "对方账号",
    "对方开户行",
    "用途",
    "分类",
    "审核状态",
    "支付状态",
    "支付日期",
    "账期",
    "个税处理",
    "申请人",
    "申请人电话",
    "审核备注",
    "审核时间",
  ];

  const rows = recordsWithBalance.map((record) => [
    record.transactionNo || record.id,
    record.transactionDate
      ? new Date(record.transactionDate).toISOString().split("T")[0].replace(/-/g, "")
      : new Date(record.createdAt).toISOString().split("T")[0].replace(/-/g, ""),
    record.type === "income" && record.status === "approved" ? record.amount.toFixed(2) : "",
    record.type === "expense" && record.status === "approved" ? record.amount.toFixed(2) : "",
    record.status === "approved" ? record.balance.toFixed(2) : "",
    record.summary || record.description,
    record.recipientName || "",
    record.recipientAccount || "",
    record.recipientBank || "",
    record.purpose || record.relatedProject || "",
    record.category,
    record.status === "pending" ? "待审核" : record.status === "approved" ? "已通过" : "已拒绝",
    record.type === "expense" ? (record.paymentStatus === "paid" ? "已支付" : "未支付") : "-",
    record.paymentDate ? new Date(record.paymentDate).toISOString().split("T")[0] : "",
    record.accountPeriod || "",
    record.taxHandling === "withhold"
      ? "代扣代缴"
      : record.taxHandling === "self"
        ? "自行申报"
        : record.taxHandling === "none"
          ? "无需处理"
          : "",
    record.user.name,
    record.user.phoneNumber || "",
    record.reviewNote || "",
    record.reviewedAt ? new Date(record.reviewedAt).toLocaleString("zh-CN") : "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  // 添加BOM以支持Excel正确显示中文
  const bom = "\uFEFF";

  return new Response(bom + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance_records_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
});

export default app;
