import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex items-center gap-3">
        <Link href="/me" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 返回账户中心
        </Link>
        <Badge variant="outline" className="h-6 rounded-full border-border/60 px-3 text-[11px]">
          安全
        </Badge>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">修改密码</h2>
        <p className="text-sm text-muted-foreground">更新登录密码时会下线其他会话，保障账号安全。</p>
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">密码与安全</CardTitle>
          <CardDescription className="text-xs">建议每 90 天更新一次，并避免与其他站点复用。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
