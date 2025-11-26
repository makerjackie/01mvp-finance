import { Hono } from "hono";
import { requestLogger } from "./middleware/logger";
import authController from "./modules/auth";
import chatRoutes from "./modules/chat";
import privateRoutes from "./modules/private";
import uploadRoutes from "./modules/upload";

export const app = new Hono()
  .basePath("/api")
  .use("*", requestLogger())
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/auth", authController)
  .route("/chat", chatRoutes)
  .route("/private", privateRoutes)
  .route("/uploads", uploadRoutes);

export type AppType = typeof app;
export default app;
