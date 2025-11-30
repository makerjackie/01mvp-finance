"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImmersiveHeaderProps {
  title?: string;
  className?: string;
  actions?: React.ReactNode;
  showBack?: boolean;
}

export function ImmersiveHeader({ className, title, showBack = true, actions }: ImmersiveHeaderProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex h-14 w-full items-center justify-between bg-background/80 backdrop-blur-xl px-4 border-b border-border/40",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9 rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">返回</span>
          </Button>
        )}
        {title && <h1 className="text-base font-semibold">{title}</h1>}
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}
