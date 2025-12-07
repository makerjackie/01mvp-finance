"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import {
  Activity,
  Download,
  UploadCloud,
  FileSpreadsheet,
  Database,
  ShieldCheck,
  RefreshCw,
  Globe2,
} from "lucide-react";

type ImportSummary = {
  created: number;
  updated: number;
  skipped: { email: string; reason: string }[];
};

type HealthInfo = {
  status: string;
  checks: {
    database?: { ok: boolean; latencyMs?: number; error?: string };
    runtime?: { node?: string; memory?: number };
  };
  uptimeSeconds: number;
  now: string;
};

type EnvInfo = {
  env: { key: string; present: boolean; preview: string | null }[];
  publicEnv: { key: string; value?: string }[];
  now: string;
};

type AdminOpsPanelProps = {
  canRunOps?: boolean;
};

export function AdminOpsPanel({ canRunOps = true }: AdminOpsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/system/admin/health", { credentials: "include" });
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取健康状态失败");
    }
  };

  const fetchEnv = async () => {
    try {
      const res = await fetch("/api/system/admin/env", { credentials: "include" });
      const data = await res.json();
      setEnvInfo(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取环境变量失败");
    }
  };

  useEffect(() => {
    if (!canRunOps) return;
    fetchHealth();
    fetchEnv();
  }, [canRunOps]);

  const handleImport = async (file: File) => {
    if (!canRunOps) return;
    setImporting(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/admin/users/import", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": file.type || "text/plain" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "导入失败");
      }
      setSummary(data.summary);
      toast.success("导入完成");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导入失败");
    } finally {
      setImporting(false);
    }
  };

  const handleSelectFile = () => {
    if (!canRunOps) return;
    fileInputRef.current?.click();
  };

  const renderEnvBadge = (present: boolean) =>
    present ? (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
        已配置
      </Badge>
    ) : (
      <Badge variant="outline" className="border-destructive/40 text-destructive">
        缺失
      </Badge>
    );

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">数据导入导出</CardTitle>
            <p className="text-sm text-muted-foreground">支持用户 CSV 导出与批量导入，便于迁移与合规备份。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/api/admin/users/export", "_blank")}
              disabled={!canRunOps}
            >
              <Download className="mr-2 h-4 w-4" />
              导出用户 CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,application/json,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleImport(file);
                event.target.value = "";
              }}
            />
            <Button size="sm" onClick={handleSelectFile} disabled={importing || !canRunOps}>
              {importing ? <LoaderIcon /> : <UploadCloud className="mr-2 h-4 w-4" />}
              导入 CSV/JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            CSV 列顺序：<code className="text-foreground">name,email,role</code>（首行可含表头），role 支持{" "}
            <code>user</code> /<code>manager</code> /<code>admin</code>。
          </div>
          {summary && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  新增 {summary.created}
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  更新 {summary.updated}
                </Badge>
                {summary.skipped.length > 0 && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                    跳过 {summary.skipped.length}
                  </Badge>
                )}
              </div>
              {summary.skipped.length > 0 && (
                <div className="mt-2 space-y-1 text-xs">
                  {summary.skipped.slice(0, 3).map((item) => (
                    <p key={item.email}>
                      {item.email} - {item.reason}
                    </p>
                  ))}
                  {summary.skipped.length > 3 && <p>... 还有 {summary.skipped.length - 3} 条被跳过</p>}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-1 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">健康检查</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchHealth} className="gap-2" disabled={!canRunOps}>
              <RefreshCw className="h-4 w-4" /> 刷新
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!health ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <LoaderIcon /> 正在拉取健康状态...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={health.status === "ok" ? "secondary" : "destructive"} className="gap-1">
                    <Activity className="h-3 w-3" />
                    {health.status === "ok" ? "健康" : "异常"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    启动 {Math.round(health.uptimeSeconds / 60)} 分钟，时间{" "}
                    {new Date(health.now).toLocaleString("zh-CN")}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <HealthItem
                    icon={<Database className="h-4 w-4 text-primary" />}
                    title="数据库"
                    ok={Boolean(health.checks.database?.ok)}
                    detail={
                      health.checks.database?.latencyMs
                        ? `${health.checks.database.latencyMs} ms`
                        : health.checks.database?.error || "未知"
                    }
                  />
                  <HealthItem
                    icon={<ShieldCheck className="h-4 w-4 text-primary" />}
                    title="运行时"
                    ok
                    detail={health.checks.runtime?.node ? `Node ${health.checks.runtime.node}` : "运行中"}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">环境变量（只读）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!envInfo ? (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <LoaderIcon /> 加载中...
              </div>
            ) : (
              <>
                <div className="space-y-2 text-xs">
                  {envInfo.env.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{item.key}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderEnvBadge(item.present)}
                        {item.preview && <span className="text-[11px] text-muted-foreground">{item.preview}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">公开变量</p>
                  {envInfo.publicEnv.length === 0 ? (
                    <p className="text-xs text-muted-foreground">暂无 NEXT_PUBLIC_ 前缀变量</p>
                  ) : (
                    envInfo.publicEnv.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Globe2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">{item.key}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">{item.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoaderIcon() {
  return <RefreshCw className="mr-2 h-4 w-4 animate-spin" />;
}

function HealthItem({ icon, title, ok, detail }: { icon: ReactNode; title: string; ok: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/70 px-3 py-2">
      <div className="flex items-center gap-2">
        {icon}
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <Badge variant={ok ? "secondary" : "destructive"} className="text-[11px]">
        {ok ? "正常" : "异常"}
      </Badge>
    </div>
  );
}
