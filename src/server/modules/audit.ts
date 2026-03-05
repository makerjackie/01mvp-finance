import { Hono } from "hono";
import { prisma } from "@/server/lib/db";
import { auth } from "@/server/lib/auth";

const app = new Hono();

app.get("/logs", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user || session.user.role !== "admin") {
    return c.json({ error: "无权访问" }, 403);
  }

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
