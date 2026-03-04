const matchRoute = (pathname: string | null, routes: string[]) => {
  if (!pathname) return false;
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
};

export const navigationConfig = {
  // 深层任务页隐藏 Tabbar，避免遮挡编辑与审核操作
  hideTabbarRoutes: ["/chat", "/example-ui", "/ai-image", "/finance/edit", "/finance/admin"],
  // 登录注册等页面无需 Tabbar
  authRoutes: ["/sign-in", "/sign-up"],
  // AI 对话与生图页使用沉浸式布局
  immersiveRoutes: ["/chat", "/example-ui", "/ai-image"],
};

export const shouldHideTabbar = (pathname: string | null) => {
  return matchRoute(pathname, navigationConfig.hideTabbarRoutes) || matchRoute(pathname, navigationConfig.authRoutes);
};

export const isImmersivePage = (pathname: string | null) => {
  return matchRoute(pathname, navigationConfig.immersiveRoutes);
};
