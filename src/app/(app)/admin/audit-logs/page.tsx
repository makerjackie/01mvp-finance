"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const res = await fetch(`/api/audit/logs?page=${page}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [page]);

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
            <div className="text-center py-8">加载中...</div>
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
                        {log.resourceId.slice(0, 8)}...
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
