import { hc } from "hono/client";
import type { AppType } from "@/server";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "http://localhost:3000";
};

const client = hc<AppType>(getBaseUrl());

export default client;
