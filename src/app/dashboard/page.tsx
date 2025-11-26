import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/lib/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/dashboard");
  }

  const user = session.user;

  // 获取显示的用户名
  const getUserDisplayName = () => {
    if (user.name) return user.name;
    if (user.phoneNumber) return `用户${user.phoneNumber.slice(-4)}`;
    if (user.username) return user.username;
    if (user.email && !user.email.endsWith("@phone.local") && !user.email.endsWith("@local.test")) {
      return user.email;
    }
    return "用户";
  };

  const displayName = getUserDisplayName();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">控制台</h1>
        <p className="mt-2 text-muted-foreground">欢迎回来，{displayName}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 用户信息卡片 */}
        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">个人信息</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">用户名：</span>
              <span className="ml-2">{user.username || "未设置"}</span>
            </div>
            {user.phoneNumber && (
              <div>
                <span className="text-muted-foreground">手机号：</span>
                <span className="ml-2">{user.phoneNumber}</span>
              </div>
            )}
            {user.email && !user.email.endsWith("@phone.local") && !user.email.endsWith("@local.test") && (
              <div>
                <span className="text-muted-foreground">邮箱：</span>
                <span className="ml-2">{user.email}</span>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" asChild className="w-full">
            <Link href="/me">编辑资料</Link>
          </Button>
        </div>

        {/* 快速操作卡片 */}
        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">快速操作</h2>
          <div className="space-y-2">
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <Link href="/chat">开始 AI 对话</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="w-full justify-start">
              <Link href="/features">查看功能列表</Link>
            </Button>
          </div>
        </div>

        {/* 统计信息卡片 */}
        <div className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">账户统计</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">用户 ID：</span>
              <span className="ml-2 font-mono text-xs">{user.id.slice(0, 12)}...</span>
            </div>
            <div>
              <span className="text-muted-foreground">创建时间：</span>
              <span className="ml-2">{new Date(user.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
