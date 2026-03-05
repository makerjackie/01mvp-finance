import { prisma } from "./db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  financeRecordId?: string;
}) {
  return await prisma.notification.create({ data: params });
}

export async function notifyAdmins(params: {
  type: string;
  title: string;
  content: string;
  link?: string;
  financeRecordId?: string;
}) {
  const admins = await prisma.user.findMany({
    where: { role: { in: ["admin", "reviewer"] } },
    select: { id: true },
  });

  await Promise.all(admins.map((admin) => createNotification({ userId: admin.id, ...params })));
}
