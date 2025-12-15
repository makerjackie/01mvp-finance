import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { getAppConfig } from "@/server/lib/app-config";
import type { AuthEnv } from "@/server/middleware";

type Bucket = {
  count: number;
  expiresAt: number;
};

const minuteBuckets = new Map<string, Bucket>();
const dailyBuckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 10_000;
let lastCleanupAt = 0;

const cleanupBuckets = (buckets: Map<string, Bucket>, now: number) => {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.expiresAt <= now) {
      buckets.delete(key);
    }
  }
};

const maybeCleanup = (now: number) => {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now;
  cleanupBuckets(minuteBuckets, now);
  cleanupBuckets(dailyBuckets, now);
};

const getIp = (c: Context<AuthEnv>) => {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  const realIp = c.req.header("cf-connecting-ip") ?? c.req.header("x-real-ip");
  return realIp ?? "anonymous";
};

const getUserOrIp = (c: Context<AuthEnv>) => c.get("user")?.id ?? getIp(c);

const enforceFixedWindow = ({
  buckets,
  identifier,
  limit,
  windowMs,
}: {
  buckets: Map<string, Bucket>;
  identifier: string;
  limit: number;
  windowMs: number;
}) => {
  const now = Date.now();
  maybeCleanup(now);
  const existing = buckets.get(identifier);

  if (existing && existing.expiresAt > now && existing.count >= limit) {
    return {
      ok: false as const,
      limit,
      remaining: 0,
      resetSeconds: Math.ceil((existing.expiresAt - now) / 1000),
    };
  }

  const bucket: Bucket =
    existing && existing.expiresAt > now
      ? { count: existing.count + 1, expiresAt: existing.expiresAt }
      : { count: 1, expiresAt: now + windowMs };

  buckets.set(identifier, bucket);

  return {
    ok: true as const,
    limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetSeconds: Math.ceil((bucket.expiresAt - now) / 1000),
  };
};

const getNextLocalMidnight = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.getTime();
};

const enforceDailyQuota = ({ identifier, limit }: { identifier: string; limit: number }) => {
  const now = Date.now();
  maybeCleanup(now);
  const expiresAt = getNextLocalMidnight();
  const existing = dailyBuckets.get(identifier);

  if (existing && existing.expiresAt > now && existing.count >= limit) {
    return {
      ok: false as const,
      limit,
      remaining: 0,
      resetSeconds: Math.ceil((existing.expiresAt - now) / 1000),
    };
  }

  const bucket: Bucket =
    existing && existing.expiresAt > now
      ? { count: existing.count + 1, expiresAt: existing.expiresAt }
      : { count: 1, expiresAt };

  dailyBuckets.set(identifier, bucket);

  return {
    ok: true as const,
    limit,
    remaining: Math.max(limit - bucket.count, 0),
    resetSeconds: Math.ceil((bucket.expiresAt - now) / 1000),
  };
};

export const appRateLimit = ({ cap }: { cap: number }) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const config = await getAppConfig();
    const limit = Math.min(config.perUserRateLimit, cap);

    const result = enforceFixedWindow({
      buckets: minuteBuckets,
      identifier: `user:${getUserOrIp(c)}`,
      limit,
      windowMs: 60_000,
    });

    c.header("X-RateLimit-Limit", String(result.limit));
    c.header("X-RateLimit-Remaining", String(result.remaining));
    c.header("X-RateLimit-Reset", String(result.resetSeconds));

    if (!result.ok) {
      return c.json({ error: "请求过于频繁，请稍后再试" }, 429);
    }

    return next();
  });

export const appGlobalRateLimit = ({ cap }: { cap: number }) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const config = await getAppConfig();
    const limit = Math.min(config.globalRateLimit, cap);

    const result = enforceFixedWindow({
      buckets: minuteBuckets,
      identifier: "global",
      limit,
      windowMs: 60_000,
    });

    c.header("X-RateLimit-Global-Limit", String(result.limit));
    c.header("X-RateLimit-Global-Remaining", String(result.remaining));
    c.header("X-RateLimit-Global-Reset", String(result.resetSeconds));

    if (!result.ok) {
      return c.json({ error: "请求过于频繁，请稍后再试" }, 429);
    }

    return next();
  });

export const appDailyQuota = () =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const config = await getAppConfig();
    const limit = config.perUserDailyQuota;

    const result = enforceDailyQuota({ identifier: `daily:user:${getUserOrIp(c)}`, limit });

    c.header("X-Quota-Limit", String(result.limit));
    c.header("X-Quota-Remaining", String(result.remaining));
    c.header("X-Quota-Reset", String(result.resetSeconds));

    if (!result.ok) {
      return c.json({ error: "今日配额已用完，请明天再试" }, 429);
    }

    return next();
  });

export const appGlobalDailyQuota = () =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const config = await getAppConfig();
    const limit = config.globalDailyQuota;

    const result = enforceDailyQuota({ identifier: "daily:global", limit });

    c.header("X-Quota-Global-Limit", String(result.limit));
    c.header("X-Quota-Global-Remaining", String(result.remaining));
    c.header("X-Quota-Global-Reset", String(result.resetSeconds));

    if (!result.ok) {
      return c.json({ error: "系统今日配额已用完，请稍后再试" }, 429);
    }

    return next();
  });
