import { prisma } from "@/server/lib/db";
import { logger } from "@/server/lib/logger";

let ensureAdminPromise: Promise<void> | null = null;
let isInitialized = false;

export async function ensureInitialAdmin() {
  // 如果已经初始化成功，直接返回
  if (isInitialized) return;

  if (!ensureAdminPromise) {
    ensureAdminPromise = (async () => {
      try {
        const existingAdmin = await prisma.user.findFirst({
          where: { role: "admin" },
          select: { id: true },
        });

        if (existingAdmin) {
          isInitialized = true;
          return;
        }

        const firstUser = await prisma.user.findFirst({
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true },
        });

        if (!firstUser) {
          isInitialized = true;
          return;
        }

        await prisma.user.update({
          where: { id: firstUser.id },
          data: { role: "admin" },
        });

        logger.info("首个用户已提升为管理员", { userId: firstUser.id });
        isInitialized = true;
      } catch (error) {
        logger.error("确保管理员初始化失败", error);
        // 重置 promise 以便下次重试
        ensureAdminPromise = null;
        throw error;
      }
    })();
  }

  return ensureAdminPromise;
}
