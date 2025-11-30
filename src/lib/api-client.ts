import { hc } from "hono/client";
import type { AppType } from "@/server";
import { getBaseUrl } from "@/lib/utils";

const client = hc<AppType>(getBaseUrl());

export default client;
