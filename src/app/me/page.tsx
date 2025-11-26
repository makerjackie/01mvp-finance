import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { User, Phone, Mail, Shield, LogOut, ChevronRight } from "lucide-react";
import SignOutButton from "@/components/logout";
import { auth } from "@/server/lib/auth";
import { prisma } from "@/server/lib/db";

export default async function MePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/me");
  }

  const user = session.user;

  // 从数据库获取完整的用户信息（包括 phoneNumber）
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      phoneNumber: true,
    },
  });

  return (
    <div className="mx-auto min-h-screen max-w-2xl space-y-4 px-4 py-6">
      {/* 用户信息卡片 */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {user.name?.[0] || user.username?.[0] || "U"}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{user.name || user.username || "用户"}</h1>
            <p className="text-sm text-muted-foreground">{fullUser?.phoneNumber || user.email}</p>
          </div>
        </div>
      </div>

      {/* 账号信息 */}
      <div className="card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-medium">账号信息</h2>
        </div>
        <div className="divide-y divide-border">
          {user.username && (
            <div className="flex items-center gap-3 px-4 py-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">用户名</div>
                <div className="font-medium">{user.username}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {user.name && (
            <div className="flex items-center gap-3 px-4 py-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">昵称</div>
                <div className="font-medium">{user.name}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {fullUser?.phoneNumber && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">手机号</div>
                <div className="font-medium">{fullUser.phoneNumber}</div>
              </div>
            </div>
          )}

          {user.email && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">邮箱</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>
          )}

          {user.role === "admin" && (
            <div className="flex items-center gap-3 px-4 py-3">
              <Shield className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">权限</div>
                <div className="font-medium text-primary">管理员</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 设置选项 */}
      <div className="card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-medium">设置</h2>
        </div>
        <div className="divide-y divide-border">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
            disabled
          >
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">编辑个人资料</div>
              <div className="text-sm text-muted-foreground">修改头像、昵称等</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
            disabled
          >
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">修改密码</div>
              <div className="text-sm text-muted-foreground">更新登录密码</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="card overflow-hidden">
        <div className="flex w-full items-center justify-center gap-2 px-4 py-3">
          <SignOutButton className="w-full text-destructive hover:bg-destructive/10">
            <LogOut className="mr-2 h-5 w-5" />
            退出登录
          </SignOutButton>
        </div>
      </div>

      {/* 账号ID（调试用） */}
      <div className="rounded-lg border border-dashed border-border/50 p-3 text-center">
        <div className="text-xs text-muted-foreground">账号 ID</div>
        <div className="mt-1 font-mono text-xs text-muted-foreground">{user.id}</div>
      </div>
    </div>
  );
}
