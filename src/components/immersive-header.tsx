"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, MoreHorizontal, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImmersiveHeaderProps {
  title?: string;
  className?: string;
  actions?: React.ReactNode;
  scrollThreshold?: number;
}

export function ImmersiveHeader({ title, className, actions, scrollThreshold = 10 }: ImmersiveHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/40",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="-ml-2 h-9 w-9 rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">返回</span>
        </Button>
        {title && <h1 className="text-base font-semibold truncate max-w-[200px]">{title}</h1>}
      </div>

      <div className="flex items-center gap-1">
        {actions || (
          <>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
