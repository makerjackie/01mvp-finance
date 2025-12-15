import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { getAppConfig } from "@/server/lib/app-config";
import { auth } from "@/server/lib/auth";
import { resolveRole } from "@/lib/rbac";
import type { AuthEnv } from "@/server/middleware";

const isAllowedDuringMaintenance = (c: Context<AuthEnv>) => {
  const pathname = new URL(c.req.url).pathname;

  if (pathname === "/api/health") return true;
  if (pathname.startsWith("/api/system/config")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (c.req.method === "GET" && pathname.startsWith("/api/uploads/")) return true;

  return false;
};

export const maintenanceMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  if (isAllowedDuringMaintenance(c)) {
    return next();
  }

  const config = await getAppConfig();
  if (!config.maintenanceMode) {
    return next();
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const role = resolveRole(session?.user?.role);

  if (role === "admin") {
    return next();
  }

  return c.json(
    {
      error: "服务维护中，请稍后再试",
      maintenance: true,
    },
    503,
  );
});
