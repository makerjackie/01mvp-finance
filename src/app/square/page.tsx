import { headers } from "next/headers";
import Link from "next/link";
import { Globe } from "lucide-react";
import { auth } from "@/server/lib/auth";

export default async function SquarePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-6">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">广场</h1>
        <p className="text-sm text-muted-foreground">发现其他用户创建的精彩内容</p>
      </div>

      {/* 占位内容 */}
      <div className="card p-12 text-center">
        <Globe className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-medium">功能开发中</h3>
        <p className="mt-2 text-sm text-muted-foreground">敬请期待更多精彩内容</p>
        {session?.user && (
          <Link
            href="/features"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            探索功能
          </Link>
        )}
      </div>

      {/* 登录提示 */}
      {!session?.user && (
        <div className="card border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            想要上传自己的内容？
            <Link href="/sign-in" className="ml-1 text-primary hover:underline">
              立即登录
            </Link>
            或
            <Link href="/sign-up" className="ml-1 text-primary hover:underline">
              注册账号
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
