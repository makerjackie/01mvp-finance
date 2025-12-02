import { betterFetch } from "@better-fetch/fetch";
import type { Session, User } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

type SessionResponse = {
  session: Session;
  user: User;
};

// 缓存一次成功的内部 base URL，避免每次请求都重试
let cachedInternalBaseUrl: string | null = null;

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const port = process.env.PORT || "3000";
  const candidateBaseUrls = Array.from(
    new Set(
      [
        process.env.INTERNAL_BASE_URL,
        process.env.INTERNAL_HOST,
        process.env.INTERNAL_HOSTNAME,
        process.env.HOSTNAME ? `http://${process.env.HOSTNAME}:${port}` : null,
        `http://127.0.0.1:${port}`,
        `http://localhost:${port}`,
        `http://app:${port}`, // docker-compose 默认服务名
      ].filter(Boolean),
    ),
  ) as string[];

  const serializeError = (error: unknown) => {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause instanceof Error ? error.cause.message : error.cause,
      };
    }
    return { message: String(error) };
  };

  // 如果是 API 路由或静态资源，跳过中间件
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) {
    // 没有 cookie 直接认为未登录，避免无意义的内部请求
    return handleRouting({ pathname, session: null, request });
  }

  // 获取当前 session
  let session: SessionResponse | null = null;

  const tryFetchSession = async (baseUrl: string) => {
    const sessionUrl = `${baseUrl.replace(/\/+$/, "")}/api/auth/get-session`;
    const logContext = { url: sessionUrl, pathname, hasCookie: Boolean(cookieHeader) };

    try {
      const { data } = await betterFetch<SessionResponse>(sessionUrl, {
        headers: { cookie: cookieHeader },
      });
      return { session: data, error: null, baseUrl };
    } catch (error) {
      // 降级到原生 fetch
      try {
        const res = await fetch(sessionUrl, {
          headers: { cookie: cookieHeader },
          cache: "no-store",
        });

        if (res.ok) {
          const data = (await res.json()) as SessionResponse;
          return { session: data, error: null, baseUrl };
        }

        return {
          session: null,
          error: {
            ...logContext,
            status: res.status,
            statusText: res.statusText,
          },
          baseUrl,
        };
      } catch (fallbackError) {
        return { session: null, error: { ...logContext, error: serializeError(fallbackError) }, baseUrl };
      }
    }
  };

  const basesToTry = cachedInternalBaseUrl ? [cachedInternalBaseUrl] : candidateBaseUrls;
  const errors: unknown[] = [];

  for (const baseUrl of basesToTry) {
    const result = await tryFetchSession(baseUrl);
    if (result.session) {
      session = result.session;
      cachedInternalBaseUrl = baseUrl;
      break;
    }
    if (result.error) {
      errors.push(result.error);
    }
  }

  if (!session) {
    console.error("[proxy] session fetch failed for all candidates", {
      pathname,
      hasCookie: Boolean(cookieHeader),
      tried: basesToTry,
      errors,
    });
  }

  return handleRouting({ pathname, session, request });
}

function handleRouting({
  pathname,
  session,
  request,
}: {
  pathname: string;
  session: SessionResponse | null;
  request: NextRequest;
}) {
  // 需要保护的路由列表
  const protectedRoutes = ["/dashboard", "/me"];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // 公开路由（已登录用户不应访问）
  const authRoutes = ["/sign-in", "/sign-up"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 如果访问受保护路由但未登录，重定向到登录页
  if (isProtectedRoute && !session?.user) {
    const redirectUrl = new URL("/sign-in", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 如果已登录访问登录/注册页，重定向到首页
  if (isAuthRoute && session?.user) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
