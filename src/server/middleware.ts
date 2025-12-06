import { createMiddleware } from "hono/factory";
import { auth } from "./lib/auth";
import { ensureInitialAdmin } from "@/server/lib/user";

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

export const adminMiddleware = createMiddleware(async (c, next) => {
  await ensureInitialAdmin();

  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  if (session.user.role !== "admin") {
    c.status(403);
    return c.json({ message: "需要管理员权限" });
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});
