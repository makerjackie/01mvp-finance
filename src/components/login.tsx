"use client";

import { Loader2, Smartphone, KeyRound } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

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
    } catch {
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
    } catch {
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
    } catch {
      setError("网络错误，请重试");
      setIsPending(false);
    }
  };

  const switchHref = `${mode === "signin" ? siteConfig.links.signup : siteConfig.links.signin}${
    redirect ? `?redirect=${redirect}` : ""
  }`;

  return (
    <div className="w-full p-6 sm:p-8">
      <div className="mb-8 space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {mode === "signin" ? "欢迎回来" : "创建账号"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "signin" ? `登录您的 ${siteConfig.name} 账号` : `注册 ${siteConfig.name} 账号，开始使用`}
        </p>
      </div>

      {/* 登录方式切换 */}
      <div className="mb-8 flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setAuthMethod("sms")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
            authMethod === "sms"
              ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Smartphone className="h-4 w-4" />
          验证码登录
        </button>
        <button
          type="button"
          onClick={() => setAuthMethod("password")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
            authMethod === "password"
              ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <KeyRound className="h-4 w-4" />
          密码登录
        </button>
      </div>

      {authMethod === "sms" ? (
        <form onSubmit={handleSmsLogin} className="space-y-5 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="flex gap-2">
              <div className="flex flex-1 gap-1.5">
                <div className="flex items-center justify-center rounded-lg border bg-muted px-3 text-sm font-medium text-muted-foreground">
                  +86
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="flex-1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendSms}
                disabled={isPending || countdown > 0}
                className="shrink-0 min-w-[100px]"
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </Button>
            </div>
          </div>

          {smsSent && (
            <div className="space-y-2 animate-slide-up">
              <Label htmlFor="code">验证码</Label>
              <Input
                id="code"
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                placeholder="请输入 6 位验证码"
                maxLength={6}
                className="tracking-widest"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2 animate-slide-up">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isPending || !smsSent}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              "登录"
            )}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            点击登录即表示您同意我们的
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              服务条款
            </Link>
            {" 和 "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              隐私政策
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handlePasswordLogin} className="space-y-5 animate-fade-in">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">昵称（可选）</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                onChange={(e) => setName(e.target.value)}
                value={name}
                maxLength={50}
                placeholder="设置一个好听的昵称"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">密码</Label>
              {mode === "signin" && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
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
              placeholder="至少 8 位字符"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2 animate-slide-up">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : mode === "signin" ? (
              "登录"
            ) : (
              "创建账号"
            )}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            点击登录即表示您同意我们的
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              服务条款
            </Link>
            {" 和 "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              隐私政策
            </Link>
          </p>
        </form>
      )}

      <div className="mt-8 text-center text-sm">
        <span className="text-muted-foreground">{mode === "signin" ? "还没有账号？" : "已经有账号？"}</span>
        <Link href={switchHref} className="ml-2 font-medium text-primary underline-offset-4 hover:underline">
          {mode === "signin" ? "立即注册" : "直接登录"}
        </Link>
      </div>
    </div>
  );
}
