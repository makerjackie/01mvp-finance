import { prisma } from "@/server/lib/db";
import { logger } from "@/server/lib/logger";

let ensureAdminPromise: Promise<void> | null = null;

export async function ensureInitialAdmin() {
  if (!ensureAdminPromise) {
    ensureAdminPromise = (async () => {
      try {
        const existingAdmin = await prisma.user.findFirst({
          where: { role: "admin" },
          select: { id: true },
        });

        if (existingAdmin) return;

        const firstUser = await prisma.user.findFirst({
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true },
        });

        if (!firstUser) return;

        await prisma.user.update({
          where: { id: firstUser.id },
          data: { role: "admin" },
        });

        logger.info("首个用户已提升为管理员", { userId: firstUser.id });
      } catch (error) {
        logger.error("确保管理员初始化失败", error);
        ensureAdminPromise = null;
      }
    })();
  }

  return ensureAdminPromise;
}
