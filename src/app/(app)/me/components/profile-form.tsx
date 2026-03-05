"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

interface ProfileFormProps {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  idCardNumber?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  onSuccess?: () => void;
}

interface EditableProfile {
  name: string;
  idCardNumber: string;
  bankAccountNumber: string;
  bankName: string;
}

const idCardPattern = /^(\d{15}|\d{17}[\dX])$/;
const bankAccountPattern = /^\d{8,30}$/;

const normalizeProfile = (profile: EditableProfile): EditableProfile => ({
  name: profile.name.trim(),
  idCardNumber: profile.idCardNumber.trim().toUpperCase(),
  bankAccountNumber: profile.bankAccountNumber.replace(/\s+/g, ""),
  bankName: profile.bankName.trim(),
});

const buildProfile = ({
  name,
  idCardNumber,
  bankAccountNumber,
  bankName,
}: Pick<ProfileFormProps, "name" | "idCardNumber" | "bankAccountNumber" | "bankName">): EditableProfile => ({
  name: name ?? "",
  idCardNumber: idCardNumber ?? "",
  bankAccountNumber: bankAccountNumber ?? "",
  bankName: bankName ?? "",
});

export function ProfileForm({
  name,
  username,
  email,
  phoneNumber,
  idCardNumber,
  bankAccountNumber,
  bankName,
  onSuccess,
}: ProfileFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name ?? "");
  const [identityNumber, setIdentityNumber] = useState(idCardNumber ?? "");
  const [bankCard, setBankCard] = useState(bankAccountNumber ?? "");
  const [bank, setBank] = useState(bankName ?? "");
  const [savedProfile, setSavedProfile] = useState<EditableProfile>(() =>
    normalizeProfile(buildProfile({ name, idCardNumber, bankAccountNumber, bankName })),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const nextProfile = buildProfile({ name, idCardNumber, bankAccountNumber, bankName });
    setDisplayName(nextProfile.name);
    setIdentityNumber(nextProfile.idCardNumber);
    setBankCard(nextProfile.bankAccountNumber);
    setBank(nextProfile.bankName);
    setSavedProfile(normalizeProfile(nextProfile));
  }, [name, idCardNumber, bankAccountNumber, bankName]);

  const currentProfile = useMemo(
    () =>
      normalizeProfile({
        name: displayName,
        idCardNumber: identityNumber,
        bankAccountNumber: bankCard,
        bankName: bank,
      }),
    [displayName, identityNumber, bankCard, bank],
  );

  const isDirty =
    currentProfile.name !== savedProfile.name ||
    currentProfile.idCardNumber !== savedProfile.idCardNumber ||
    currentProfile.bankAccountNumber !== savedProfile.bankAccountNumber ||
    currentProfile.bankName !== savedProfile.bankName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isDirty) {
      toast.info("没有需要更新的内容");
      return;
    }

    if (currentProfile.name.length < 2 || currentProfile.name.length > 32) {
      toast.error("姓名长度需在 2-32 个字符之间");
      return;
    }

    if (currentProfile.idCardNumber && !idCardPattern.test(currentProfile.idCardNumber)) {
      toast.error("身份证号码格式不正确");
      return;
    }

    if (currentProfile.bankAccountNumber && !bankAccountPattern.test(currentProfile.bankAccountNumber)) {
      toast.error("银行卡号格式不正确");
      return;
    }

    if (currentProfile.bankAccountNumber && !currentProfile.bankName) {
      toast.error("填写银行卡号时请同时填写银行名称");
      return;
    }

    if (currentProfile.bankName && (currentProfile.bankName.length < 2 || currentProfile.bankName.length > 80)) {
      toast.error("银行名称长度需在 2-80 个字符之间");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentProfile),
      });

      const result = (await response.json()) as { message?: string; profile?: EditableProfile };

      if (!response.ok) {
        throw new Error(result.message || "保存失败，请稍后重试");
      }

      const nextProfile = result.profile ? normalizeProfile(result.profile) : currentProfile;
      setSavedProfile(nextProfile);
      setDisplayName(nextProfile.name);
      setIdentityNumber(nextProfile.idCardNumber);
      setBankCard(nextProfile.bankAccountNumber);
      setBank(nextProfile.bankName);
      toast.success("个人信息已更新");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="displayName">姓名</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="请输入您的真实姓名"
            maxLength={32}
          />
          <p className="text-xs text-muted-foreground">后续申请单会默认复用该姓名。</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="idCardNumber">身份证号码</Label>
          <Input
            id="idCardNumber"
            value={identityNumber}
            onChange={(e) => setIdentityNumber(e.target.value.replace(/[^\dXx]/g, ""))}
            placeholder="用于劳务结算自动填充"
            maxLength={18}
            inputMode="text"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccountNumber">银行卡号</Label>
          <Input
            id="bankAccountNumber"
            value={bankCard}
            onChange={(e) => setBankCard(e.target.value.replace(/[^\d\s]/g, ""))}
            placeholder="用于收款账号自动填充"
            maxLength={34}
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankName">银行名称</Label>
          <Input
            id="bankName"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            placeholder="例如：中国工商银行北京分行"
            maxLength={80}
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

      <Button type="submit" disabled={isSaving || !isDirty} className="w-fit">
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        保存更改
      </Button>
    </form>
  );
}
