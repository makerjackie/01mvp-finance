"use client";

import { useState } from "react";
import { ImmersiveHeader } from "@/components/immersive-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "info", label: "活动信息" },
  { id: "participants", label: "参与者" },
  { id: "projects", label: "项目展示" },
];

export default function ComplexTabsPage() {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className="min-h-screen bg-background pb-safe">
      <ImmersiveHeader title="黑客松 Demo Day" />

      {/* Sticky Tabs */}
      <div className="sticky top-[60px] z-30 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="flex items-center px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 min-h-[calc(100vh-110px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "info" && <InfoTab />}
            {activeTab === "participants" && <ParticipantsTab />}
            {activeTab === "projects" && <ProjectsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoTab() {
  return (
    <div className="space-y-4">
      <Card className="p-4 border-border/50">
        <h3 className="font-semibold mb-2">关于活动</h3>
        <p className="text-sm text-muted-foreground">
          这是一个展示开发者创意的舞台。在这里，你将看到最前沿的技术应用和最酷炫的产品原型。
        </p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 border-border/50 bg-primary/5 border-none">
          <div className="text-2xl font-bold text-primary">24h</div>
          <div className="text-xs text-muted-foreground">开发时间</div>
        </Card>
        <Card className="p-4 border-border/50 bg-primary/5 border-none">
          <div className="text-2xl font-bold text-primary">10+</div>
          <div className="text-xs text-muted-foreground">参赛队伍</div>
        </Card>
      </div>
    </div>
  );
}

function ParticipantsTab() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/40">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div className="flex-1">
            <p className="text-sm font-medium">开发者 {i}</p>
            <p className="text-xs text-muted-foreground">Full Stack Engineer</p>
          </div>
          <Button size="sm" variant="ghost">
            查看
          </Button>
        </div>
      ))}
    </div>
  );
}

function ProjectsTab() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden border-border/50">
          <div className="h-32 bg-muted relative">
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 font-bold text-4xl">
              PROJECT {i}
            </div>
          </div>
          <div className="p-3">
            <h3 className="font-semibold">AI 辅助编程助手</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              利用最新的 LLM 技术，帮助开发者快速生成代码片段，自动修复 Bug，提升开发效率。
            </p>
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px]">AI</span>
              <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px]">React</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
