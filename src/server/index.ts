import { Hono } from "hono";
import { requestLogger } from "./middleware/logger";
import { maintenanceMiddleware } from "./middleware/maintenance";
import authController from "./modules/auth";
import systemRoutes from "./modules/system";
import financeRoutes from "./modules/finance";
import uploadRoutes from "./modules/upload";
import notificationRoutes from "./modules/notification";
import auditRoutes from "./modules/audit";
import userRoutes from "./modules/user";
import adminRoutes from "./modules/admin";
import chatRoutes from "./modules/chat";
import { isRetryableDatabaseError, resetPrismaConnection } from "./lib/db";
import type { AuthEnv } from "./middleware";

export const app = new Hono<AuthEnv>()
  .basePath("/api")
  .use("*", requestLogger())
  .use("*", maintenanceMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/auth", authController)
  .route("/system", systemRoutes)
  .route("/finance", financeRoutes)
  .route("/upload", uploadRoutes)
  .route("/notification", notificationRoutes)
  .route("/audit", auditRoutes)
  .route("/user", userRoutes)
  .route("/admin", adminRoutes)
  .route("/chat", chatRoutes)
  .onError(async (error, c) => {
    console.error("[api] unhandled error", error);

    if (isRetryableDatabaseError(error)) {
      await resetPrismaConnection("api onError");
      return c.json(
        {
          error: "数据库连接异常，请稍后重试",
        },
        503,
      );
    }

    return c.json(
      {
        error: "服务器开小差了，请稍后重试",
      },
      500,
    );
  });

export type AppType = typeof app;
export default app;
