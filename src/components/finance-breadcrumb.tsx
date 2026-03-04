import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FinanceBreadcrumbItem = {
  label: string;
  href?: string;
};

interface FinanceBreadcrumbProps {
  items: FinanceBreadcrumbItem[];
  className?: string;
  mobileOnly?: boolean;
}

export function FinanceBreadcrumb({ items, className, mobileOnly = true }: FinanceBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="页面路径"
      className={cn(
        "mb-3 flex items-center gap-1 text-xs text-muted-foreground sm:text-sm",
        mobileOnly && "md:hidden",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const key = `${item.label}-${index}`;

        return (
          <div key={key} className="flex min-w-0 items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="rounded-sm px-1 py-0.5 transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className={cn("px-1 py-0.5", isLast && "truncate font-medium text-foreground")}>{item.label}</span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
