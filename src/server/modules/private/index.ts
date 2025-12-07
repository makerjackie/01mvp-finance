import { Hono } from "hono";
import { sessionMiddleware, type AuthEnv } from "@/server/middleware";

const privateRoutes = new Hono<AuthEnv>().use(sessionMiddleware).get("/", (c) => {
  return c.json({ message: "Private route", user: c.get("user") });
});

export default privateRoutes;
