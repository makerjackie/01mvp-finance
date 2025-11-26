import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization, twoFactor, username, phoneNumber } from "better-auth/plugins";
import { prisma } from "./db";
import { sendSms } from "./sms";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/auth`
    : "http://localhost:3000/api/auth",
  trustedOrigins: ["http://localhost:3000"],
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
