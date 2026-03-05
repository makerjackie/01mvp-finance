import { Hono } from "hono";
import { prisma } from "@/server/lib/db";
import { auth } from "@/server/lib/auth";

const app = new Hono();

app.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "未登录" }, 401);

  const page = Number(c.req.query("page")) || 1;
  const limit = 20;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId: session.user.id } }),
  ]);

  return c.json({ success: true, data: notifications, total });
});

app.get("/unread-count", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "未登录" }, 401);

  const count = await prisma.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return c.json({ success: true, count });
});

app.post("/:id/read", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "未登录" }, 401);

  const id = c.req.param("id");
  await prisma.notification.update({
    where: { id, userId: session.user.id },
    data: { read: true, readAt: new Date() },
  });

  return c.json({ success: true });
});

app.post("/read-all", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "未登录" }, 401);

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });

  return c.json({ success: true });
});

export default app;
