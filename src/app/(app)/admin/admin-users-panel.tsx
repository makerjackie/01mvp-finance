"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/lib/toast";
import { Loader2, RefreshCw, Search, Shield, ShieldOff, Ban, Check, Clock, UserRound } from "lucide-react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  createdAt: string;
  lastActiveAt: string | null;
};

type UserSummary = {
  totalUsers: number;
  adminCount: number;
  bannedCount: number;
};

type UsersApiResponse = {
  users: (Omit<AdminUser, "createdAt" | "lastActiveAt"> & { createdAt: string; lastActiveAt: string | null })[];
  summary: UserSummary;
  message?: string;
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [workingId, setWorkingId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!query.trim()) return users;
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q),
    );
  }, [query, users]);

  const fetchUsers = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      const data = (await res.json()) as UsersApiResponse;
      if (!res.ok) {
        throw new Error(data?.message || "获取用户列表失败");
      }
      setUsers((data.users || []).map((item) => ({ ...item })));
      setSummary(data.summary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取用户列表失败");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = (id: string, action: "promote" | "demote" | "ban" | "unban") => {
    let banReason: string | null | undefined;
    if (action === "ban") {
      banReason = window.prompt("封禁原因（可选）", "违规行为") ?? undefined;
    }

    setWorkingId(id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, banReason }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "操作失败");
        }
        const updated: AdminUser = {
          ...data.user,
          createdAt: data.user.createdAt,
          lastActiveAt: data.user.lastActiveAt,
        };
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
        toast.success("操作成功");
        fetchUsers();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "操作失败");
      } finally {
        setWorkingId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          title="用户总数"
          value={summary?.totalUsers ?? 0}
          icon={<UserRound className="h-4 w-4 text-primary" />}
        />
        <SummaryCard
          title="管理员"
          value={summary?.adminCount ?? 0}
          badge="安全"
          icon={<Shield className="h-4 w-4 text-primary" />}
        />
        <SummaryCard
          title="封禁中"
          value={summary?.bannedCount ?? 0}
          badge="风险"
          icon={<Ban className="h-4 w-4 text-destructive" />}
        />
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-lg font-semibold">用户管理</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索邮箱 / 用户名 / 昵称"
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={refreshing} className="gap-2">
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-2 px-4 pb-4 md:gap-3">
            <div className="hidden rounded-xl bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground md:grid md:grid-cols-6">
              <span className="col-span-2">用户</span>
              <span>角色</span>
              <span>状态</span>
              <span>最近活跃</span>
              <span className="text-right">操作</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在加载用户...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                <p>暂无用户数据</p>
                <p className="text-xs text-muted-foreground/80">试试更换搜索条件或刷新列表</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-xl border border-border/50 bg-background/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md"
                >
                  <div className="grid gap-3 md:grid-cols-6 md:items-center">
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="truncate">{user.name}</span>
                        {user.role === "admin" && (
                          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.username && <p className="text-xs text-muted-foreground/80">@{user.username}</p>}
                    </div>

                    <div>
                      <Badge variant="outline" className="border-border/60">
                        {user.role || "user"}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      {user.banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" /> 已封禁
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" /> 正常
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {user.banned ? user.banReason || "未填写原因" : "未发现问题"}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" /> {formatDate(user.lastActiveAt)}
                      </div>
                      <p className="text-xs text-muted-foreground/70">创建：{formatDate(user.createdAt)}</p>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 md:justify-end">
                      {user.role === "admin" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending || workingId === user.id}
                          onClick={() => handleAction(user.id, "demote")}
                        >
                          {workingId === user.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldOff className="mr-2 h-4 w-4" />
                          )}
                          降级
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isPending || workingId === user.id}
                          onClick={() => handleAction(user.id, "promote")}
                        >
                          {workingId === user.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="mr-2 h-4 w-4" />
                          )}
                          提权
                        </Button>
                      )}
                      {user.banned ? (
                        <Button
                          size="sm"
                          disabled={isPending || workingId === user.id}
                          onClick={() => handleAction(user.id, "unban")}
                        >
                          {workingId === user.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          解封
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isPending || workingId === user.id}
                          onClick={() => handleAction(user.id, "ban")}
                        >
                          {workingId === user.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="mr-2 h-4 w-4" />
                          )}
                          封禁
                        </Button>
                      )}
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span className="rounded-full border border-border/50 px-2 py-0.5">
                      ID: {user.id.slice(0, 6)}...{user.id.slice(-4)}
                    </span>
                    {user.banned && (
                      <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-destructive">
                        {user.banReason || "违规行为"}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  badge,
  icon,
}: {
  title: string;
  value: number;
  badge?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-gray-50/40 shadow-sm dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900/70">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          {badge && (
            <Badge variant="outline" className="mt-1 rounded-full border-border/60 px-2 text-[11px]">
              {badge}
            </Badge>
          )}
        </div>
        {icon && <div className="rounded-full bg-muted/60 p-3">{icon}</div>}
      </CardContent>
    </Card>
  );
}
