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
  };
  lastUpdated?: string;
};

export function AdminConfigPanel({ initialConfig, lastUpdated }: AdminConfigPanelProps) {
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

  const handleToggle = (checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      passwordLoginEnabled: checked,
    }));
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
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "保存配置失败");
        }

        setConfig({
          passwordLoginEnabled: data.config.passwordLoginEnabled,
        });
        setDirty(false);
        toast.success("配置已保存");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "保存配置失败");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-muted/50 px-4 py-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">账户密码登录</p>
          <p className="text-xs text-muted-foreground">关闭后仅保留手机号验证码登录，随时可重新开启。</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={config.passwordLoginEnabled ? "outline" : "destructive"}
              className="h-6 rounded-full border-border/60 px-2 text-[11px]"
            >
              {config.passwordLoginEnabled ? "已开启" : "已关闭"}
            </Badge>
            {dirty && (
              <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                有未保存的更改
              </span>
            )}
            {formattedUpdatedAt && <span className="text-xs text-muted-foreground">更新：{formattedUpdatedAt}</span>}
          </div>
        </div>
        <Switch checked={config.passwordLoginEnabled} onCheckedChange={handleToggle} disabled={isPending} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          {config.passwordLoginEnabled ? (
            <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
          ) : (
            <ShieldOff className="mt-0.5 h-4 w-4 text-amber-500" />
          )}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {config.passwordLoginEnabled ? "密码登录已开放" : "密码登录已被关闭"}
            </p>
            <p className="text-xs text-muted-foreground">
              {config.passwordLoginEnabled ? "支持用户名/密码与短信并存。" : "用户将仅能通过短信验证码注册与登录。"}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={!dirty || isPending} className="sm:w-auto">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存配置
        </Button>
      </div>
    </div>
  );
}
