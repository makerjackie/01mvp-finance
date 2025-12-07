import { Hono } from "hono";
import { requestLogger } from "./middleware/logger";
import authController from "./modules/auth";
import chatRoutes from "./modules/chat";
import privateRoutes from "./modules/private";
import uploadRoutes from "./modules/upload";
import imageGenRoutes from "./modules/image-gen";
import systemRoutes from "./modules/system";
import adminRoutes from "./modules/admin";
import type { AuthEnv } from "./middleware";

export const app = new Hono<AuthEnv>()
  .basePath("/api")
  .use("*", requestLogger())
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/auth", authController)
  .route("/chat", chatRoutes)
  .route("/private", privateRoutes)
  .route("/uploads", uploadRoutes)
  .route("/image-gen", imageGenRoutes)
  .route("/system", systemRoutes)
  .route("/admin", adminRoutes);

export type AppType = typeof app;
export default app;
