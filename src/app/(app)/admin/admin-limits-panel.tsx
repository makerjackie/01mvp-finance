"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { Loader2, Gauge, Activity, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";

type LimitsConfig = {
  perUserDailyQuota: number;
  globalDailyQuota: number;
  perUserRateLimit: number;
  globalRateLimit: number;
  maintenanceMode: boolean;
};

type AdminLimitsPanelProps = {
  initialConfig: LimitsConfig;
};

const numberFormatter = new Intl.NumberFormat("zh-CN");

export function AdminLimitsPanel({ initialConfig }: AdminLimitsPanelProps) {
  const [config, setConfig] = useState(initialConfig);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const rateSummary = useMemo(
    () => [
      { label: "单用户 / 分钟", value: config.perUserRateLimit },
      { label: "全局 / 分钟", value: config.globalRateLimit },
      { label: "单用户 / 天", value: config.perUserDailyQuota },
      { label: "全局 / 天", value: config.globalDailyQuota },
    ],
    [config],
  );

  const handleChange = (key: keyof LimitsConfig, value: number | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    setDirty(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/system/admin/config", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || "保存失败");
        }
        setConfig((prev) => ({
          ...prev,
          ...data.config,
        }));
        setDirty(false);
        toast.success("配额与限流已更新");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "保存失败");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-gray-50/40 p-4 shadow-sm dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-sm">
          <Activity className="mt-0.5 h-4 w-4 text-primary" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">配额与限流统一入口</p>
            <p className="text-xs text-muted-foreground">控制单用户/全局速率、日配额以及维护模式开关，方便按需限流。</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-border/60 text-[11px]">
                每日单用户 {numberFormatter.format(config.perUserDailyQuota)} 次
              </Badge>
              <Badge variant="outline" className="rounded-full border-border/60 text-[11px]">
                每分钟单用户 {numberFormatter.format(config.perUserRateLimit)} 次
              </Badge>
              {dirty && (
                <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                  有未保存更改
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/80 px-3 py-2">
          <Power className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">维护模式</p>
            <p className="text-[11px] text-muted-foreground">开启后可用于临时关闭重要入口</p>
          </div>
          <Switch
            checked={config.maintenanceMode}
            onCheckedChange={(checked) => handleChange("maintenanceMode", checked)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <LimitCard
          title="访问速率"
          description="用于突发保护，分钟级限流。"
          icon={<Gauge className="h-4 w-4 text-primary" />}
        >
          <LimitInput
            label="单用户 / 分钟"
            value={config.perUserRateLimit}
            suffix="次"
            onChange={(value) => handleChange("perUserRateLimit", value)}
            disabled={isPending}
          />
          <LimitInput
            label="全局 / 分钟"
            value={config.globalRateLimit}
            suffix="次"
            onChange={(value) => handleChange("globalRateLimit", value)}
            disabled={isPending}
          />
        </LimitCard>

        <LimitCard title="日配额" description="用于成本控制，超限可回退到静态体验。">
          <LimitInput
            label="单用户 / 天"
            value={config.perUserDailyQuota}
            suffix="次"
            onChange={(value) => handleChange("perUserDailyQuota", value)}
            disabled={isPending}
          />
          <LimitInput
            label="全局 / 天"
            value={config.globalDailyQuota}
            suffix="次"
            onChange={(value) => handleChange("globalDailyQuota", value)}
            disabled={isPending}
          />
        </LimitCard>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-foreground">保存后即时生效</p>
          <p className="text-xs text-muted-foreground">
            限流配置会同步到后端配置表 AppConfig，可继续扩展到中间件或队列任务。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConfig(initialConfig);
              setDirty(false);
            }}
            disabled={isPending || !dirty}
          >
            重置
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存配置
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-xs text-muted-foreground sm:grid-cols-2">
        {rateSummary.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-2"
          >
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-sm text-foreground">
              {numberFormatter.format(item.value)}
              <span className="ml-1 text-[11px] text-muted-foreground">次</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitCard({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {icon && <div className="rounded-full bg-muted/60 p-2">{icon}</div>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function LimitInput({
  label,
  value,
  suffix,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="border-none bg-transparent px-0 focus-visible:ring-0"
          min={0}
          disabled={disabled}
        />
        {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}
