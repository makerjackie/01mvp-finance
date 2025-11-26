import { Hono } from "hono";
import { auth } from "@/server/lib/auth";

// Forward every verb under /api/auth to Better Auth so hooks like get-session work.
const authController = new Hono().all("/*", async (c) => {
  const response = await auth.handler(c.req.raw);

  // Debug: Log Set-Cookie headers
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    console.log("[Auth] Set-Cookie:", setCookie.slice(0, 100));
  }

  // Ensure all headers (including Set-Cookie) are properly forwarded
  return response;
});

export default authController;
