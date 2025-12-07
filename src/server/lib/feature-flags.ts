import type { FeatureFlag } from "@prisma/client";
import { prisma } from "@/server/lib/db";

const VALID_STATUS = ["on", "off", "rollout"] as const;
export type FeatureFlagStatus = (typeof VALID_STATUS)[number];

const normalizeStatus = (status?: string | null): FeatureFlagStatus => {
  if (VALID_STATUS.includes((status as FeatureFlagStatus) || "off")) {
    return status as FeatureFlagStatus;
  }
  return "off";
};

const clampPercentage = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
};

const sanitizeTags = (tags?: string[] | null) =>
  Array.from(
    new Set(
      (tags || [])
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8),
    ),
  );

const deterministicBucket = (identifier: string) => {
  let hash = 0;
  for (let i = 0; i < identifier.length; i += 1) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0; // 保持 32 位
  }
  return Math.abs(hash % 100);
};

export const evaluateFeatureFlag = (flag: FeatureFlag, identifier?: string) => {
  const status = normalizeStatus(flag.status);
  if (status === "on") return true;
  if (status === "off") return false;

  const bucket = deterministicBucket(identifier || flag.key);
  return bucket < clampPercentage(flag.rolloutPercentage);
};

export async function listFeatureFlags() {
  const flags = await prisma.featureFlag.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return flags.map((flag) => ({
    ...flag,
    status: normalizeStatus(flag.status),
    rolloutPercentage: clampPercentage(flag.rolloutPercentage),
    tags: sanitizeTags(flag.tags),
  }));
}

export async function createFeatureFlag(input: {
  key: string;
  name?: string;
  description?: string | null;
  status?: FeatureFlagStatus;
  rolloutPercentage?: number | null;
  tags?: string[] | null;
  createdById?: string | null;
}) {
  const payload = {
    key: input.key.trim(),
    name: (input.name || input.key).trim(),
    description: input.description?.trim() || null,
    status: normalizeStatus(input.status || "off"),
    rolloutPercentage: clampPercentage(input.rolloutPercentage),
    tags: sanitizeTags(input.tags),
    createdById: input.createdById ?? undefined,
    updatedById: input.createdById ?? undefined,
  };

  return prisma.featureFlag.create({
    data: payload,
  });
}

export async function updateFeatureFlag(
  id: string,
  input: Partial<Omit<FeatureFlag, "id" | "createdAt" | "updatedAt">>,
) {
  const payload = {
    name: input.name?.trim(),
    description: input.description?.trim(),
    status: input.status ? normalizeStatus(input.status) : undefined,
    rolloutPercentage: input.rolloutPercentage !== undefined ? clampPercentage(input.rolloutPercentage) : undefined,
    tags: input.tags ? sanitizeTags(input.tags) : undefined,
    updatedById: input.updatedById ?? undefined,
  };

  return prisma.featureFlag.update({
    where: { id },
    data: payload,
  });
}

export async function deleteFeatureFlag(id: string) {
  return prisma.featureFlag.delete({ where: { id } });
}
