import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/server/prisma/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prismaClient: PrismaClient | undefined;
let resetPromise: Promise<void> | null = null;

type PrismaClientKey = keyof PrismaClient;
type PrismaClientValue = PrismaClient[PrismaClientKey];

const RETRYABLE_DB_ERROR_PATTERNS = [
  /connection terminated unexpectedly/i,
  /server closed the connection unexpectedly/i,
  /connection ended unexpectedly/i,
  /econnreset/i,
  /terminating connection due to administrator command/i,
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause =
      error.cause instanceof Error ? error.cause.message : typeof error.cause === "string" ? error.cause : "";
    return `${error.message} ${cause}`.trim();
  }

  return typeof error === "string" ? error : "";
}

export function isRetryableDatabaseError(error: unknown): boolean {
  const message = getErrorMessage(error);
  if (!message) return false;
  return RETRYABLE_DB_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export async function resetPrismaConnection(reason: string) {
  if (resetPromise) return resetPromise;

  const currentClient = prismaClient ?? globalForPrisma.prisma;
  const currentPool = globalForPrisma.pool;

  prismaClient = undefined;
  globalForPrisma.prisma = undefined;
  globalForPrisma.pool = undefined;

  resetPromise = (async () => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[prisma] reset database client: ${reason}`);
    }

    try {
      await currentClient?.$disconnect();
    } catch (error) {
      console.error("[prisma] failed to disconnect prisma client", error);
    }

    try {
      await currentPool?.end();
    } catch (error) {
      console.error("[prisma] failed to close pg pool", error);
    }
  })().finally(() => {
    resetPromise = null;
  });

  return resetPromise;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // 在开发模式下重用全局连接池
  const usingExistingPool = Boolean(globalForPrisma.pool);
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: databaseUrl,
      max: 10, // 限制最大连接数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      query_timeout: 15000,
      statement_timeout: 15000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

  if (!usingExistingPool) {
    pool.on("error", (error) => {
      console.error("[prisma] pg pool error", error);
      if (isRetryableDatabaseError(error)) {
        void resetPrismaConnection("pg pool error");
      }
    });
  }

  const adapter = new PrismaPg(pool);

  const baseClient =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  const client = baseClient.$extends({
    query: {
      user: {
        async create({ args, query }) {
          const data = (args?.data || {}) as Prisma.UserCreateInput;
          const userCount = await baseClient.user.count();
          const role = (data.role as string | undefined) ?? (userCount === 0 ? "admin" : "user");

          return query({
            ...args,
            data: {
              ...data,
              role,
            },
          });
        },
      },
    },
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client as PrismaClient;
    globalForPrisma.pool = pool;
  }

  return client as PrismaClient;
}

function getPrismaClient() {
  if (prismaClient) return prismaClient;

  prismaClient = createPrismaClient();

  return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const valueProxy = new Proxy(() => {}, {
      get(_fnTarget, nestedProp) {
        const client = getPrismaClient();
        const value = client[prop as PrismaClientKey] as PrismaClientValue | undefined;
        if (value == null) return value;
        const nested = Reflect.get(value as object, nestedProp);
        return typeof nested === "function" ? nested.bind(value) : nested;
      },
      apply(_fnTarget, _thisArg, argArray) {
        const client = getPrismaClient();
        const value = client[prop as PrismaClientKey] as PrismaClientValue | undefined;
        if (typeof value !== "function") return value;
        return (value as (...args: unknown[]) => unknown).apply(client, argArray);
      },
    });

    return valueProxy;
  },
});
