import Link from "next/link";
import { type LucideIcon, ChevronRight, KeyRound, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SettingsMenuProps {
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

type MenuKey = "profile" | "password";

interface MenuItem {
  key: MenuKey;
  title: string;
  icon: LucideIcon;
  href: string;
  meta?: string;
  badge?: string;
}

export function SettingsMenu({ username, email, phoneNumber }: SettingsMenuProps) {
  const items: MenuItem[] = [
    {
      key: "profile",
      title: "编辑个人资料",
      icon: UserIcon,
      href: "/me/profile",
      meta: `${email || "未填写"} · ${username || "未设置"}`,
      badge: "资料",
    },
    {
      key: "password",
      title: "修改密码",
      icon: KeyRound,
      href: "/me/password",
      meta: phoneNumber ? `已绑定手机号 ${phoneNumber}` : "建议绑定手机号以增强安全性",
      badge: "安全",
    },
  ];

  return (
    <div className="divide-y divide-border/40">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex w-full items-center justify-between px-3 py-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  {item.badge ? (
                    <Badge variant="secondary" className="h-5 rounded-full border-border/60 px-2 text-[10px]">
                      {item.badge}
                    </Badge>
                  ) : null}
                </div>
                {item.meta ? <p className="text-[11px] text-muted-foreground/80">{item.meta}</p> : null}
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
}
