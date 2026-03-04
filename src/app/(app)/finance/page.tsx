import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChartColumnBig, ClipboardList, PlusCircle, Shield } from "lucide-react";
import { auth } from "@/server/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function FinancePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const isAdmin = session.user.role === "admin";

  return (
    <div className="space-y-3 md:space-y-5">
      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="px-4 py-4 sm:px-5">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="rounded-full border-border/60 bg-muted/50 text-[11px]">
              Finance Workspace
            </Badge>
            {isAdmin && (
              <Badge className="rounded-full border-rose-200 bg-rose-50 text-[11px] text-rose-700">管理员可见</Badge>
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">社区财务系统</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              收入登记、支出申请、审核协同。移动端使用紧凑密度，减少不必要留白。
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href="/finance/submit?type=income" className="group">
          <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99]">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">收入登记</p>
                  <p className="mt-1 text-xs text-muted-foreground">登记项目收入、服务收入等</p>
                </div>
                <PlusCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-3 inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                去登记
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/submit?type=expense" className="group">
          <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99]">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">支出申请</p>
                  <p className="mt-1 text-xs text-muted-foreground">申请物料费、交通费、工资等</p>
                </div>
                <ChartColumnBig className="h-4 w-4 text-blue-600" />
              </div>
              <div className="mt-3 inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                去申请
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link href="/finance/my-records" className="group">
          <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99]">
            <CardContent className="px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">我的申请记录</p>
                  <p className="mt-1 text-xs text-muted-foreground">查看状态、编辑待审核申请</p>
                </div>
                <ClipboardList className="h-4 w-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {isAdmin && (
          <Link href="/finance/admin" className="group">
            <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.99]">
              <CardContent className="px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">管理员后台</p>
                    <p className="mt-1 text-xs text-muted-foreground">审核申请、查看统计、管理账目</p>
                  </div>
                  <Shield className="h-4 w-4 text-rose-600" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
