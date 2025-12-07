import { Hono } from "hono";
import { getAppConfig, getPublicAppConfig, updateAppConfig } from "@/server/lib/app-config";
import { requirePermission, type AuthEnv } from "@/server/middleware";
import { prisma } from "@/server/lib/db";
import { PERMISSIONS } from "@/lib/rbac";

const systemRoutes = new Hono<AuthEnv>()
  // 公共配置（无需登录，用于登录页等场景）
  .get("/config", async (c) => {
    const config = await getPublicAppConfig();
    return c.json({ config });
  })
  // 管理员专属配置
  .use("/admin/config", requirePermission(PERMISSIONS.manageAuth))
  .get("/admin/config", async (c) => {
    const config = await getAppConfig();
    return c.json({ config });
  })
  .patch("/admin/config", async (c) => {
    const body = await c.req.json<{
      passwordLoginEnabled?: unknown;
      smsLoginEnabled?: unknown;
      perUserDailyQuota?: unknown;
      globalDailyQuota?: unknown;
      perUserRateLimit?: unknown;
      globalRateLimit?: unknown;
      maintenanceMode?: unknown;
    }>();

    const ensureNumber = (value: unknown, field: string) => {
      if (value === undefined || value === null) return undefined;
      const num = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(num) || num < 0) {
        throw new Error(`${field} 应为非负数字`);
      }
      return Math.round(num);
    };

    const ensureBoolean = (value: unknown, field: string) => {
      if (value === undefined) return undefined;
      if (typeof value !== "boolean") {
        throw new Error(`${field} 应为布尔值`);
      }
      return value;
    };

    try {
      const passwordLoginEnabled = ensureBoolean(body.passwordLoginEnabled, "passwordLoginEnabled");
      const smsLoginEnabled = ensureBoolean(body.smsLoginEnabled, "smsLoginEnabled");
      const maintenanceMode = ensureBoolean(body.maintenanceMode, "maintenanceMode");
      const perUserDailyQuota = ensureNumber(body.perUserDailyQuota, "perUserDailyQuota");
      const globalDailyQuota = ensureNumber(body.globalDailyQuota, "globalDailyQuota");
      const perUserRateLimit = ensureNumber(body.perUserRateLimit, "perUserRateLimit");
      const globalRateLimit = ensureNumber(body.globalRateLimit, "globalRateLimit");

      const user = c.get("user");

      const config = await updateAppConfig({
        passwordLoginEnabled,
        smsLoginEnabled,
        maintenanceMode,
        perUserDailyQuota,
        globalDailyQuota,
        perUserRateLimit,
        globalRateLimit,
        updatedById: user?.id,
      });

      return c.json({ config });
    } catch (error) {
      return c.json({ message: error instanceof Error ? error.message : "参数校验失败" }, 400);
    }
  })
  // 健康检查扩展：包含数据库与运行时信息
  .use("/admin/health", requirePermission(PERMISSIONS.runOps))
  .get("/admin/health", async (c) => {
    let dbOk = false;
    let dbLatency = 0;
    const started = performance.now();
    try {
      const dbStart = performance.now();
      await prisma.$queryRawUnsafe("SELECT 1");
      dbOk = true;
      dbLatency = Math.round(performance.now() - dbStart);
    } catch (error) {
      dbOk = false;
      dbLatency = Math.round(performance.now() - started);
      return c.json(
        {
          status: "degraded",
          checks: {
            database: { ok: dbOk, latencyMs: dbLatency, error: error instanceof Error ? error.message : "unknown" },
          },
          uptimeSeconds: Math.round(process.uptime()),
          now: new Date().toISOString(),
        },
        503,
      );
    }

    return c.json({
      status: "ok",
      checks: {
        database: { ok: dbOk, latencyMs: dbLatency },
        runtime: { node: process.version, memory: process.memoryUsage().rss },
      },
      uptimeSeconds: Math.round(process.uptime()),
      now: new Date().toISOString(),
    });
  })
  // 仅管理员可见的环境变量概览（脱敏）
  .use("/admin/env", requirePermission(PERMISSIONS.runOps))
  .get("/admin/env", async (c) => {
    const whitelist = [
      "DATABASE_URL",
      "NEXT_PUBLIC_SITE_URL",
      "BETTER_AUTH_SECRET",
      "S3_ENDPOINT",
      "S3_BUCKET",
      "SMS_APP_ID",
      "SMS_SIGN_NAME",
    ];

    const redactedEnv = whitelist.map((key) => {
      const value = process.env[key];
      const preview =
        typeof value === "string" && value.length > 8 ? `${value.slice(0, 4)}...${value.slice(-2)}` : value || null;

      return {
        key,
        present: Boolean(value),
        preview,
      };
    });

    const publicEnv = Object.keys(process.env)
      .filter((key) => key.startsWith("NEXT_PUBLIC_"))
      .map((key) => ({
        key,
        value: process.env[key],
      }));

    return c.json({
      env: redactedEnv,
      publicEnv,
      now: new Date().toISOString(),
    });
  });

export default systemRoutes;
