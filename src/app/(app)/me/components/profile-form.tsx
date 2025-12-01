"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/lib/toast";

interface ProfileFormProps {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  onSuccess?: () => void;
}

export function ProfileForm({ name, username, email, phoneNumber, onSuccess }: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const trimmedName = displayName.trim();
  const isDirty = trimmedName !== (name ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast.info("没有需要更新的内容");
      return;
    }

    if (trimmedName && trimmedName.length < 2) {
      toast.error("昵称至少需要 2 个字符");
      return;
    }

    setIsSaving(true);

    try {
      await authClient.updateUser({
        name: trimmedName || undefined,
      });
      toast.success("个人信息已更新");
      setDisplayName(trimmedName);
      router.refresh();
      onSuccess?.();
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
            maxLength={32}
          />
          <p className="text-xs text-muted-foreground">推荐使用 2-20 字的昵称，方便团队识别。</p>
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

      <Button type="submit" disabled={isSaving || !isDirty} className="w-fit">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        保存更改
      </Button>
    </form>
  );
}
