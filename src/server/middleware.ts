import type { Context } from "hono";
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

type SessionPayload = Awaited<ReturnType<typeof auth.api.getSession>>;

const applySessionContext = (c: Context<AuthEnv>, session: NonNullable<SessionPayload>) => {
  c.set("user", session.user);
  c.set("session", session.session);
  c.set("role", resolveRole(session.user.role));
  c.set("permissions", getPermissionsForRole(session.user.role));
};

const loadSession = async (c: Context<AuthEnv>) => {
  await ensureInitialAdmin();
  return auth.api.getSession({ headers: c.req.raw.headers });
};

export const sessionMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await loadSession(c);

  if (!session) {
    c.status(401);
    return c.json({ message: "Unauthorized" });
  }

  applySessionContext(c, session);
  return next();
});

export const requireRoles = (role: RoleKey | RoleKey[]) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const session = await loadSession(c);

    if (!session) {
      c.status(401);
      return c.json({ message: "Unauthorized" });
    }

    const resolvedRole = resolveRole(session.user.role);
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(resolvedRole)) {
      c.status(403);
      return c.json({ message: "当前账号没有权限访问此功能" });
    }

    applySessionContext(c, session);
    return next();
  });

export const requirePermission = (permission: Permission | Permission[]) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const session = await loadSession(c);

    if (!session) {
      c.status(401);
      return c.json({ message: "Unauthorized" });
    }

    const role = resolveRole(session.user.role);
    const required = Array.isArray(permission) ? permission : [permission];

    if (!required.some((item) => hasPermission(role, item))) {
      c.status(403);
      return c.json({ message: "当前账号没有权限访问此功能" });
    }

    applySessionContext(c, session);
    return next();
  });

export const adminMiddleware = requirePermission(PERMISSIONS.accessAdmin);
