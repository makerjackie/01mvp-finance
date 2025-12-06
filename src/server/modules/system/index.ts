import { Hono } from "hono";
import { getAppConfig, getPublicAppConfig, updateAppConfig } from "@/server/lib/app-config";
import { adminMiddleware } from "@/server/middleware";
import { auth } from "@/server/lib/auth";

const systemRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>()
  // 公共配置（无需登录，用于登录页等场景）
  .get("/config", async (c) => {
    const config = await getPublicAppConfig();
    return c.json({ config });
  })
  // 管理员专属配置
  .use("/admin/*", adminMiddleware)
  .get("/admin/config", async (c) => {
    const config = await getAppConfig();
    return c.json({ config });
  })
  .patch("/admin/config", async (c) => {
    const body = await c.req.json<{ passwordLoginEnabled?: unknown }>();
    const { passwordLoginEnabled } = body;

    if (passwordLoginEnabled !== undefined && typeof passwordLoginEnabled !== "boolean") {
      return c.json({ message: "passwordLoginEnabled 应为布尔值" }, 400);
    }

    const user = c.get("user");

    const config = await updateAppConfig({
      passwordLoginEnabled,
      updatedById: user?.id,
    });

    return c.json({ config });
  });

export default systemRoutes;
