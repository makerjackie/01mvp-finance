"use client";

import { ImmersiveHeader } from "@/components/immersive-header";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";

export default function ImmersiveNavPage() {
  return (
    <div className="min-h-screen bg-background pb-safe">
      <ImmersiveHeader title="活动详情" />

      <div className="relative h-64 w-full bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10" />
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"
          alt="Event Cover"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
          <Badge className="mb-2 bg-primary text-primary-foreground border-none">线下活动</Badge>
          <h1 className="text-2xl font-bold leading-tight mb-1">2024 年度开发者大会</h1>
          <p className="text-sm text-white/80">探索 AI 与 Web 开发的未来边界</p>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Host Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">TechCommunity</p>
              <p className="text-xs text-muted-foreground">主办方</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-full">
            关注
          </Button>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-1 gap-3">
          <Card className="p-3 flex items-center gap-3 border-border/50 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">2024年12月20日</p>
              <p className="text-xs text-muted-foreground">周六 14:00 - 18:00</p>
            </div>
          </Card>

          <Card className="p-3 flex items-center gap-3 border-border/50 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">上海中心大厦</p>
              <p className="text-xs text-muted-foreground">浦东新区陆家嘴环路501号</p>
            </div>
          </Card>

          <Card className="p-3 flex items-center gap-3 border-border/50 shadow-sm">
            <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">已报名 128 人</p>
              <div className="flex -space-x-2 mt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-5 w-5 rounded-full border border-background bg-gray-200" />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">活动介绍</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            本次大会将聚集来自全球的顶尖开发者，共同探讨 Next.js 15、React Server Components 以及 AI Agent
            在实际业务中的落地应用。
            <br />
            <br />
            我们将邀请 Vercel 核心团队成员进行主题演讲，并设置多个 Workshop 环节，让你亲手构建下一代 Web 应用。
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border/40 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button className="w-full rounded-xl text-base font-medium h-12 shadow-lg shadow-primary/20">立即报名</Button>
      </div>
    </div>
  );
}
