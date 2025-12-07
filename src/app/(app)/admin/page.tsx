import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ShieldCheck, Settings2, Users, Flag, ServerCog } from "lucide-react";
import { auth } from "@/server/lib/auth";
import { getAppConfig } from "@/server/lib/app-config";
import {
  canAccessAdmin,
  canManageAuth,
  canManageFeatureFlags,
  canManageUsers,
  canRunOps,
  resolveRole,
} from "@/lib/rbac";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminConfigPanel } from "./admin-config-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminUsersPanel } from "./admin-users-panel";
import { AdminLimitsPanel } from "./admin-limits-panel";
import { AdminFeatureFlagsPanel } from "./admin-feature-flags-panel";
import { AdminOpsPanel } from "./admin-ops-panel";

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/admin");
  }

  if (!canAccessAdmin(session.user)) {
    redirect("/dashboard");
  }

  const config = await getAppConfig();
  const role = resolveRole(session.user.role);
  const tabAccess = {
    config: canManageAuth(session.user),
    users: canManageUsers(session.user),
    flags: canManageFeatureFlags(session.user),
    ops: canRunOps(session.user),
  };

  const tabs = [
    { value: "config", label: "系统配置", icon: Settings2, enabled: tabAccess.config },
    { value: "users", label: "用户管理", icon: Users, enabled: tabAccess.users },
    { value: "flags", label: "Feature Flags", icon: Flag, enabled: tabAccess.flags },
    { value: "ops", label: "运维工具", icon: ServerCog, enabled: tabAccess.ops },
  ];

  const availableTabs = tabs.filter((tab) => tab.enabled);
  if (availableTabs.length === 0) {
    redirect("/dashboard");
  }

  const defaultTab = availableTabs[0]?.value ?? "users";
  const tabGridClass =
    availableTabs.length >= 4
      ? "grid-cols-4"
      : availableTabs.length === 3
        ? "grid-cols-3"
        : availableTabs.length === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">System Console</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">后台管理中心</h1>
          <p className="text-sm text-muted-foreground">
            收口模板级别的配置与用户管控，支持快速关闭密码登录、提权或封禁用户。
          </p>
        </div>
        <Badge variant="outline" className="self-start rounded-full border-border/60 bg-muted/60">
          首个注册用户自动成为管理员
        </Badge>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className={`grid w-full ${tabGridClass} bg-muted/60 p-1`}>
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="rounded-lg">
                <Icon className="mr-2 h-4 w-4" /> {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabAccess.config && (
          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
              <Card className="rounded-2xl border border-border/60 shadow-sm">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg font-semibold">登录与安全</CardTitle>
                  <CardDescription>控制常用登录方式的开关，默认全开，可按需收口。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <AdminConfigPanel
                    initialConfig={{
                      passwordLoginEnabled: config.passwordLoginEnabled,
                      smsLoginEnabled: config.smsLoginEnabled,
                    }}
                    lastUpdated={config.updatedAt.toISOString()}
                    canManage={tabAccess.config}
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

            <Card className="rounded-2xl border border-border/60 shadow-sm">
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg font-semibold">配额与限流</CardTitle>
                <CardDescription>统一设置单用户/全局的速率和日配额，可与后端中间件对接。</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminLimitsPanel
                  initialConfig={{
                    perUserDailyQuota: config.perUserDailyQuota,
                    globalDailyQuota: config.globalDailyQuota,
                    perUserRateLimit: config.perUserRateLimit,
                    globalRateLimit: config.globalRateLimit,
                    maintenanceMode: config.maintenanceMode,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {tabAccess.users && (
          <TabsContent value="users" className="space-y-4">
            <AdminUsersPanel viewerRole={role} canManageUsers={tabAccess.users} />
          </TabsContent>
        )}

        {tabAccess.flags && (
          <TabsContent value="flags" className="space-y-4">
            <AdminFeatureFlagsPanel canManage={tabAccess.flags} />
          </TabsContent>
        )}

        {tabAccess.ops && (
          <TabsContent value="ops" className="space-y-4">
            <AdminOpsPanel canRunOps={tabAccess.ops} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
