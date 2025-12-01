import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization, twoFactor, username, phoneNumber } from "better-auth/plugins";
import { prisma } from "./db";
import { sendSms } from "./sms";
import { getBaseUrl, getPublicUrl } from "@/lib/utils";

// 服务端内部调用：使用 http://localhost 避免 Docker 容器中的 SSL 错误
const internalBaseURL = getBaseUrl();

// 客户端访问和 CORS：使用外部 URL（支持 HTTPS）
const publicURL = getPublicUrl();

// Debug logging for auth configuration
console.log("[Auth Config] internalBaseURL:", internalBaseURL);
console.log("[Auth Config] publicURL:", publicURL);
console.log("[Auth Config] NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
console.log("[Auth Config] PORT:", process.env.PORT);

// Trusted Origins：允许客户端和本地开发的请求
const trustedOrigins = Array.from(
  new Set(
    [
      publicURL,
      "http://localhost:3000",
      ...(process.env.TRUSTED_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ].filter(Boolean),
  ),
);

export const auth = betterAuth({
  baseURL: `${internalBaseURL}/api/auth`,
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
