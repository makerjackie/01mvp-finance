import { getAppNavItems, type AppNavUser } from "@/lib/config/app-nav-items";

export type AdminMobileTab = {
  key: string;
  title: string;
  href: string;
  activePath: string;
};

export function getAdminMobileTabs(user?: AppNavUser): AdminMobileTab[] {
  const navItems = getAppNavItems(user);
  const adminGroup = navItems.find((item) => item.key === "admin");
  if (!adminGroup?.children?.length) {
    return [];
  }

  return adminGroup.children.map((item) => ({
    key: item.key,
    title: item.title,
    href: item.href,
    activePath: item.activePath,
  }));
}
