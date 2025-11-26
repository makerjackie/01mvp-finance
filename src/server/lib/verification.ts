import { nanoid } from "nanoid";
import { prisma } from "@/server/lib/db";

export async function createVerificationCode(identifier: string) {
  // Generate a 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Delete existing codes for this identifier to prevent spam/clutter
  await prisma.verification.deleteMany({
    where: { identifier },
  });

  await prisma.verification.create({
    data: {
      id: nanoid(),
      identifier,
      value: code,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return code;
}

export async function verifyCode(identifier: string, code: string) {
  const record = await prisma.verification.findFirst({
    where: {
      identifier,
      value: code,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!record) return false;

  // Delete the code after successful verification
  await prisma.verification.delete({
    where: { id: record.id },
  });

  return true;
}
