"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/lib/config/site";

type Mode = "signin" | "signup";
type AuthMethod = "sms" | "password";

export function Login({ mode = "signin" }: { mode?: Mode }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");

  // 默认使用短信验证码登录
  const [authMethod, setAuthMethod] = useState<AuthMethod>("sms");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 短信登录状态
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 密码登录状态
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // 发送验证码
  const handleSendSms = async () => {
    if (!phoneNumber || !/^1\d{10}$/.test(phoneNumber)) {
      setError("请输入有效的手机号");
      return;
    }

    setError(null);
    setIsPending(true);

    try {
      const { data, error } = await authClient.phoneNumber.sendOtp({
        phoneNumber,
      });

      if (data) {
        setSmsSent(true);
        toast.success("验证码已发送");
        // 倒计时 60 秒
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(error?.message || "发送失败");
      }
    } catch (err) {
      setError("网络错误，请重试");
    } finally {
      setIsPending(false);
    }
  };

  // 短信验证码登录
  const handleSmsLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phoneNumber || !smsCode) {
      setError("请填写手机号和验证码");
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
        toast.success("登录成功");
        // 等待一小段时间让session写入完成
        await new Promise((resolve) => setTimeout(resolve, 300));
        // 使用window.location.href强制完全刷新页面
        window.location.href = redirect ?? "/";
      } else {
        setError("验证失败，请重试");
        setIsPending(false);
      }
    } catch (err) {
      setError("网络错误，请重试");
      setIsPending(false);
    }
  };

  // 用户名密码登录
  const handlePasswordLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("请填写用户名");
      return;
    }

    const normalizedUsername = trimmedUsername.toLowerCase();
    const generatedEmail = `${normalizedUsername}@local.test`;

    setIsPending(true);

    try {
      let result;
      if (mode === "signin") {
        result = await authClient.signIn.username({
          username: normalizedUsername,
          password,
        });
      } else {
        result = await authClient.signUp.email({
          email: generatedEmail,
          password,
          name: name || trimmedUsername,
          username: normalizedUsername,
        });
      }

      if (result.error) {
        setError(result.error.message ?? "登录失败");
        setIsPending(false);
        return;
      }

      if (result.data) {
        toast.success(mode === "signin" ? "登录成功" : "注册成功");
        // 等待更长时间让 cookie 完全写入
        await new Promise((resolve) => setTimeout(resolve, 500));
        // 使用 window.location.href 强制完全刷新页面
        window.location.href = redirect ?? "/dashboard";
      } else {
        setError("登录失败，请重试");
        setIsPending(false);
      }
    } catch (err) {
      setError("网络错误，请重试");
      setIsPending(false);
    }
  };

  const switchHref = `${mode === "signin" ? siteConfig.links.signup : siteConfig.links.signin}${
    redirect ? `?redirect=${redirect}` : ""
  }`;

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {mode === "signin" ? "欢迎回来" : "注册账号"}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {mode === "signin" ? `登录 ${siteConfig.name}` : `加入 ${siteConfig.name}`}
        </h2>
      </div>

      {/* 登录方式切换 */}
      <div className="mb-6 flex rounded-lg border p-1">
        <button
          type="button"
          onClick={() => setAuthMethod("sms")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            authMethod === "sms" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          短信验证码
        </button>
        <button
          type="button"
          onClick={() => setAuthMethod("password")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            authMethod === "password"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          密码登录
        </button>
      </div>

      {authMethod === "sms" ? (
        <form onSubmit={handleSmsLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-foreground">
              手机号
            </Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="请输入手机号"
                maxLength={11}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSendSms}
                disabled={isPending || countdown > 0}
                className="shrink-0"
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </Button>
            </div>
          </div>

          {smsSent && (
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-foreground">
                验证码
              </Label>
              <Input
                id="code"
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="请输入 6 位验证码"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isPending || !smsSent}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              "登录"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-foreground">
                昵称（可选）
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                value={name}
                maxLength={50}
                placeholder="展示用昵称"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-foreground">
              用户名
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              autoComplete="username"
              required
              maxLength={50}
              placeholder="例如: demo"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password" className="text-foreground">
                密码
              </Label>
              {mode === "signin" && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  忘记密码？
                </Link>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              maxLength={100}
              placeholder="至少 8 位"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : mode === "signin" ? (
              "登录"
            ) : (
              "创建账号"
            )}
          </Button>
        </form>
      )}

      <div className="mt-8 space-y-3 rounded-xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>{mode === "signin" ? "第一次来？" : "已经有账号？"}</span>
          <Button variant="outline" size="sm" asChild>
            <Link href={switchHref}>{mode === "signin" ? "去注册" : "去登录"}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
