import { Hono } from "hono";
import { auth } from "@/server/lib/auth";
import { getPublicAppConfig } from "@/server/lib/app-config";

const isPasswordAuthPath = (pathname: string, method: string) => {
  if (method !== "POST") return false;
  return (
    pathname.includes("/sign-in/username") ||
    pathname.includes("/sign-in/email") ||
    pathname.includes("/sign-up/email") ||
    pathname.includes("/sign-up/username")
  );
};

// Forward every verb under /api/auth to Better Auth so hooks like get-session work.
const authController = new Hono().all("/*", async (c) => {
  const pathname = new URL(c.req.url).pathname;

  if (isPasswordAuthPath(pathname, c.req.method)) {
    const config = await getPublicAppConfig();

    if (!config.passwordLoginEnabled) {
      return c.json({ message: "账户密码登录已关闭，请使用手机号验证码登录" }, 403);
    }
  }

  const response = await auth.handler(c.req.raw);

  // Ensure all headers (including Set-Cookie) are properly forwarded
  return response;
});

export default authController;
