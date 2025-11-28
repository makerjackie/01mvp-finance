"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, KeyRound, User as UserIcon } from "lucide-react";
import { ProfileForm } from "./profile-form";
import { ChangePasswordForm } from "./change-password-form";

interface SettingsMenuProps {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

type MenuKey = "profile" | "password" | null;

export function SettingsMenu({ name, username, email, phoneNumber }: SettingsMenuProps) {
  const [openKey, setOpenKey] = useState<MenuKey>(null);

  const items = [
    {
      key: "profile" as const,
      title: "编辑个人信息",
      description: "修改昵称，查看账号、邮箱和手机号。",
      icon: <UserIcon className="h-4 w-4 text-muted-foreground" />,
      content: <ProfileForm name={name} username={username} email={email} phoneNumber={phoneNumber} />,
    },
    {
      key: "password" as const,
      title: "修改密码",
      description: "更新登录密码并同时下线其他会话。",
      icon: <KeyRound className="h-4 w-4 text-muted-foreground" />,
      content: <ChangePasswordForm />,
    },
  ];

  const toggle = (key: MenuKey) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="rounded-xl bg-card">
      {items.map((item, index) => {
        const opened = openKey === item.key;
        return (
          <div key={item.key} className={index > 0 ? "border-t border-border/50" : undefined}>
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40"
              onClick={() => toggle(item.key)}
            >
              <span className="mt-0.5">{item.icon}</span>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {opened ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {opened && (
              <div className="px-4 pb-4">
                <div className="rounded-lg border bg-background/50 p-4">{item.content}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
