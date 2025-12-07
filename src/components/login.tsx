"use client";

import { Loader2, Smartphone, KeyRound, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
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
  const [passwordLoginEnabled, setPasswordLoginEnabled] = useState(true);
  const [smsLoginEnabled, setSmsLoginEnabled] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const lockedMessage = "当前已关闭所有登录方式，请联系管理员开启登录入口";

  // 短信登录状态
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 密码登录状态
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // 倒计时定时器
  useEffect(() => {
    if (!countdown) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // 获取后台配置（密码登录开关）
  useEffect(() => {
    let cancelled = false;

    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/system/config", { cache: "no-store" });
        const data = await res.json();

        if (!cancelled && data?.config) {
          setPasswordLoginEnabled(Boolean(data.config.passwordLoginEnabled));
          setSmsLoginEnabled(Boolean(data.config.smsLoginEnabled));
          if (!data.config.smsLoginEnabled && data.config.passwordLoginEnabled) {
            setAuthMethod("password");
          }
          if (!data.config.passwordLoginEnabled && data.config.smsLoginEnabled) {
            setAuthMethod("sms");
          }
        }
      } catch {
        // 保持默认开启状态，避免阻塞登录
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
        }
      }
    };

    fetchConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  // 后台关闭密码登录时自动切回短信模式
  useEffect(() => {
    if (!passwordLoginEnabled && authMethod === "password" && smsLoginEnabled) {
      setAuthMethod("sms");
    }
    if (!smsLoginEnabled && authMethod === "sms" && passwordLoginEnabled) {
      setAuthMethod("password");
    }
  }, [authMethod, passwordLoginEnabled, smsLoginEnabled]);

  const noAuthAvailable = !passwordLoginEnabled && !smsLoginEnabled;

  useEffect(() => {
    if (noAuthAvailable) {
      setError(lockedMessage);
    } else if (error === lockedMessage) {
      setError(null);
    }
  }, [error, lockedMessage, noAuthAvailable]);

  const handleAuthMethodChange = (method: AuthMethod) => {
    if (noAuthAvailable) {
      toast.error(lockedMessage);
      return;
    }
    if (method === "sms" && !smsLoginEnabled) {
      toast.error("当前已关闭短信登录，请使用密码登录");
      return;
    }
    if (method === "password" && !passwordLoginEnabled) {
      toast.error("当前已关闭密码登录，请使用短信验证码登录");
      return;
    }

    setAuthMethod(method);
    setError(null);
  };

  // 发送验证码
  const handleSendSms = async () => {
    if (noAuthAvailable) {
      setError(lockedMessage);
      return;
    }
    if (!smsLoginEnabled) {
      setError("当前已关闭短信登录，请使用密码登录或联系管理员");
      return;
    }
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

  // 短信验证码登录
  const handleSmsLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!smsLoginEnabled) {
      setError("当前已关闭短信登录，请使用密码登录或联系管理员");
      return;
    }
    if (noAuthAvailable) {
      setError(lockedMessage);
      return;
    }
    if (!phoneNumber || !/^1\d{10}$/.test(phoneNumber)) {
      setError("请输入有效的手机号");
      return;
    }

    if (!smsCode || smsCode.length !== 6) {
      setError("请填写 6 位验证码");
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

    if (noAuthAvailable) {
      setError(lockedMessage);
      return;
    }
    if (!passwordLoginEnabled) {
      setError("当前已关闭密码登录，请使用短信验证码登录");
      return;
    }

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

  const headingTitle = noAuthAvailable
    ? "登录入口已暂时关闭"
    : authMethod === "sms"
      ? "手机号登录"
      : mode === "signin"
        ? "欢迎回来"
        : "创建账号";
  const headingDescription = noAuthAvailable
    ? "请联系管理员开启密码或短信登录后再尝试。"
    : authMethod === "sms"
      ? "未注册手机号验证后自动创建账号"
      : mode === "signin"
        ? `登录您的 ${siteConfig.name} 账号`
        : `注册 ${siteConfig.name} 账号，开始使用`;

  return (
    <div className="w-full p-6 sm:p-8">
      <div className="mb-8 space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{headingTitle}</h2>
        <p className="text-sm text-muted-foreground">{headingDescription}</p>
      </div>

      {/* 登录方式切换 */}
      <div className="mb-8 flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => handleAuthMethodChange("sms")}
          disabled={!smsLoginEnabled && !configLoading}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
            authMethod === "sms"
              ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5"
              : "text-muted-foreground hover:text-foreground",
            !smsLoginEnabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <Smartphone className="h-4 w-4" />
          验证码登录
        </button>
        <button
          type="button"
          onClick={() => handleAuthMethodChange("password")}
          disabled={noAuthAvailable || (!passwordLoginEnabled && !configLoading)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
            authMethod === "password"
              ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/5"
              : "text-muted-foreground hover:text-foreground",
            (!passwordLoginEnabled || noAuthAvailable) && "opacity-50 cursor-not-allowed",
          )}
        >
          <KeyRound className="h-4 w-4" />
          密码登录
        </button>
      </div>

      {noAuthAvailable && !configLoading && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
          <ShieldOff className="mt-0.5 h-4 w-4" />
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-none">登录入口已关闭</p>
            <p className="text-xs text-destructive/80">请联系管理员开启至少一种登录方式后再尝试。</p>
          </div>
        </div>
      )}

      {!passwordLoginEnabled && !configLoading && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <ShieldOff className="mt-0.5 h-4 w-4" />
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-none">密码登录已关闭</p>
            <p className="text-xs text-amber-800/80">请使用手机号验证码登录，管理员可在后台重新开启。</p>
          </div>
        </div>
      )}

      {!smsLoginEnabled && !configLoading && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <ShieldOff className="mt-0.5 h-4 w-4" />
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-none">短信登录已关闭</p>
            <p className="text-xs text-amber-800/80">请改用密码登录，或联系管理员开启短信验证码登录。</p>
          </div>
        </div>
      )}

      {authMethod === "sms" && smsLoginEnabled ? (
        <form onSubmit={handleSmsLogin} className="space-y-5 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
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
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendSms}
                disabled={isPending || countdown > 0 || !smsLoginEnabled || noAuthAvailable}
                className="shrink-0 px-4 min-w-[110px]"
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
                inputMode="numeric"
                autoComplete="one-time-code"
                value={smsCode}
                onChange={(e) => {
                  setSmsCode(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="请输入 6 位验证码"
                maxLength={6}
                className="tracking-widest text-base"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2 animate-slide-up">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending || !smsSent || !smsLoginEnabled || noAuthAvailable}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              "登录 / 注册"
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
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                value={name}
                maxLength={50}
                placeholder="设置一个好听的昵称"
                className="text-base"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              type="text"
              autoComplete="username"
              required
              maxLength={50}
              placeholder="例如: demo"
              className="text-base"
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
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={8}
              maxLength={100}
              placeholder="至少 8 位字符"
              className="text-base"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive flex items-center gap-2 animate-slide-up">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending || !passwordLoginEnabled || noAuthAvailable}
          >
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
