import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, Settings2 } from "lucide-react";
import { auth } from "@/server/lib/auth";
import { getAppConfig } from "@/server/lib/app-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminConfigPanel } from "./admin-config-panel";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/admin");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const config = await getAppConfig();

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">System Console</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">后台配置中心</h1>
          <p className="text-sm text-muted-foreground">统一管理模板级别的开关，快速关闭密码登录或上线新能力。</p>
        </div>
        <Badge variant="outline" className="self-start rounded-full border-border/60 bg-muted/60">
          首个注册用户自动成为管理员
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="rounded-2xl border border-border/60 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">登录与安全</CardTitle>
            <CardDescription>控制账户密码登录开关，默认开启，后台可即时关闭。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AdminConfigPanel
              initialConfig={{ passwordLoginEnabled: config.passwordLoginEnabled }}
              lastUpdated={config.updatedAt.toISOString()}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">后台小贴士</CardTitle>
              <CardDescription>围绕模板收口配置，便于后续扩展更多开关。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/40 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">后台入口仅对管理员展示</p>
                  <p>侧边栏会在检测到管理员角色后出现「后台管理」，移动端抽屉同样适用。</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/40 p-3">
                <Settings2 className="mt-0.5 h-4 w-4 text-primary" />
                <div className="space-y-1">
                  <p className="font-medium text-foreground">配置集中化</p>
                  <p>新增模板级开关时沿用 AppConfig，避免配置散落在 ENV 或各路组件里。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
