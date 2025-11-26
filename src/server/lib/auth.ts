import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization, twoFactor, username, phoneNumber } from "better-auth/plugins";
import { prisma } from "./db";
import { sendSms } from "./sms";

const parseOrigin = (value?: string | null) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const authOrigin =
  parseOrigin(process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:3000";

const trustedOrigins = Array.from(
  new Set(
    [
      ...((process.env.TRUSTED_ORIGINS || process.env.BETTER_AUTH_TRUSTED_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)),
      authOrigin,
      "http://localhost:3000",
    ].filter(Boolean),
  ),
);

export const auth = betterAuth({
  baseURL: `${authOrigin}/api/auth`,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    generateId: () => crypto.randomUUID(),
  },
  plugins: [
    organization(),
    twoFactor(),
    admin(),
    username(),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // 使用现有的 SMS 发送函数
        const result = await sendSms(phoneNumber, code);
        if (!result.success) {
          throw new Error(result.error || "发送验证码失败");
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 分钟
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber}@phone.local`;
        },
        getTempName: (phoneNumber) => {
          return `用户${phoneNumber.slice(-4)}`;
        },
      },
    }),
  ],
});
