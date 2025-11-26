import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6 p-6 sm:p-8">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">账号与安全</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">找回密码</h1>
        <p className="text-sm text-muted-foreground">请联系管理员重置账号密码。</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Button asChild>
          <Link href="/sign-in">返回登录</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">回到主页</Link>
        </Button>
      </div>
    </div>
  );
}
