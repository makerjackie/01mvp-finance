import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/lib/auth";
import { MeetingSummaryForm } from "./meeting-summary-form";

export default async function MeetingSummaryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/examples/meeting-summary");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">会议纪要 → HTML 总结页</h1>
        <p className="text-sm text-muted-foreground">
          直接粘贴会议文字纪要，系统会用对话模型生成一份飞书风格的 HTML 会议总结页，并保存到对象存储（或本地 storage）。
        </p>
      </div>

      <MeetingSummaryForm />

      <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            生成后会得到公开链接：<code className="font-mono">/examples/meeting-summary/&lt;id&gt;</code>
          </li>
          <li>为避免滥用，生成接口需要登录（查看生成结果不需要）。</li>
        </ul>
      </div>
    </div>
  );
}
