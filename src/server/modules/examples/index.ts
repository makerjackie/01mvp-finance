import { Hono } from "hono";
import type { AuthEnv } from "@/server/middleware";
import { meetingSummaryRoutes } from "./meeting-summary/routes";

const examplesRoutes = new Hono<AuthEnv>().route("/meeting-summary", meetingSummaryRoutes);

export default examplesRoutes;
