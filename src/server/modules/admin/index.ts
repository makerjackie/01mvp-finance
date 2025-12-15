import { Hono } from "hono";
import { Prisma } from "@/server/prisma/generated/prisma/client";
import { adminMiddleware, requirePermission, type AuthEnv } from "@/server/middleware";
import { prisma } from "@/server/lib/db";
import { logger } from "@/server/lib/logger";
import {
  createFeatureFlag,
  deleteFeatureFlag,
  listFeatureFlags,
  updateFeatureFlag,
  type FeatureFlagStatus,
} from "@/server/lib/feature-flags";
import { PERMISSIONS, hasPermission, resolveRole } from "@/lib/rbac";

type AdminUserDTO = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
  lastActiveAt: Date | null;
};

const mapUser = (user: {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
  sessions: { updatedAt: Date }[];
}): AdminUserDTO => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  banned: Boolean(user.banned),
  banReason: user.banReason,
  createdAt: user.createdAt,
  lastActiveAt: user.sessions[0]?.updatedAt ?? null,
});

type ImportUserPayload = {
  email: string;
  name?: string;
  role?: string | null;
};

const toCsv = (users: AdminUserDTO[]) => {
  const header = "name,email,role,banned,lastActiveAt,createdAt";
  const rows = users.map((user) =>
    [
      `"${user.name?.replace(/"/g, '""') || ""}"`,
      user.email,
      user.role || "user",
      user.banned ? "banned" : "active",
      user.lastActiveAt?.toISOString() || "",
      user.createdAt.toISOString(),
    ].join(","),
  );
  return [header, ...rows].join("\n");
};

const parseCsv = (raw: string): ImportUserPayload[] => {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const hasHeader = lines[0].toLowerCase().includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const [name = "", email = "", role = "user"] = line.split(",").map((part) => part.trim());
      if (!email) return null;
      return {
        email: email.toLowerCase(),
        name: name || email.split("@")[0] || "导入用户",
        role: role || "user",
      };
    })
    .filter(Boolean) as ImportUserPayload[];
};

const normalizeRole = (role?: string | null) => {
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  return "user";
};

const adminRoutes = new Hono<{
  Variables: AuthEnv["Variables"];
}>()
  .use("/*", adminMiddleware)
  .use("/users/*", requirePermission(PERMISSIONS.manageUsers))
  .use("/feature-flags/*", requirePermission(PERMISSIONS.manageFeatureFlags))
  // 用户列表
  .get("/users", async (c) => {
    const q = c.req.query("q")?.trim() || "";
    const limit = Math.min(Number(c.req.query("limit")) || 50, 200);

    const where: Prisma.UserWhereInput | undefined = q
      ? {
          OR: [
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : undefined;

    const [users, total, adminCount, bannedCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          sessions: {
            select: { updatedAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.user.count({ where: { banned: true } }),
    ]);

    return c.json({
      users: users.map(mapUser),
      summary: {
        totalUsers: total,
        adminCount,
        bannedCount,
      },
    });
  })
  // 用户操作：提权/降权/封禁/解封
  .patch("/users/:id", async (c) => {
    const targetId = c.req.param("id");
    const body = await c.req.json<{
      action?: "promote" | "demote" | "ban" | "unban" | "setRole";
      role?: string | null;
      banReason?: string | null;
    }>();

    const action = body.action;
    if (!action) {
      return c.json({ message: "缺少 action" }, 400);
    }

    const currentUser = c.get("user");
    const actorRole = resolveRole(currentUser?.role);
    const targetUser = await prisma.user.findUnique({
      where: { id: targetId },
      include: {
        sessions: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!targetUser) {
      return c.json({ message: "用户不存在" }, 404);
    }

    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    const isLastAdmin = targetUser.role === "admin" && adminCount <= 1;

    if ((action === "demote" || action === "ban") && isLastAdmin) {
      return c.json({ message: "无法操作：至少保留一名管理员" }, 400);
    }

    if (targetUser.role === "admin" && actorRole !== "admin" && action !== "ban" && action !== "unban") {
      return c.json({ message: "只有管理员可以调整管理员账号的角色" }, 403);
    }

    if (action === "promote") {
      if (actorRole !== "admin") {
        return c.json({ message: "只有管理员可以授予管理员角色" }, 403);
      }
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role: "admin", banned: false, banReason: null },
        include: { sessions: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 } },
      });
      logger.info("用户提权为管理员", { targetId, by: currentUser?.id });
      return c.json({ user: mapUser(updated) });
    }

    if (action === "demote") {
      if (actorRole !== "admin") {
        return c.json({ message: "只有管理员可以调整管理员角色" }, 403);
      }
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role: "user" },
        include: { sessions: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 } },
      });
      logger.info("管理员降级为普通用户", { targetId, by: currentUser?.id });
      return c.json({ user: mapUser(updated) });
    }

    if (action === "ban") {
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { banned: true, banReason: body.banReason?.trim() || "违规行为" },
        include: { sessions: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 } },
      });
      logger.warn("用户已封禁", { targetId, by: currentUser?.id });
      return c.json({ user: mapUser(updated) });
    }

    if (action === "unban") {
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { banned: false, banReason: null },
        include: { sessions: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 } },
      });
      logger.info("用户解封", { targetId, by: currentUser?.id });
      return c.json({ user: mapUser(updated) });
    }

    if (action === "setRole") {
      const targetRole = normalizeRole(body.role);
      if (targetRole === "admin" && actorRole !== "admin") {
        return c.json({ message: "只有管理员可以授予管理员角色" }, 403);
      }
      if (targetUser.role === "admin" && targetRole !== "admin" && adminCount <= 1) {
        return c.json({ message: "无法操作：至少保留一名管理员" }, 400);
      }
      const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role: targetRole },
        include: {
          sessions: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
        },
      });
      logger.info("用户角色已更新", { targetId, role: targetRole, by: currentUser?.id });
      return c.json({ user: mapUser(updated) });
    }

    return c.json({ message: "未知 action" }, 400);
  })
  // 导出用户（CSV）
  .get("/users/export", async (c) => {
    if (!hasPermission(c.get("role"), PERMISSIONS.runOps)) {
      return c.json({ message: "当前账号没有导出权限" }, 403);
    }
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sessions: {
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
      take: 1000,
    });

    const csv = toCsv(users.map(mapUser));
    return c.text(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
    });
  })
  // 导入用户（CSV/JSON）
  .post("/users/import", async (c) => {
    if (!hasPermission(c.get("role"), PERMISSIONS.runOps)) {
      return c.json({ message: "当前账号没有导入权限" }, 403);
    }
    const raw = await c.req.text();
    if (!raw.trim()) {
      return c.json({ message: "导入内容为空" }, 400);
    }

    const contentType = c.req.header("content-type") || "";
    let payload: ImportUserPayload[] = [];

    if (contentType.includes("application/json") || raw.trim().startsWith("[")) {
      try {
        const json = JSON.parse(raw) as ImportUserPayload[];
        payload = (json || []).filter((item) => Boolean(item?.email));
      } catch {
        return c.json({ message: "JSON 解析失败，请检查格式" }, 400);
      }
    } else {
      payload = parseCsv(raw);
    }

    const limited = payload.slice(0, 500); // 避免一次性导入过多
    const now = new Date();
    let created = 0;
    let updated = 0;
    const skipped: { email: string; reason: string }[] = [];

    for (const item of limited) {
      const email = item.email?.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        skipped.push({ email: email || "未知", reason: "邮箱无效" });
        continue;
      }

      const targetRole = normalizeRole(item.role);
      const existing = await prisma.user.findUnique({ where: { email } });

      if (!existing) {
        await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            name: item.name || email.split("@")[0] || "导入用户",
            email,
            emailVerified: false,
            createdAt: now,
            updatedAt: now,
            role: targetRole,
            banned: false,
            phoneNumberVerified: false,
            twoFactorEnabled: false,
          },
        });
        created += 1;
        continue;
      }

      if (existing.role === "admin" && targetRole !== "admin") {
        const adminCount = await prisma.user.count({ where: { role: "admin" } });
        if (adminCount <= 1) {
          skipped.push({ email, reason: "已是唯一管理员，无法降级" });
          continue;
        }
      }

      await prisma.user.update({
        where: { email },
        data: {
          name: item.name || existing.name,
          role: targetRole,
          updatedAt: now,
        },
      });
      updated += 1;
    }

    return c.json({
      message: "导入完成",
      summary: { created, updated, skipped },
    });
  })
  // Feature Flags CRUD
  .get("/feature-flags", async (c) => {
    const flags = await listFeatureFlags();
    return c.json({ flags });
  })
  .post("/feature-flags", async (c) => {
    const body = await c.req.json<{
      key?: string;
      name?: string;
      description?: string | null;
      status?: FeatureFlagStatus;
      rolloutPercentage?: number;
      tags?: string[];
    }>();

    if (!body.key || !body.key.trim()) {
      return c.json({ message: "key 不能为空" }, 400);
    }

    const user = c.get("user");
    try {
      const created = await createFeatureFlag({
        key: body.key.trim(),
        name: body.name,
        description: body.description,
        status: body.status,
        rolloutPercentage: body.rolloutPercentage,
        tags: body.tags,
        createdById: user?.id,
      });
      return c.json({ flag: created });
    } catch (error) {
      logger.error("创建 Feature Flag 失败", error);
      return c.json({ message: "创建失败，可能存在重复 key" }, 400);
    }
  })
  .patch("/feature-flags/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{
      name?: string;
      description?: string | null;
      status?: FeatureFlagStatus;
      rolloutPercentage?: number;
      tags?: string[];
    }>();

    try {
      const updated = await updateFeatureFlag(id, {
        ...body,
        updatedById: c.get("user")?.id,
      });
      return c.json({ flag: updated });
    } catch (error) {
      logger.error("更新 Feature Flag 失败", error);
      return c.json({ message: "更新失败" }, 400);
    }
  })
  .delete("/feature-flags/:id", async (c) => {
    const id = c.req.param("id");
    try {
      await deleteFeatureFlag(id);
      return c.json({ success: true });
    } catch (error) {
      logger.error("删除 Feature Flag 失败", error);
      return c.json({ message: "删除失败" }, 400);
    }
  });

export default adminRoutes;
