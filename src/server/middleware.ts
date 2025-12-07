import { createMiddleware } from "hono/factory";
import { auth } from "./lib/auth";
import { ensureInitialAdmin } from "@/server/lib/user";
import {
  PERMISSIONS,
  getPermissionsForRole,
  hasPermission,
  resolveRole,
  type Permission,
  type RoleKey,
} from "@/lib/rbac";

export type AuthEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
    role: RoleKey;
    permissions: Permission[];
  };
};

export const sessionMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  c.set("user", session.user);
  c.set("session", session.session);
  c.set("role", resolveRole(session.user.role));
  c.set("permissions", getPermissionsForRole(session.user.role));
  return next();
});

export const requirePermission = (permission: Permission | Permission[]) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    await ensureInitialAdmin();

    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      c.status(401);
      return c.json({ message: "Unauthorized" });
    }

    const role = resolveRole(session.user.role);
    const permissions = getPermissionsForRole(session.user.role);
    const required = Array.isArray(permission) ? permission : [permission];

    if (!required.some((item) => hasPermission(role, item))) {
      c.status(403);
      return c.json({ message: "当前账号没有权限访问此功能" });
    }

    c.set("user", session.user);
    c.set("session", session.session);
    c.set("role", role);
    c.set("permissions", permissions);
    return next();
  });

export const adminMiddleware = requirePermission(PERMISSIONS.accessAdmin);
