"use client";

import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/lib/config/site";

type Step = "phone" | "verify";

export function Login() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [step, setStep] = useState<Step>("phone");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [needsName, setNeedsName] = useState(false);
  const [realName, setRealName] = useState("");

  useEffect(() => {
    if (!countdown) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendSms = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phoneNumber || !/^1\d{10}$/.test(phoneNumber)) {
      setError("请输入有效的手机号");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const checkRes = await fetch(`/api/auth/check-phone?phone=${phoneNumber}`);
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setNeedsName(true);
      }

      const { data, error } = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      });

      if (data) {
        setStep("verify");
        setSmsCode("");
        toast.success("验证码已发送");
        setCountdown(60);
      } else {
        setError(error?.message || "发送失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setIsPending(false);
    }
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!smsCode || smsCode.length !== 6) {
      setError("请填写 6 位验证码");
      return;
    }

    if (needsName && !realName.trim()) {
      setError("请填写您的真实姓名");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const { data, error } = await authClient.phoneNumber.verify({
        phoneNumber,
        code: smsCode,
      });

      if (error) {
        setError(error.message || "验证失败");
        setIsPending(false);
        return;
      }

      if (data) {
        if (needsName && realName.trim()) {
          try {
            await fetch("/api/auth/update-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: realName.trim() }),
            });
          } catch (err) {
            console.error("更新姓名失败", err);
          }
        }

        toast.success("登录成功");
        await new Promise((resolve) => setTimeout(resolve, 300));
        window.location.href = redirect ?? "/";
      } else {
        setError("验证失败，请重试");
        setIsPending(false);
      }
    } catch {
      setError("网络错误，请重试");
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setIsPending(true);

    try {
      const { data, error } = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      });

      if (data) {
        toast.success("验证码已重新发送");
        setCountdown(60);
      } else {
        setError(error?.message || "发送失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full p-6 sm:p-8">
      {step === "phone" ? (
        <>
          <div className="mb-8 space-y-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">手机号登录</h2>
            <p className="text-sm text-muted-foreground">未注册手机号验证后自动创建账号</p>
          </div>

          <form onSubmit={handleSendSms} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground select-none">
                  +86
                </span>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, ""));
                    setError(null);
                  }}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="pl-12 text-base"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发送中...
                </>
              ) : (
                "获取验证码"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              点击获取验证码即表示您同意我们的
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                服务条款
              </Link>
              {" 和 "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                隐私政策
              </Link>
            </p>
          </form>
        </>
      ) : (
        <>
          <div className="mb-8 space-y-2">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError(null);
                setSmsCode("");
                setRealName("");
              }}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">输入验证码</h2>
            <p className="text-sm text-muted-foreground">验证码已发送至 +86 {phoneNumber}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="code">验证码</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={smsCode}
                onChange={(e) => {
                  setSmsCode(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="请输入 6 位验证码"
                maxLength={6}
                className="tracking-widest text-base text-center text-lg"
                autoFocus
              />
            </div>

            {needsName && (
              <div className="space-y-2">
                <Label htmlFor="realName">
                  真实姓名<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="realName"
                  type="text"
                  autoComplete="name"
                  value={realName}
                  onChange={(e) => {
                    setRealName(e.target.value);
                    setError(null);
                  }}
                  placeholder="请输入您的真实姓名"
                  maxLength={50}
                  className="text-base"
                  required
                />
                <p className="text-xs text-muted-foreground">首次注册需要填写真实姓名，用于财务申请</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  验证中...
                </>
              ) : (
                "登录 / 注册"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isPending}
                className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0 ? `${countdown}s 后可重新发送` : "重新发送验证码"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
