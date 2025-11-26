import { hc } from "hono/client";
import type { AppType } from "@/server";

const client = hc<AppType>(process.env.NEXT_PUBLIC_API_URL as string);

export default client;
