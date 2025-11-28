import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ExampleLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Shared shell for Example UI pages.
 * Mobile keeps a single column; desktop adds max-width, extra padding and optional sidebar/rail.
 */
export function ExampleLayout({ children, header, sidebar, className, contentClassName }: ExampleLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50/50 pb-safe", className)}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 lg:px-8 pb-24">
        {header}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {sidebar ? <aside className="sticky top-20 hidden h-fit w-64 shrink-0 md:block">{sidebar}</aside> : null}
          <main className={cn("flex-1 space-y-6", contentClassName)}>{children}</main>
        </div>
      </div>
    </div>
  );
}
