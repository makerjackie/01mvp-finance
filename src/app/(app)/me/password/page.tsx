import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/server/lib/auth";
import { ChangePasswordForm } from "../components/change-password-form";

export default async function PasswordSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/me/password");
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center">
        <Link href="/me" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 返回我的
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">修改密码</h2>
        <p className="text-sm text-muted-foreground">用于后台账号登录。</p>
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">密码与安全</CardTitle>
          <CardDescription className="text-xs">请使用高强度密码并妥善保管。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
