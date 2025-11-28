const matchRoute = (pathname: string | null, routes: string[]) => {
  if (!pathname) return false;
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
};

export const navigationConfig = {
  // 需要隐藏 Tabbar 的沉浸式/深层任务页（聊天详情、个人设置等）
  hideTabbarRoutes: ["/chat", "/me/edit", "/example-ui"],
  // 登录注册等页面无需 Tabbar，虽然不在 (app) 布局中，保留给组件做防御性判断
  authRoutes: ["/sign-in", "/sign-up"],
  // 全屏/沉浸式页面（去除默认 Padding 和 MaxWidth）
  immersiveRoutes: ["/chat", "/example-ui"],
};

export const shouldHideTabbar = (pathname: string | null) => {
  return matchRoute(pathname, navigationConfig.hideTabbarRoutes) || matchRoute(pathname, navigationConfig.authRoutes);
};

export const isImmersivePage = (pathname: string | null) => {
  return matchRoute(pathname, navigationConfig.immersiveRoutes);
};
