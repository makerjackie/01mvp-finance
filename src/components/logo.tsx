import Image from "next/image";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  showText?: boolean;
  size?: number;
  className?: string;
  textClassName?: string;
  priority?: boolean;
}

export function Logo({ showText = true, size = 28, className, textClassName, priority }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/logo-01.svg"
        alt={`${siteConfig.name} 标识`}
        width={size}
        height={size}
        priority={priority}
        className="rounded-lg"
      />
      {showText && <span className={cn("font-semibold tracking-tight", textClassName)}>{siteConfig.name}</span>}
    </span>
  );
}

export function LogoMark({
  size = 28,
  className,
  priority,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/logo-01.svg"
      alt={`${siteConfig.name} 图标`}
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-lg", className)}
    />
  );
}
