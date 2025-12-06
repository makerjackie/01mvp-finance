import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prismaClient: PrismaClient | undefined;
let prismaPool: Pool | undefined;
let middlewareRegistered = false;

type PrismaClientKey = keyof PrismaClient;
type PrismaClientValue = PrismaClient[PrismaClientKey];

function getPrismaClient() {
  if (prismaClient) return prismaClient;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = prismaPool ?? globalForPrisma.pool ?? new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  prismaClient =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });

  if (!middlewareRegistered) {
    prismaClient.$use(async (params, next) => {
      if (params.model === "User" && params.action === "create") {
        const data = (params.args?.data || {}) as Record<string, unknown>;
        const userCount = await prismaClient!.user.count();
        const role = (data.role as string | undefined) ?? (userCount === 0 ? "admin" : "user");

        params.args = {
          ...params.args,
          data: {
            ...data,
            role,
          },
        };
      }

      return next(params);
    });

    middlewareRegistered = true;
  }

  prismaPool = pool;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prismaClient;
    globalForPrisma.pool = pool;
  }

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
