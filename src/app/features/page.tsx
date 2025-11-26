import { headers } from "next/headers";
import Link from "next/link";
import { Upload, FileText, Image, Video, Music, File, Globe, Settings } from "lucide-react";
import { auth } from "@/server/lib/auth";

export default async function FeaturesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const features = [
    {
      icon: Upload,
      title: "上传文件",
      description: "上传 HTML 或 ZIP 包",
      href: "/upload",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Globe,
      title: "我的站点",
      description: "管理已上传的站点",
      href: "/sites",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: FileText,
      title: "在线编辑",
      description: "在线编辑文件内容",
      href: "/editor",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      disabled: true,
    },
    {
      icon: Image,
      title: "图片管理",
      description: "上传和管理图片",
      href: "/images",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      disabled: true,
    },
    {
      icon: Video,
      title: "视频处理",
      description: "上传和处理视频",
      href: "/videos",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      disabled: true,
    },
    {
      icon: Music,
      title: "音频工具",
      description: "音频编辑和转换",
      href: "/audio",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      disabled: true,
    },
    {
      icon: File,
      title: "文件管理",
      description: "管理所有文件",
      href: "/files",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      disabled: true,
    },
    {
      icon: Settings,
      title: "更多设置",
      description: "应用配置和选项",
      href: "/settings",
      color: "text-gray-500",
      bgColor: "bg-gray-500/10",
      disabled: true,
    },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-6">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">功能中心</h1>
        <p className="text-sm text-muted-foreground">{session?.user ? "探索所有可用功能" : "登录后使用更多功能"}</p>
      </div>

      {/* 功能网格 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isDisabled = feature.disabled;

          if (isDisabled) {
            return (
              <div key={feature.title} className="card flex flex-col items-center gap-3 p-6 text-center opacity-50">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}>
                  <Icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">即将推出</span>
              </div>
            );
          }

          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="card-hover flex flex-col items-center gap-3 p-6 text-center"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor}`}>
                <Icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 快捷操作提示 */}
      {!session?.user && (
        <div className="card border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            还没有登录？
            <Link href="/sign-in" className="ml-1 text-primary hover:underline">
              立即登录
            </Link>
            或
            <Link href="/sign-up" className="ml-1 text-primary hover:underline">
              注册账号
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
