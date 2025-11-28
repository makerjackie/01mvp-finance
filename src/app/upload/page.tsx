import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UploadDemo } from "./upload-demo";
import { auth } from "@/server/lib/auth";

export default async function UploadPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/upload");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">上传示例</h1>
        <p className="text-sm text-muted-foreground">
          演示 <code className="font-mono">/api/uploads</code> 接口，默认写入 <code className="font-mono">storage</code>{" "}
          目录，配置 <code className="font-mono">S3_*</code> 后自动切换到对象存储。
        </p>
      </div>

      <UploadDemo />

      <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
        <ul className="list-disc space-y-1 pl-5">
          <li>仅支持图片（PNG/JPG/GIF/WebP/SVG），单文件最大 5MB。</li>
          <li>成功后会返回直链地址，可用于头像、富文本等场景。</li>
          <li>接口复用 <code className="font-mono">auth</code> session，需要登录后才能上传。</li>
        </ul>
      </div>
    </div>
  );
}
