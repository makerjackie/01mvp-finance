import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetchCallback = ({ setIsPending }: { setIsPending: (value: boolean) => void }) => {
  return {
    onRequest: () => {
      setIsPending(true);
    },
    onResponse: () => {
      setIsPending(false);
    },
  };
};

export function getUserDisplayName(
  user:
    | {
        name?: string | null;
        phoneNumber?: string | null;
        username?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
) {
  if (!user) return "用户";

  // 优先显示昵称
  if (user.name) return user.name;

  // 如果有手机号，显示手机号后4位
  if (user.phoneNumber) {
    return `用户${user.phoneNumber.slice(-4)}`;
  }

  // 如果有用户名，显示用户名
  if (user.username) return user.username;

  // 如果有邮箱且不是自动生成的邮箱
  if (user.email && !user.email.endsWith("@phone.local") && !user.email.endsWith("@local.test")) {
    return user.email;
  }

  return "用户";
}

/**
 * 获取当前应用的 Base URL
 * 优先使用浏览器环境的 window.location.origin
 * 其次使用环境变量 NEXT_PUBLIC_API_URL
 * 最后回退到 localhost
 */
export function getBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:3000";
}
