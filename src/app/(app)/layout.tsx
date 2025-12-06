import { headers } from "next/headers";
import { auth } from "@/server/lib/auth";
import { DesktopSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { MobileTabbar } from "@/components/mobile-tabbar";
import { AppMain } from "@/components/app-main";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // 简单的登录保护 (Optional: 可以根据需要放开某些页面)
  if (!session?.user) {
    // 注意：这里可以根据需求决定是否强制跳转，或者允许未登录访问部分功能
    // redirect("/sign-in");
  }

  const user = session?.user;

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50/50 dark:bg-neutral-950">
      {/* Desktop Sidebar - 仅在 md 以上显示 */}
      <DesktopSidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* App Header - 包含 Mobile Menu Trigger */}
        <AppHeader user={user} />

        {/* Page Content */}
        <AppMain>{children}</AppMain>
      </div>

      {/* Mobile Tabbar - 仅在 md 以下显示，固定底部 */}
      <MobileTabbar user={user} />
    </div>
  );
}
