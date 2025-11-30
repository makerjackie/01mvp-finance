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
 * 获取当前应用的 Base URL (Internal/Smart)
 * 用于 API 请求、Auth Client 等
 * - 客户端：使用 window.location.origin
 * - 服务端：优先使用 http://localhost:PORT 避免 SSL 错误和网络回环
 * - 回退：使用环境变量或 localhost
 */
export function getBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  // 服务端环境：优先使用本地回环地址
  // 避免 fetch('https://...') 导致的 ERR_SSL_PACKET_LENGTH_TOO_LONG 错误
  if (typeof window === "undefined") {
    const port = process.env.PORT || 3000;
    return `http://localhost:${port}`;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:3000";
}

/**
 * 获取当前应用的公开 URL (Always Public)
 * 用于 SEO、Metadata、Redirects 等需要绝对公网路径的场景
 */
export function getPublicUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:3000";
}
