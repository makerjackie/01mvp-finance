"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/audit/logs?page=${page}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: AuditLog[];
        total?: number;
        message?: string;
        error?: string;
      } | null;

      if (!res.ok || !data?.success || !Array.isArray(data.data)) {
        throw new Error(data?.message || data?.error || "加载审计日志失败");
      }

      setLogs(data.data);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (fetchError) {
      setLogs([]);
      setTotal(0);
      setError(fetchError instanceof Error ? fetchError.message : "加载审计日志失败");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const actionLabels: Record<string, string> = {
    create: "创建",
    update: "更新",
    delete: "删除",
    review: "审核",
    mark_paid: "标记已支付",
  };

  return (
    <div className="container mx-auto space-y-3 p-6 md:space-y-5">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">审计日志</h1>
        <p className="text-sm text-muted-foreground">查看系统关键操作记录，便于审计追踪与问题排查。</p>
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardContent className="px-4 py-4 sm:px-5">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载中...
            </div>
          ) : error ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void fetchLogs()}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                重试
              </Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无审计日志</div>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground sm:hidden">可左右滑动查看完整列信息</p>
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">时间</TableHead>
                    <TableHead className="whitespace-nowrap">操作人</TableHead>
                    <TableHead className="whitespace-nowrap">操作</TableHead>
                    <TableHead className="whitespace-nowrap">资源ID</TableHead>
                    <TableHead className="whitespace-nowrap">IP地址</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("zh-CN")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{log.userName}</TableCell>
                      <TableCell className="whitespace-nowrap">{actionLabels[log.action] || log.action}</TableCell>
                      <TableCell className="max-w-[180px] truncate font-mono text-xs whitespace-nowrap">
                        {log.resourceId ? `${log.resourceId.slice(0, 8)}...` : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{log.ipAddress || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">共 {total} 条记录</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    上一页
                  </Button>
                  <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage(page + 1)}>
                    下一页
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
