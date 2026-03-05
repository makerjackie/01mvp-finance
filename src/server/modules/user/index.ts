import { Hono } from "hono";
import type { Prisma } from "@/server/prisma/generated/prisma/client";
import { prisma } from "@/server/lib/db";
import { sessionMiddleware, type AuthEnv } from "@/server/middleware";

const idCardPattern = /^(\d{15}|\d{17}[\dX])$/;
const bankAccountPattern = /^\d{8,30}$/;

const normalizeString = (value: unknown, fieldName: string) => {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} 格式无效`);
  }

  return value.trim();
};

const userRoutes = new Hono<AuthEnv>()
  .use(sessionMiddleware)
  .get("/profile", async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "未登录" }, 401);
    }

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        idCardNumber: true,
        bankAccountNumber: true,
        bankName: true,
      },
    });

    if (!profile) {
      return c.json({ message: "用户不存在" }, 404);
    }

    return c.json({
      profile: {
        name: profile.name,
        idCardNumber: profile.idCardNumber ?? "",
        bankAccountNumber: profile.bankAccountNumber ?? "",
        bankName: profile.bankName ?? "",
      },
    });
  })
  .patch("/profile", async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "未登录" }, 401);
    }

    let body: Record<string, unknown>;
    try {
      body = await c.req.json<Record<string, unknown>>();
    } catch {
      return c.json({ message: "请求体格式无效" }, 400);
    }

    const data: Prisma.UserUpdateInput = {};

    try {
      if ("name" in body) {
        const name = normalizeString(body.name, "姓名");

        if (name.length < 2 || name.length > 32) {
          throw new Error("姓名长度需在 2-32 个字符之间");
        }

        data.name = name;
      }

      if ("idCardNumber" in body) {
        const idCardRaw = normalizeString(body.idCardNumber, "身份证号码").toUpperCase();

        if (!idCardRaw) {
          data.idCardNumber = null;
        } else if (!idCardPattern.test(idCardRaw)) {
          throw new Error("身份证号码格式无效");
        } else {
          data.idCardNumber = idCardRaw;
        }
      }

      if ("bankAccountNumber" in body) {
        const bankAccountRaw = normalizeString(body.bankAccountNumber, "银行卡号").replace(/\s+/g, "");

        if (!bankAccountRaw) {
          data.bankAccountNumber = null;
        } else if (!bankAccountPattern.test(bankAccountRaw)) {
          throw new Error("银行卡号格式无效");
        } else {
          data.bankAccountNumber = bankAccountRaw;
        }
      }

      if ("bankName" in body) {
        const bankName = normalizeString(body.bankName, "银行名称");

        if (!bankName) {
          data.bankName = null;
        } else if (bankName.length < 2 || bankName.length > 80) {
          throw new Error("银行名称长度需在 2-80 个字符之间");
        } else {
          data.bankName = bankName;
        }
      }

      if (Object.keys(data).length === 0) {
        return c.json({ message: "没有可更新的字段" }, 400);
      }

      if (data.bankAccountNumber !== undefined && data.bankAccountNumber !== null) {
        const hasBankName =
          typeof data.bankName === "string"
            ? Boolean(data.bankName)
            : data.bankName === null
              ? false
              : Boolean(
                  (await prisma.user.findUnique({ where: { id: user.id }, select: { bankName: true } }))?.bankName,
                );

        if (!hasBankName) {
          throw new Error("填写银行卡号时请同时填写银行名称");
        }
      }

      const profile = await prisma.user.update({
        where: { id: user.id },
        data,
        select: {
          name: true,
          idCardNumber: true,
          bankAccountNumber: true,
          bankName: true,
        },
      });

      return c.json({
        profile: {
          name: profile.name,
          idCardNumber: profile.idCardNumber ?? "",
          bankAccountNumber: profile.bankAccountNumber ?? "",
          bankName: profile.bankName ?? "",
        },
      });
    } catch (error) {
      return c.json({ message: error instanceof Error ? error.message : "更新失败" }, 400);
    }
  });

export default userRoutes;
