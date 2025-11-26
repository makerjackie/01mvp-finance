import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prismaClient: PrismaClient | undefined;
let prismaPool: Pool | undefined;

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
        const value = (client as any)[prop as keyof PrismaClient];
        if (value == null) return value;
        const nested = Reflect.get(value, nestedProp);
        return typeof nested === "function" ? nested.bind(value) : nested;
      },
      apply(_fnTarget, _thisArg, argArray) {
        const client = getPrismaClient();
        const value = (client as any)[prop as keyof PrismaClient];
        if (typeof value !== "function") return value;
        return value.apply(client, argArray);
      },
    });

    return valueProxy;
  },
});
