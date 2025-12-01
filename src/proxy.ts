import { betterFetch } from "@better-fetch/fetch";
import type { Session, User } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

type SessionResponse = {
  session: Session;
  user: User;
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 使用容器内的 HTTP 回环地址，避免 behind TLS (Caddy) 时出现 ERR_SSL_PACKET_LENGTH_TOO_LONG
  const internalBaseUrl = process.env.INTERNAL_BASE_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;

  // 如果是 API 路由或静态资源，跳过中间件
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // 获取当前 session
  let session: SessionResponse | null = null;
  try {
    const { data } = await betterFetch<SessionResponse>("/api/auth/get-session", {
      baseURL: internalBaseUrl,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });
    session = data;
  } catch (error) {
    // 留下足够的上下文便于线上排查，但避免输出用户 Cookie
    console.error("[proxy] failed to fetch session", {
      message: error instanceof Error ? error.message : String(error),
      baseURL: internalBaseUrl,
      pathname,
    });
  }

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
