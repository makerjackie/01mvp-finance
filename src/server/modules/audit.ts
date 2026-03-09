import { Hono } from "hono";
import { prisma } from "@/server/lib/db";
import { requirePermission, type AuthEnv } from "@/server/middleware";
import { PERMISSIONS } from "@/lib/rbac";

const app = new Hono<AuthEnv>().use("/logs", requirePermission(PERMISSIONS.financeAuditRead));

app.get("/logs", async (c) => {
  const page = Number(c.req.query("page")) || 1;
  const limit = 50;
  const resourceId = c.req.query("resourceId");

  const where = resourceId ? { resourceId } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return c.json({ success: true, data: logs, total });
});

export default app;
