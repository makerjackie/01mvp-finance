import type { AppConfig } from "@/server/prisma/generated/prisma/client";
import { prisma } from "@/server/lib/db";

const CACHE_TTL_MS = 30 * 1000;
const DEFAULT_APP_CONFIG: Pick<
  AppConfig,
  | "passwordLoginEnabled"
  | "smsLoginEnabled"
  | "perUserDailyQuota"
  | "globalDailyQuota"
  | "perUserRateLimit"
  | "globalRateLimit"
  | "maintenanceMode"
> = {
  passwordLoginEnabled: true,
  smsLoginEnabled: true,
  perUserDailyQuota: 1000,
  globalDailyQuota: 100000,
  perUserRateLimit: 60,
  globalRateLimit: 1200,
  maintenanceMode: false,
};

let cachedConfig: AppConfig | null = null;
let cacheTimestamp = 0;

const shouldUseCache = () => cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS;

const normalizeConfig = (config: AppConfig): AppConfig => ({
  ...DEFAULT_APP_CONFIG,
  ...config,
});

async function readConfigFromDB() {
  const existing = await prisma.appConfig.findUnique({
    where: { id: "global" },
  });

  if (existing) {
    const normalized = normalizeConfig(existing);
    cachedConfig = normalized;
    cacheTimestamp = Date.now();
    return normalized;
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

export async function getPublicAppConfig(): Promise<
  Pick<
    AppConfig,
    "passwordLoginEnabled" | "smsLoginEnabled" | "maintenanceMode" | "perUserDailyQuota" | "perUserRateLimit"
  >
> {
  const config = await getAppConfig();
  return {
    passwordLoginEnabled: config.passwordLoginEnabled,
    smsLoginEnabled: config.smsLoginEnabled,
    maintenanceMode: config.maintenanceMode,
    perUserDailyQuota: config.perUserDailyQuota,
    perUserRateLimit: config.perUserRateLimit,
  };
}

export async function updateAppConfig(
  input: Partial<
    Pick<
      AppConfig,
      | "passwordLoginEnabled"
      | "smsLoginEnabled"
      | "perUserDailyQuota"
      | "globalDailyQuota"
      | "perUserRateLimit"
      | "globalRateLimit"
      | "maintenanceMode"
    >
  > & { updatedById?: string },
) {
  const config = await prisma.appConfig.upsert({
    where: { id: "global" },
    update: {
      passwordLoginEnabled: input.passwordLoginEnabled ?? undefined,
      smsLoginEnabled: input.smsLoginEnabled ?? undefined,
      perUserDailyQuota: input.perUserDailyQuota ?? undefined,
      globalDailyQuota: input.globalDailyQuota ?? undefined,
      perUserRateLimit: input.perUserRateLimit ?? undefined,
      globalRateLimit: input.globalRateLimit ?? undefined,
      maintenanceMode: input.maintenanceMode ?? undefined,
      updatedById: input.updatedById ?? undefined,
    },
    create: {
      id: "global",
      passwordLoginEnabled: input.passwordLoginEnabled ?? DEFAULT_APP_CONFIG.passwordLoginEnabled,
      smsLoginEnabled: input.smsLoginEnabled ?? DEFAULT_APP_CONFIG.smsLoginEnabled,
      perUserDailyQuota: input.perUserDailyQuota ?? DEFAULT_APP_CONFIG.perUserDailyQuota,
      globalDailyQuota: input.globalDailyQuota ?? DEFAULT_APP_CONFIG.globalDailyQuota,
      perUserRateLimit: input.perUserRateLimit ?? DEFAULT_APP_CONFIG.perUserRateLimit,
      globalRateLimit: input.globalRateLimit ?? DEFAULT_APP_CONFIG.globalRateLimit,
      maintenanceMode: input.maintenanceMode ?? DEFAULT_APP_CONFIG.maintenanceMode,
      updatedById: input.updatedById,
    },
  });

  cachedConfig = normalizeConfig(config);
  cacheTimestamp = Date.now();
  return cachedConfig;
}

export function invalidateAppConfigCache() {
  cachedConfig = null;
  cacheTimestamp = 0;
}
