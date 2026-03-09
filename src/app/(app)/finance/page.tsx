import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ClipboardList, PlusCircle, Shield } from "lucide-react";
import { auth } from "@/server/lib/auth";
import { canAccessFinanceReview } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";

export default async function FinancePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const canReview = canAccessFinanceReview(session.user);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="space-y-2 px-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">财务工作台</h1>
        <p className="text-sm text-muted-foreground">
          统一处理申请提交、进度追踪与审核协同，常用操作可在首页直接进入。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/finance/submit" className="group md:col-span-2">
          <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex h-full flex-col justify-between gap-6 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-base font-semibold">新建申请</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    收入登记、采购支出、费用报销、劳务结算一站式提交。
                  </p>
                </div>
                <PlusCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground sm:text-sm">
                立即发起
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/finance/my-records" className="group">
          <Card className="h-full rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex h-full flex-col justify-between gap-6 px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-base font-semibold">我的申请记录</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">查看审批状态并继续编辑待审核内容。</p>
                </div>
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div className="inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground sm:text-sm">
                查看记录
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {canReview && (
        <Link href="/finance/admin" className="group block">
          <Card className="rounded-xl border border-rose-100 bg-gradient-to-r from-rose-50 via-white to-orange-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-rose-900/60 dark:from-rose-950/20 dark:via-slate-950 dark:to-orange-950/20">
            <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-base font-semibold">管理员后台</p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    进入后台后通过二级 Tab 处理审核、统计、系统配置、权限分配与操作日志。
                  </p>
                </div>
                <Shield className="h-5 w-5 text-rose-600" />
              </div>
              <div className="mt-4 inline-flex items-center text-xs text-muted-foreground transition-colors group-hover:text-foreground sm:text-sm">
                进入后台
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
