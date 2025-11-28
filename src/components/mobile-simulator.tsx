"use client";

import { cn } from "@/lib/utils";

interface MobileSimulatorProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileSimulator({ children, className }: MobileSimulatorProps) {
  return (
    <div className="w-full h-full flex justify-center bg-gray-50/50 dark:bg-neutral-950 p-4 md:p-8">
      <div
        className={cn(
          // Mobile: Full width/height, no borders
          "w-full h-full md:h-[844px] md:w-[390px]", // iPhone 12/13/14 Pro dimensions
          // Desktop: Border, shadow, rounded corners, hidden scrollbar for container
          "md:border-[8px] md:border-gray-900 md:rounded-[3rem] md:shadow-2xl",
          "md:overflow-hidden md:relative bg-background",
          // Creating a containing block for fixed descendants
          "md:[transform:scale(1)]",
          className,
        )}
      >
        {/* Inner container for scrolling content */}
        <div className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-hide">{children}</div>
      </div>
    </div>
  );
}
