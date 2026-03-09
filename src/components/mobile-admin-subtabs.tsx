"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminMobileTab } from "@/lib/config/admin-tabs";
import { getAdminMobileTabs } from "@/lib/config/admin-tabs";
import type { AppNavUser } from "@/lib/config/app-nav-items";
import { authClient } from "@/lib/auth-client";

type MobileAdminSubtabsProps = {
  tabs: AdminMobileTab[];
};

export function MobileAdminSubtabs({ tabs }: MobileAdminSubtabsProps) {
  const pathname = usePathname();
  const { data: sessionData } = authClient.useSession();

  const visibleTabs = useMemo(() => {
    const sessionTabs = getAdminMobileTabs(sessionData?.user as AppNavUser);
    if (sessionTabs.length > 0) {
      return sessionTabs;
    }
    return tabs;
  }, [sessionData?.user, tabs]);

  const activeHref = useMemo(() => {
    const matched = visibleTabs
      .filter((tab) => pathname === tab.activePath || pathname?.startsWith(`${tab.activePath}/`))
      .sort((a, b) => b.activePath.length - a.activePath.length);
    return matched[0]?.href ?? null;
  }, [visibleTabs, pathname]);

  if (visibleTabs.length <= 1) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 md:hidden">
      <div className="rounded-2xl border border-border/50 bg-background/90 p-2 shadow-lg backdrop-blur-xl">
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 pr-2">
            {visibleTabs.map((tab) => {
              const active = tab.href === activeHref;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 bg-background text-muted-foreground",
                  )}
                >
                  {tab.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
