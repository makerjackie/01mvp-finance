"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminMobileTab } from "@/lib/config/admin-tabs";

type MobileAdminSubtabsProps = {
  tabs: AdminMobileTab[];
};

export function MobileAdminSubtabs({ tabs }: MobileAdminSubtabsProps) {
  const pathname = usePathname();

  const activeHref = useMemo(() => {
    const matched = tabs
      .filter((tab) => pathname === tab.activePath || pathname?.startsWith(`${tab.activePath}/`))
      .sort((a, b) => b.activePath.length - a.activePath.length);
    return matched[0]?.href ?? null;
  }, [tabs, pathname]);

  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div className="sticky top-14 z-10 -mx-4 mb-3 border-b border-border/50 bg-background/90 px-4 py-2 backdrop-blur md:hidden">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-2 pr-2">
          {tabs.map((tab) => {
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
  );
}
