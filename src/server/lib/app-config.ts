import type { AppConfig } from "@prisma/client";
import { prisma } from "@/server/lib/db";

const CACHE_TTL_MS = 30 * 1000;
const DEFAULT_APP_CONFIG: Pick<AppConfig, "passwordLoginEnabled"> = {
  passwordLoginEnabled: true,
};

let cachedConfig: AppConfig | null = null;
let cacheTimestamp = 0;

const shouldUseCache = () => cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS;

async function readConfigFromDB() {
  const existing = await prisma.appConfig.findUnique({
    where: { id: "global" },
  });

  if (existing) {
    cachedConfig = existing;
    cacheTimestamp = Date.now();
    return existing;
  }

  const config = await prisma.appConfig.create({
    data: {
      id: "global",
      ...DEFAULT_APP_CONFIG,
    },
  });

  cachedConfig = config;
  cacheTimestamp = Date.now();
  return config;
}

export async function getAppConfig(options?: { skipCache?: boolean }) {
  if (!options?.skipCache && shouldUseCache()) {
    return cachedConfig!;
  }

  return readConfigFromDB();
}

export async function getPublicAppConfig(): Promise<Pick<AppConfig, "passwordLoginEnabled">> {
  const config = await getAppConfig();
  return {
    passwordLoginEnabled: config.passwordLoginEnabled,
  };
}

export async function updateAppConfig(
  input: Partial<Pick<AppConfig, "passwordLoginEnabled">> & { updatedById?: string },
) {
  const config = await prisma.appConfig.upsert({
    where: { id: "global" },
    update: {
      passwordLoginEnabled: input.passwordLoginEnabled ?? undefined,
      updatedById: input.updatedById ?? undefined,
    },
    create: {
      id: "global",
      passwordLoginEnabled: input.passwordLoginEnabled ?? DEFAULT_APP_CONFIG.passwordLoginEnabled,
      updatedById: input.updatedById,
    },
  });

  cachedConfig = config;
  cacheTimestamp = Date.now();
  return config;
}

export function invalidateAppConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
