import { Hono } from "hono";
import { requestLogger } from "./middleware/logger";
import authController from "./modules/auth";
import chatRoutes from "./modules/chat";
import privateRoutes from "./modules/private";
import uploadRoutes from "./modules/upload";
import imageGenRoutes from "./modules/image-gen";

// Debug: 拦截所有 fetch 请求，找出 SSL 错误的来源
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (url.startsWith("https://")) {
    console.log("[Fetch Debug] HTTPS request to:", url);
    console.log("[Fetch Debug] Stack trace:", new Error().stack);
  }
  return originalFetch(input, init);
};

export const app = new Hono()
  .basePath("/api")
  .use("*", requestLogger())
  .get("/health", (c) => c.json({ status: "ok" }))
  .route("/auth", authController)
  .route("/chat", chatRoutes)
  .route("/private", privateRoutes)
  .route("/uploads", uploadRoutes)
  .route("/image-gen", imageGenRoutes);

export type AppType = typeof app;
export default app;
