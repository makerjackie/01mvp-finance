"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { Loader2, Flag, Rocket, FlaskConical, Trash2, RefreshCw } from "lucide-react";

type FeatureFlagItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: "on" | "off" | "rollout";
  rolloutPercentage: number;
  tags: string[];
  updatedAt: string;
};

type CreateFlagPayload = {
  key: string;
  name: string;
  rolloutPercentage: number;
};

export function AdminFeatureFlagsPanel() {
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFlagPayload>({
    key: "",
    name: "",
    rolloutPercentage: 0,
  });

  const stats = useMemo(() => {
    return {
      on: flags.filter((f) => f.status === "on").length,
      off: flags.filter((f) => f.status === "off").length,
      rollout: flags.filter((f) => f.status === "rollout").length,
    };
  }, [flags]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feature-flags", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "获取开关列表失败");
      }
      setFlags(data.flags || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const payload = {
          key: form.key.trim(),
          name: form.name.trim() || form.key.trim(),
          rolloutPercentage: Math.max(0, Math.min(100, Math.round(form.rolloutPercentage))),
          status: form.rolloutPercentage > 0 ? ("rollout" as const) : ("off" as const),
        };
        if (!payload.key) {
          toast.error("请填写 key");
          return;
        }
        const res = await fetch("/api/admin/feature-flags", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "创建失败");
        }
        setFlags((prev) => [data.flag, ...prev]);
        setForm({ key: "", name: "", rolloutPercentage: 0 });
        toast.success("已创建 Feature Flag");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "创建失败");
      }
    });
  };

  const handleUpdate = async (id: string, patch: Partial<FeatureFlagItem>) => {
    setWorkingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/feature-flags/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "更新失败");
        }
        setFlags((prev) => prev.map((flag) => (flag.id === id ? data.flag : flag)));
        toast.success("已更新");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "更新失败");
      } finally {
        setWorkingId(null);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确认删除该开关？")) return;
    setWorkingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/feature-flags/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "删除失败");
        }
        setFlags((prev) => prev.filter((flag) => flag.id !== id));
        toast.success("已删除");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "删除失败");
      } finally {
        setWorkingId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="已开启" value={stats.on} icon={<Rocket className="h-4 w-4 text-primary" />} />
        <StatCard label="灰度中" value={stats.rollout} icon={<FlaskConical className="h-4 w-4 text-primary" />} />
        <StatCard label="已关闭" value={stats.off} icon={<Flag className="h-4 w-4 text-muted-foreground" />} />
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Feature Flag 面板</CardTitle>
            <p className="text-sm text-muted-foreground">支持全量、关闭和灰度百分比，便于快速试验。</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="flag key（必填）"
              value={form.key}
              onChange={(e) => setForm((prev) => ({ ...prev, key: e.target.value }))}
              className="w-40"
            />
            <Input
              placeholder="展示名称"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-40"
            />
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-2 py-1">
              <span className="text-[11px] text-muted-foreground">灰度%</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.rolloutPercentage}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    rolloutPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                  }))
                }
                className="w-20 border-none bg-transparent px-1 py-1 text-sm focus-visible:ring-0"
              />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              新建开关
            </Button>
            <Button variant="outline" size="sm" onClick={fetchFlags} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在加载开关...
            </div>
          ) : flags.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              还没有开关，先创建一个吧。
            </div>
          ) : (
            flags.map((flag) => (
              <div
                key={flag.id}
                className="rounded-xl border border-border/50 bg-background/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{flag.name}</p>
                      <Badge variant="outline" className="border-border/60 bg-muted/50 text-[11px]">
                        {flag.key}
                      </Badge>
                      <StatusBadge status={flag.status} />
                      {flag.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {flag.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[11px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
                    <p className="text-[11px] text-muted-foreground">
                      更新于{" "}
                      {new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short" }).format(
                        new Date(flag.updatedAt),
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:w-[380px] md:flex-row md:items-center md:justify-end">
                    <Select
                      value={flag.status}
                      onValueChange={(value) => handleUpdate(flag.id, { status: value as FeatureFlagItem["status"] })}
                      disabled={workingId === flag.id || isPending}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on">开启</SelectItem>
                        <SelectItem value="off">关闭</SelectItem>
                        <SelectItem value="rollout">灰度</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2">
                      <span className="text-xs text-muted-foreground">灰度%</span>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={flag.rolloutPercentage}
                        onChange={(e) =>
                          handleUpdate(flag.id, {
                            status: "rollout",
                            rolloutPercentage: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                          })
                        }
                        className="h-9 w-20 border-none bg-transparent px-1 focus-visible:ring-0"
                        disabled={workingId === flag.id || isPending}
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(flag.id)}
                      disabled={workingId === flag.id || isPending}
                      className="gap-1"
                    >
                      {workingId === flag.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: FeatureFlagItem["status"] }) {
  if (status === "on") {
    return (
      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
        已开启
      </Badge>
    );
  }
  if (status === "rollout") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
        灰度
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-border/60">
      已关闭
    </Badge>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
      <div className="rounded-full bg-muted/60 p-3">{icon}</div>
    </div>
  );
}
