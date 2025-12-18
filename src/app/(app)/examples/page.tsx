import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/lib/auth";

export default async function ExamplesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/examples");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">工具集</h1>
        <p className="text-sm text-muted-foreground">这里放一些小工具示例，删除整个 examples 目录不会影响主功能。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">会议纪要 → HTML 总结页</CardTitle>
            <CardDescription>粘贴会议文字纪要，自动生成飞书风格的 HTML 页面并获得公开链接。</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            生成后的页面路径形如：<code className="font-mono">/examples/meeting-summary/&lt;id&gt;</code>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/examples/meeting-summary">打开工具</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
