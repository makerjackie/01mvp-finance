"use client";

import { useChat } from "@ai-sdk/react";
import { Send, Loader2, Bot, User, Sparkles, StopCircle } from "lucide-react";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error } = useChat({
    api: "/api/chat",
    onResponse: async (response) => {
      if (response.ok) return;

      const data = await response.json().catch(() => null);
      const message = data?.error || response.statusText;
      throw new Error(message || "请求 AI 服务时出错");
    },
    onError: (err) => {
      console.error("Chat request failed", err);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="mx-auto max-w-3xl space-y-6 py-4">
          {messages.length === 0 && (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center animate-fade-in">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary shadow-sm ring-1 ring-inset ring-primary/10">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">有什么可以帮你的吗？</h2>
              <p className="mt-2 text-muted-foreground max-w-md">
                我可以帮你回答问题、提供创意、编写代码或处理文字工作。
              </p>
              
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                 <button onClick={() => handleInputChange({ target: { value: "帮我写一首关于春天的诗" } } as any)} className="text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:shadow-sm transition-all text-sm text-muted-foreground hover:text-foreground">
                   🌸 写一首关于春天的诗
                 </button>
                 <button onClick={() => handleInputChange({ target: { value: "如何使用 React Hooks?" } } as any)} className="text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:shadow-sm transition-all text-sm text-muted-foreground hover:text-foreground">
                   ⚛️ 如何使用 React Hooks?
                 </button>
                 <button onClick={() => handleInputChange({ target: { value: "解释一下量子纠缠" } } as any)} className="text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:shadow-sm transition-all text-sm text-muted-foreground hover:text-foreground">
                   🌌 解释一下量子纠缠
                 </button>
                 <button onClick={() => handleInputChange({ target: { value: "制定一个减肥计划" } } as any)} className="text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:shadow-sm transition-all text-sm text-muted-foreground hover:text-foreground">
                   💪 制定一个减肥计划
                 </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex gap-4 animate-in-from-bottom",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-sm",
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  "relative max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed",
                  message.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-card border border-border/50 text-card-foreground rounded-tl-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4 animate-pulse">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border/50 bg-card px-5 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">AI 正在思考...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-fit rounded-full bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center gap-2 animate-fade-in">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              出错了：{error.message}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框区域 */}
      <div className="border-t bg-background/80 backdrop-blur-sm p-4">
        <div className="mx-auto max-w-3xl">
          <form 
            onSubmit={handleSubmit} 
            className="relative flex items-center gap-2 rounded-xl border bg-background p-1 shadow-sm focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-primary transition-all"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="输入消息..."
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 h-11 px-3 text-base md:text-sm"
              disabled={isLoading}
            />
            <div className="flex gap-1 pr-1">
              {isLoading ? (
                 <Button 
                  type="button" 
                  onClick={() => stop()}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={!input.trim()} 
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-lg transition-all", 
                    input.trim() ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
          <p className="mt-3 text-center text-[10px] text-muted-foreground/60">
            AI 内容仅供参考，请核实重要信息
          </p>
        </div>
      </div>
    </div>
  );
}
