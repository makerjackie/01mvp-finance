import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@/server/prisma/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

let prismaClient: PrismaClient | undefined;
let prismaPool: Pool | undefined;

type PrismaClientKey = keyof PrismaClient;
type PrismaClientValue = PrismaClient[PrismaClientKey];

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = prismaPool ?? globalForPrisma.pool ?? new Pool({ connectionString: databaseUrl });
  if (globalForPrisma.prisma) {
    prismaPool = pool;
    return globalForPrisma.prisma;
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

  prismaPool = pool;

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
