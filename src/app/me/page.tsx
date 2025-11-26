import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { User, Phone, Mail, Shield, LogOut, ChevronRight } from "lucide-react";
import SignOutButton from "@/components/logout";
import { auth } from "@/server/lib/auth";
import { prisma } from "@/server/lib/db";
import { AvatarUpload } from "./components/avatar-upload";
import { ProfileEditDialog } from "./components/profile-edit-dialog";
import { ChangePasswordDialog } from "./components/change-password-dialog";

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
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-2xl space-y-6 px-4 py-10">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">个人中心</h1>
        <p className="text-muted-foreground text-sm">管理您的个人资料和账户安全</p>
      </div>

      {/* 用户信息卡片 */}
      <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md animate-slide-up">
        <div className="flex items-center gap-5 p-6">
          <AvatarUpload user={user} />
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-semibold">{user.name || user.username || "用户"}</h2>
            <p className="text-sm text-muted-foreground">{fullUser?.phoneNumber || user.email}</p>
             <div className="flex items-center gap-2 pt-1">
               <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                 标准会员
               </span>
             </div>
          </div>
          <ProfileEditDialog user={user} />
        </div>
      </div>

      {/* 账号信息 */}
      <div className="overflow-hidden rounded-xl border bg-card animate-slide-up" style={{ animationDelay: "100ms" }}>
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
          <h3 className="text-sm font-medium text-muted-foreground">基本信息</h3>
        </div>
        <div className="divide-y divide-border/50">
          {user.username && (
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">用户名</span>
              </div>
              <span className="text-sm text-muted-foreground font-mono">{user.username}</span>
            </div>
          )}

          {user.name && (
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">昵称</span>
              </div>
              <span className="text-sm text-muted-foreground">{user.name}</span>
            </div>
          )}

          {fullUser?.phoneNumber && (
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">手机号</span>
              </div>
              <span className="text-sm text-muted-foreground font-mono">{fullUser.phoneNumber}</span>
            </div>
          )}

          {user.email && (
            <div className="flex items-center justify-between px-4 py-3.5 hover:bg-accent/30 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">邮箱</span>
              </div>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* 设置选项 */}
      <div className="overflow-hidden rounded-xl border bg-card animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3">
          <h3 className="text-sm font-medium text-muted-foreground">安全设置</h3>
        </div>
        <div className="divide-y divide-border/50">
          <ChangePasswordDialog />
          
          {user.role === "admin" && (
             <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-accent/50 transition-colors"
                disabled
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">管理员后台</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
          )}
        </div>
      </div>

      {/* 退出登录 */}
      <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <SignOutButton className="w-full rounded-xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:border-destructive/30 h-12 font-medium">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </SignOutButton>
      </div>

      <div className="text-center text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: "400ms" }}>
        <p>Account ID: <span className="font-mono">{user.id}</span></p>
      </div>
    </div>
  );
}
