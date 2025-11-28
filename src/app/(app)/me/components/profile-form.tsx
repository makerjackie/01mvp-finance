"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ProfileFormProps {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export function ProfileForm({ name, username, email, phoneNumber }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const trimmedName = displayName.trim();
      await authClient.updateUser({
        name: trimmedName || undefined,
      });
      toast.success("个人信息已更新");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="displayName">昵称</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="用于展示的名字"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <Input id="username" value={username || "未设置"} disabled readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input id="email" value={email || "未填写"} disabled readOnly />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">手机号</Label>
          <Input id="phone" value={phoneNumber || "未绑定"} disabled readOnly />
        </div>
      </div>

      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        保存
      </Button>
    </form>
  );
}
