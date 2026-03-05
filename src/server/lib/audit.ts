import { prisma } from "./db";
import type { Prisma } from "@/server/prisma/generated/prisma/client";

export async function createAuditLog(params: {
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  req?: Request;
}) {
  const ipAddress = params.req?.headers.get("x-forwarded-for") || params.req?.headers.get("x-real-ip") || null;
  const userAgent = params.req?.headers.get("user-agent") || null;

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      changes: params.changes as Prisma.InputJsonValue | undefined,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
      ipAddress,
      userAgent,
    },
  });
}
