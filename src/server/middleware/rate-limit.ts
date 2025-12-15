import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import type { AuthEnv } from "@/server/middleware";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  keyGenerator?: (c: Context<AuthEnv>) => string | null;
};

type Bucket = {
  count: number;
  expiresAt: number;
};

const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL_MS = 10_000;
let lastCleanupAt = 0;

const cleanupBuckets = (now: number) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.expiresAt <= now) {
      buckets.delete(key);
    }
  }
};

const maybeCleanup = (now: number) => {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  cleanupBuckets(now);
};

const getIp = (c: Context<AuthEnv>) => {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  const realIp = c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip");
  return realIp ?? "anonymous";
};

export const rateLimit = (options: RateLimitOptions) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const keyFromUser = c.get("user")?.id ?? null;
    const keyFromCustom = options.keyGenerator?.(c) ?? null;
    const identifier = keyFromCustom || keyFromUser || getIp(c) || "anonymous";

    const now = Date.now();
    maybeCleanup(now);
    const existing = buckets.get(identifier);

    if (existing && existing.expiresAt > now && existing.count >= options.limit) {
      const resetSeconds = Math.ceil((existing.expiresAt - now) / 1000);
      c.header("X-RateLimit-Limit", String(options.limit));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(resetSeconds));
      return c.json({ error: "请求过于频繁，请稍后再试" }, 429);
    }

    const bucket: Bucket =
      existing && existing.expiresAt > now
        ? { count: existing.count + 1, expiresAt: existing.expiresAt }
        : { count: 1, expiresAt: now + options.windowMs };

    buckets.set(identifier, bucket);

    c.header("X-RateLimit-Limit", String(options.limit));
    c.header("X-RateLimit-Remaining", String(Math.max(options.limit - bucket.count, 0)));
    c.header("X-RateLimit-Reset", String(Math.ceil((bucket.expiresAt - now) / 1000)));

    await next();
  });
