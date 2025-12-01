import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/server/lib/auth";
import { prisma } from "@/server/lib/db";
import { ProfileForm } from "../components/profile-form";

export default async function ProfileSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in?redirect=/me/profile");
  }

  const user = session.user;

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      phoneNumber: true,
    },
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/me" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> 返回账户中心
        </Link>
        <Badge variant="outline" className="h-6 rounded-full border-border/60 px-3 text-[11px]">
          资料管理
        </Badge>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">编辑个人资料</h2>
      </div>

      <Card className="rounded-2xl border border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">基础信息</CardTitle>
          <CardDescription className="text-xs">保存后会立即应用到所有工作区。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProfileForm
            name={user.name}
            username={user.username}
            email={user.email}
            phoneNumber={fullUser?.phoneNumber}
          />
        </CardContent>
      </Card>
    </div>
  );
}
