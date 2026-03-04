"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";

type AdminConfigPanelProps = {
  initialConfig: {
    passwordLoginEnabled: boolean;
    smsLoginEnabled: boolean;
  };
  lastUpdated?: string;
  canManage?: boolean;
};

export function AdminConfigPanel({ initialConfig, lastUpdated, canManage = true }: AdminConfigPanelProps) {
  const [config, setConfig] = useState(initialConfig);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const formattedUpdatedAt = useMemo(() => {
    if (!lastUpdated) return null;
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(lastUpdated));
    } catch {
      return null;
    }
  }, [lastUpdated]);

  const handleToggle = (key: keyof typeof initialConfig, checked: boolean) => {
    if (!canManage) return;
    setConfig((prev) => ({ ...prev, [key]: checked }));
    setDirty(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/system/admin/config", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            passwordLoginEnabled: config.passwordLoginEnabled,
            smsLoginEnabled: config.smsLoginEnabled,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "保存配置失败");
        }

        setConfig({
          passwordLoginEnabled: data.config.passwordLoginEnabled,
          smsLoginEnabled: data.config.smsLoginEnabled,
        });
        setDirty(false);
        toast.success("配置已保存");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "保存配置失败");
      }
    });
  };

  const allDisabled = !config.passwordLoginEnabled && !config.smsLoginEnabled;
  const loginOptions = [
    {
      key: "smsLoginEnabled" as const,
      title: "短信验证码登录",
      description: "使用手机号 + 验证码完成注册与登录。",
      enabled: config.smsLoginEnabled,
      locked: false,
    },
    {
      key: "passwordLoginEnabled" as const,
      title: "用户名/密码登录（已下线）",
      description: "密码登录已关闭，系统仅支持手机号验证码登录。",
      enabled: false,
      locked: true,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {loginOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-muted/50 px-4 py-3"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{option.title}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={option.enabled ? "outline" : "destructive"}
                  className="h-6 rounded-full border-border/60 px-2 text-[11px]"
                >
                  {option.enabled ? "已开启" : "已关闭"}
                </Badge>
                {dirty && (
                  <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                    有未保存的更改
                  </span>
                )}
                {formattedUpdatedAt && (
                  <span className="text-xs text-muted-foreground">更新：{formattedUpdatedAt}</span>
                )}
              </div>
            </div>
            <Switch
              checked={option.enabled}
              onCheckedChange={(checked) => handleToggle(option.key, checked)}
              disabled={isPending || !canManage || option.locked}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          {config.passwordLoginEnabled || config.smsLoginEnabled ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
          ) : (
            <ShieldOff className="mt-0.5 h-4 w-4 text-amber-500" />
          )}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {allDisabled ? "所有登录方式均已关闭" : "登录方式已按需启用"}
            </p>
            <p className="text-xs text-muted-foreground">
              {allDisabled
                ? "请至少开启一种登录方式，否则用户无法登录。"
                : "建议保留至少一种登录方式，便于应急或不同终端需求。"}
            </p>
            {!canManage && (
              <p className="text-xs text-muted-foreground/80">当前账号为只读，可联系管理员修改登录策略。</p>
            )}
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || isPending || !canManage} className="sm:w-auto">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存配置
        </Button>
      </div>
    </div>
  );
}
