import { Hono } from "hono";
import { requestLogger } from "./middleware/logger";
import { maintenanceMiddleware } from "./middleware/maintenance";
import authController from "./modules/auth";
import systemRoutes from "./modules/system";
import financeRoutes from "./modules/finance";
import uploadRoutes from "./modules/upload";
import type { AuthEnv } from "./middleware";

export const app = new Hono<AuthEnv>()
  .basePath("/api")
  .use("*", requestLogger())
  .use("*", maintenanceMiddleware)
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/auth", authController)
  .route("/system", systemRoutes)
  .route("/finance", financeRoutes)
  .route("/upload", uploadRoutes);

export type AppType = typeof app;
export default app;
