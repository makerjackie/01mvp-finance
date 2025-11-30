export const siteConfig = {
  name: "01MVP Template",
  description: "快速构建你的下一个产品",
  tagline: "开箱即用的 Next.js 模板",
  apiBase:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"),
  features: [
    {
      title: "短信验证码登录",
      description: "安全快捷的手机验证码登录，支持腾讯云短信",
    },
    {
      title: "AI 智能对话",
      description: "集成 OpenAI 兼容 API，流式响应，开箱即用",
    },
    {
      title: "S3 云存储",
      description: "支持本地存储和 S3 兼容对象存储",
    },
  ],
  links: {
    signup: "/sign-up",
    signin: "/sign-in",
    chat: "/chat",
    dashboard: "/dashboard",
  },
};
