import { Hono } from "hono";
import { requestLogger } from "./middleware/logger";
import authController from "./modules/auth";
import chatRoutes from "./modules/chat";
import privateRoutes from "./modules/private";
import uploadRoutes from "./modules/upload";
import imageGenRoutes from "./modules/image-gen";
import systemRoutes from "./modules/system";

export const app = new Hono()
  .basePath("/api")
  .use("*", requestLogger())
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/auth", authController)
  .route("/chat", chatRoutes)
  .route("/private", privateRoutes)
  .route("/uploads", uploadRoutes)
  .route("/image-gen", imageGenRoutes)
  .route("/system", systemRoutes);

export type AppType = typeof app;
export default app;
