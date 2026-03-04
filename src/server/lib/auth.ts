import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization, twoFactor, username, phoneNumber } from "better-auth/plugins";
import { prisma } from "./db";
import { sendSms } from "./sms";
import { getBaseUrl, getPublicUrl } from "@/lib/utils";

const normalizeOrigin = (value?: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    // 退化处理：简单去除尾部斜杠
    return value.replace(/\/+$/, "");
  }
};

const withOriginVariants = (value?: string | null) => {
  const origin = normalizeOrigin(value);
  if (!origin) return [];
  return [origin, `${origin}/`];
};

// 服务端内部调用：使用 http://localhost 避免 Docker 容器中的 SSL 错误
const internalBaseURL = getBaseUrl();

// 客户端访问和 CORS：使用外部 URL（支持 HTTPS）
const publicURL = getPublicUrl();

// Trusted Origins：允许客户端和本地开发的请求
const trustedOrigins = Array.from(
  new Set(
    [
      ...withOriginVariants(publicURL),
      ...withOriginVariants("http://localhost:3000"),
      ...(process.env.TRUSTED_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .flatMap((s) => withOriginVariants(s)),
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
    expiresIn: 30 * 24 * 60 * 60, // 30 days (seconds)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    database: {
      generateId: () => crypto.randomUUID(),
    },
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
