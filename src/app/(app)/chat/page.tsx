"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { Loader2, Bot, User, Sparkles, StopCircle, Plus, Clock3, Send } from "lucide-react";
import { useRef, useEffect, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ChatSession = {
  id: string;
  title: string;
  updatedAt?: string;
  lastMessage?: { content?: string | null } | null;
};

export default function ChatPage() {
  const [chatId, setChatId] = useState(() => nanoid());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionTitle, setActiveSessionTitle] = useState("新的对话");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const hasLoadedInitialSession = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (!res.ok) return;
      const data = await res.json();
      setSessions(
        (data.sessions as ChatSession[] | undefined)?.map((session) => ({
          id: session.id,
          title: session.title ?? "新的对话",
          updatedAt: session.updatedAt,
          lastMessage: session.lastMessage ?? null,
        })) ?? [],
      );
    } catch (error) {
      console.error("加载历史对话失败", error);
    }
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, error, reload, setMessages, setInput } =
    useChat({
      id: chatId,
      api: "/api/chat",
      body: { id: chatId },
      onResponse: async (response) => {
        if (response.ok) return;
        const data = await response.json().catch(() => null);
        const message = data?.error || response.statusText;
        throw new Error(message || "连接 AI 服务时出错");
      },
      onError: (err) => {
        console.error("对话请求失败", err);
      },
      onFinish: () => {
        fetchSessions();
      },
    });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getDisplayText = (message: UIMessage) => {
    if (message.parts?.length) {
      const textPart = message.parts.find((part) => part.type === "text");
      const reasoningPart = message.parts.find((part) => part.type === "reasoning");
      if (textPart?.type === "text") return textPart.text;
      if (reasoningPart?.type === "reasoning") return reasoningPart.reasoning;
    }
    return message.content;
  };

  const startNewChat = useCallback(() => {
    const newId = nanoid();
    setChatId(newId);
    setMessages([]);
    setInput("");
    setActiveSessionTitle("新的对话");
    inputRef.current?.focus();
  }, [setInput, setMessages]);

  const loadSession = useCallback(
    async (sessionId: string) => {
      setIsHistoryLoading(true);
      try {
        const res = await fetch(`/api/chat/${sessionId}`);
        if (!res.ok) throw new Error("failed to fetch session");
        const data = await res.json();
        setChatId(data.id);
        setActiveSessionTitle(data.title ?? "新的对话");
        setMessages(data.messages ?? []);
        setInput("");
      } catch (err) {
        console.error("加载会话失败", err);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [setInput, setMessages],
  );

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (hasLoadedInitialSession.current) return;
    if (sessions.length === 0) return;
    if (messages.length > 0) {
      hasLoadedInitialSession.current = true;
      return;
    }
    hasLoadedInitialSession.current = true;
    loadSession(sessions[0].id);
  }, [sessions, loadSession, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const firstUserMessage = messages.find((msg) => msg.role === "user");
    if (firstUserMessage) {
      const title = getDisplayText(firstUserMessage);
      if (title && title !== activeSessionTitle) {
        setActiveSessionTitle(title.slice(0, 40));
      }
    }
  }, [activeSessionTitle, messages]);

  const renderMessageParts = (message: UIMessage) => {
    if (message.parts?.length) {
      return message.parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">
              {part.text}
            </div>
          );
        }
        if (part.type === "reasoning") {
          return (
            <div key={`${message.id}-${i}`} className="whitespace-pre-wrap text-muted-foreground">
              {part.reasoning}
            </div>
          );
        }
        return null;
      });
    }

    return <div className="whitespace-pre-wrap">{message.content}</div>;
  };

  return (
    <div className="flex min-h-full bg-gray-50/50 dark:bg-neutral-950">
      {/* History panel (desktop) */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border/50 bg-white/70 dark:bg-neutral-900/50 backdrop-blur-sm">
        <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock3 className="h-4 w-4" />
            历史对话
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={startNewChat}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 && (
            <div className="text-xs text-muted-foreground px-2 py-3 rounded-lg border border-dashed border-border/50">
              暂无历史对话
            </div>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => loadSession(session.id)}
              className={cn(
                "w-full rounded-xl px-3 py-2 text-left transition-all border",
                session.id === chatId
                  ? "border-primary/40 bg-primary/10 shadow-sm"
                  : "border-transparent hover:border-border/70 hover:bg-muted/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{session.title || "新的对话"}</p>
              </div>
              {session.lastMessage?.content && (
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{session.lastMessage.content}</p>
              )}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm leading-tight">AI 助手</h1>
              <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[220px]">
                {activeSessionTitle || "新的对话"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={startNewChat}>
            <Plus className="h-4 w-4" />
            <span className="sr-only">新对话</span>
          </Button>
        </header>

        {/* Mobile history pills */}
        <div className="lg:hidden px-4 pt-3 pb-2 flex items-center gap-2 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full shrink-0"
            onClick={startNewChat}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            新对话
          </Button>
          {sessions.map((session) => (
            <Button
              key={session.id}
              variant={session.id === chatId ? "default" : "outline"}
              size="sm"
              className="rounded-full shrink-0"
              onClick={() => loadSession(session.id)}
            >
              {session.title}
            </Button>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
          <div className="mx-auto max-w-2xl space-y-6 py-4 pb-10">
            {messages.length === 0 && !isHistoryLoading && (
              <div className="flex flex-col items-center justify-center text-center h-[60vh] animate-in fade-in duration-500">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-sm">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight mb-2">今天有什么可以帮您的吗？</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-8">
                  {[
                    { icon: "✍️", text: "写一首关于代码的诗" },
                    { icon: "🌱", text: "解释光合作用" },
                    { icon: "🐞", text: "帮我调试 React 组件" },
                    { icon: "📅", text: "制定健身计划" },
                  ].map((suggestion) => (
                    <button
                      key={suggestion.text}
                      onClick={() => handleInputChange({ target: { value: suggestion.text } } as any)}
                      className="text-left px-4 py-3 rounded-xl border border-border/50 bg-white dark:bg-neutral-900 hover:bg-accent/50 hover:border-primary/20 transition-all text-xs text-muted-foreground hover:text-foreground shadow-sm"
                    >
                      <span className="mr-2">{suggestion.icon}</span> {suggestion.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isHistoryLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在加载历史记录...
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}>
                <Avatar className={cn("h-8 w-8 border", message.role === "user" ? "bg-primary" : "bg-background")}>
                  {message.role === "user" ? (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-background">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div
                  className={cn(
                    "relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-white dark:bg-neutral-900 border border-border/50 text-foreground rounded-tl-sm",
                  )}
                >
                  {renderMessageParts(message)}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-background border shadow-sm">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border/50 bg-white dark:bg-neutral-900 px-4 py-2.5 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 px-4 py-2 text-xs text-destructive flex items-center gap-2">
                  <StopCircle className="h-3 w-3" />
                  错误: {error.message}
                  <button onClick={() => reload()} className="underline ml-2 font-medium">
                    重试
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gradient-to-t from-background via-background to-transparent">
          <div className="mx-auto max-w-2xl">
            <form
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2 rounded-2xl border bg-white dark:bg-neutral-900 p-2 shadow-lg shadow-black/5 ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="发消息给 AI..."
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 min-h-[44px] px-3 py-3 text-sm resize-none"
                disabled={isLoading}
                autoComplete="off"
              />
              <div className="pb-1 pr-1">
                {isLoading ? (
                  <Button
                    type="button"
                    onClick={() => stop()}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <StopCircle className="h-4 w-4 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!input.trim()}
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-xl transition-all duration-200",
                      input.trim()
                        ? "bg-primary text-primary-foreground shadow-md hover:scale-105"
                        : "bg-muted text-muted-foreground opacity-50",
                    )}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
