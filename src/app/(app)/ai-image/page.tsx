"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkles, ImageIcon, X, Plus, SlidersHorizontal, Download, Wand2, Info } from "lucide-react";
import { nanoid } from "nanoid";
import { ImmersiveHeader } from "@/components/immersive-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import type {
  AspectRatio,
  GenerationParams,
  GeneratedImage,
  GenerationTask,
  StylePreset,
} from "@/server/modules/image-gen/types";

const DEFAULT_PRESETS: StylePreset[] = [
  {
    id: "none",
    name: "默认",
    description: "",
  },
  {
    id: "watercolor",
    name: "水彩",
    description: "柔和水彩风格,自然混合效果,温暖色调,艺术笔触",
    icon: "🎨",
  },
  {
    id: "cyberpunk",
    name: "赛博朋克",
    description: "霓虹灯,雨夜城市,高科技低生活美学,未来感",
    icon: "🌃",
  },
  {
    id: "anime",
    name: "动漫",
    description: "精致线条,明亮色彩,日式动漫角色设计风格",
    icon: "🌸",
  },
  {
    id: "photoreal",
    name: "写实照片",
    description: "高清摄影质感,自然光线,真实细节,8k",
    icon: "📷",
  },
  {
    id: "minimal",
    name: "极简",
    description: "简单几何形状,扁平设计,干净整洁,矢量艺术",
    icon: "⬜",
  },
  {
    id: "custom",
    name: "自定义",
    description: "",
    icon: "✨",
  },
];

const ASPECT_RATIOS: { portrait: AspectRatio[]; landscape: AspectRatio[] } = {
  portrait: ["1:1", "4:5", "3:4", "2:3", "9:16"],
  landscape: ["5:4", "4:3", "3:2", "16:9", "21:9"],
};

const PARAMS_STORAGE_KEY = "gp_params_v2";
const TASKS_STORAGE_KEY = "gp_tasks_history_v1";
const SESSIONS_STORAGE_KEY = "gp_sessions_history_v1";
const MAX_HISTORY_ITEMS = 200;

const DEFAULT_PARAMS: GenerationParams = {
  aspectRatios: ["4:3"],
  resolution: "1K",
  count: 2,
};

type ImageSession = {
  id: string;
  title: string;
  tasks: GenerationTask[];
  createdAt: number;
  updatedAt: number;
};

const DEFAULT_SESSION_TITLE = "新的设计";

const createEmptySession = (title = DEFAULT_SESSION_TITLE): ImageSession => ({
  id: nanoid(),
  title,
  tasks: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const AspectRatioIcon = ({
  ratio,
  active,
  orientation,
}: {
  ratio: AspectRatio;
  active: boolean;
  orientation: "portrait" | "landscape";
}) => {
  const [w, h] = ratio.split(":").map(Number);
  const maxDim = 24;
  let width: number;
  let height: number;

  if (orientation === "portrait") {
    height = maxDim;
    width = (w / h) * maxDim;
  } else {
    width = maxDim;
    height = (h / w) * maxDim;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 p-1 rounded-lg border transition-all cursor-pointer h-14 min-w-14 ${
        active
          ? "bg-primary/10 border-primary text-primary shadow-sm"
          : "bg-secondary border-border text-muted-foreground hover:bg-muted hover:border-primary/50"
      }`}
    >
      <div
        className={`border-[1.5px] rounded-[1px] transition-all shrink-0 ${active ? "border-primary bg-primary/20" : "border-current"}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      />
      <span className="text-[9px] font-mono leading-none opacity-80">{ratio}</span>
    </div>
  );
};

export default function ImageGenerationPage() {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://generativelanguage.googleapis.com");
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [needCustomKey, setNeedCustomKey] = useState(false);
  const [prompt, setPrompt] = useState(
    "一只可爱的香蕉,手绘蜡笔风格,粗糙质感,粗黑轮廓,大圆眼睛,可爱简单的脸,鲜艳的蓝色背景",
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string>("none");
  const [customStylePrompt, setCustomStylePrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [params, setParams] = useState<GenerationParams>(DEFAULT_PARAMS);
  const [sessions, setSessions] = useState<ImageSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const sortSessions = (list: ImageSession[]) => [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const currentSession = sessions.find((session) => session.id === currentSessionId);
  const tasks = currentSession?.tasks ?? [];

  const ensureActiveSessionId = () => {
    if (currentSessionId) return currentSessionId;
    const session = createEmptySession();
    setSessions([session]);
    setCurrentSessionId(session.id);
    return session.id;
  };

  const updateSessionById = (sessionId: string, updater: (session: ImageSession) => ImageSession) => {
    setSessions((prev) => sortSessions(prev.map((session) => (session.id === sessionId ? updater(session) : session))));
  };

  const startNewSession = () => {
    const session = createEmptySession();
    setSessions((prev) => sortSessions([session, ...prev]));
    setCurrentSessionId(session.id);
    setPrompt("");
    setReferenceImages([]);
    setNeedCustomKey(false);
    setLightboxImage(null);
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setReferenceImages([]);
    setLightboxImage(null);
  };

  useEffect(() => {
    // 持久化的 API Key 相关设置
    const savedUseCustomKey = localStorage.getItem("gp_use_custom_key");
    if (savedUseCustomKey === "true") {
      setUseCustomKey(true);
      const savedKey = localStorage.getItem("gp_api_key");
      const savedBaseUrl = localStorage.getItem("gp_base_url");
      if (savedKey) setApiKey(savedKey);
      if (savedBaseUrl) setBaseUrl(savedBaseUrl);
    }

    // 读取上次的参数
    const savedParams = localStorage.getItem(PARAMS_STORAGE_KEY);
    if (savedParams) {
      try {
        setParams({ ...DEFAULT_PARAMS, ...JSON.parse(savedParams) });
      } catch (e) {
        console.error("Failed to parse saved params:", e);
      }
    } else {
      // 清理旧版本的存储,让新版默认值生效
      localStorage.removeItem("gp_params");
    }

    // 优先从新的 session 存储中恢复
    const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions) as ImageSession[];
        if (parsed.length > 0) {
          const normalized = parsed.map((session) => ({
            ...session,
            title: session.title || DEFAULT_SESSION_TITLE,
            tasks: session.tasks || [],
            createdAt: session.createdAt || Date.now(),
            updatedAt: session.updatedAt || session.createdAt || Date.now(),
          }));
          const sorted = sortSessions(normalized);
          setSessions(sorted);
          setCurrentSessionId(sorted[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved sessions:", e);
      }
    }

    // 兼容旧版: 如果有 legacy task,迁移为单个会话
    const savedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks) as GenerationTask[];
        const legacySession = { ...createEmptySession("历史对话"), tasks: parsed };
        setSessions([legacySession]);
        setCurrentSessionId(legacySession.id);
        return;
      } catch (e) {
        console.error("Failed to parse saved tasks:", e);
      }
    }

    // 默认初始化一个空会话
    const initialSession = createEmptySession();
    setSessions([initialSession]);
    setCurrentSessionId(initialSession.id);
  }, []);

  useEffect(() => {
    localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(params));
  }, [params]);

  useEffect(() => {
    if (sessions.length === 0) {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
      return;
    }

    const sessionsForStorage = sessions.map((session) => {
      const completedTasks = session.tasks.filter((t) => t.status === "success" && t.data);
      const keepCompleted = completedTasks.slice(-MAX_HISTORY_ITEMS);
      const keepIds = new Set(keepCompleted.map((t) => t.id));
      const trimmedTasks = session.tasks.filter((t) => t.status !== "success" || keepIds.has(t.id));
      return { ...session, tasks: trimmedTasks };
    });

    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessionsForStorage));
    localStorage.removeItem(TASKS_STORAGE_KEY);
  }, [sessions]);

  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [currentSessionId, sessions]);

  useEffect(() => {
    setLightboxImage(null);
  }, [currentSessionId]);

  const ingestFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    imageFiles.slice(0, 6).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setReferenceImages((prev) => {
          if (prev.length >= 6) return prev;
          if (prev.includes(result)) return prev;
          return [...prev, result];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      ingestFiles(Array.from(files));
      e.target.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      e.preventDefault();
      ingestFiles(files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length > 0) {
      ingestFiles(files);
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = image.url;
    link.download = `image-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRatio = (ratio: AspectRatio) => {
    const exists = params.aspectRatios.includes(ratio);
    if (exists && params.aspectRatios.length === 1) return;
    setParams((p) => ({
      ...p,
      aspectRatios: exists ? p.aspectRatios.filter((r) => r !== ratio) : [...p.aspectRatios, ratio],
    }));
  };

  const handleGenerate = async () => {
    // 只有在使用自定义 API key 模式时才检查 API key
    if (useCustomKey && !apiKey) {
      toast.error("请先设置 API Key");
      return;
    }

    if (!prompt.trim() && referenceImages.length === 0) {
      toast.error("请输入提示词或上传参考图片");
      return;
    }

    setShowConfig(false);

    const style = DEFAULT_PRESETS.find((s) => s.id === selectedStyleId);
    let finalPrompt = prompt;

    if (style) {
      if (style.id === "custom" && customStylePrompt.trim()) {
        finalPrompt = `${customStylePrompt}. ${prompt}`;
      } else if (style.id !== "none" && style.id !== "custom") {
        finalPrompt = `${style.description}. ${prompt}`;
      }
    }

    const finalRefImages = [...referenceImages, ...(style?.referenceImages || [])];

    const sessionId = ensureActiveSessionId();
    const batchId = Date.now().toString();
    const newTasks: GenerationTask[] = [];

    params.aspectRatios.forEach((ratio) => {
      for (let i = 0; i < params.count; i++) {
        newTasks.push({
          id: `${batchId}-${ratio}-${i}`,
          batchId: batchId,
          status: "generating",
          aspectRatio: ratio,
          prompt: finalPrompt,
          placeholder: true,
          referenceImages: finalRefImages,
        });
      }
    });

    const nextTitle = (prompt.trim() || finalPrompt).slice(0, 40) || DEFAULT_SESSION_TITLE;
    const now = Date.now();
    setCurrentSessionId(sessionId);
    updateSessionById(sessionId, (session) => ({
      ...session,
      title: session.title && session.title !== DEFAULT_SESSION_TITLE ? session.title : nextTitle,
      tasks: [...session.tasks, ...newTasks],
      updatedAt: now,
    }));

    let customKeyRequired = false;

    const generationPromises = newTasks.map(async (task) => {
      if (customKeyRequired) return;

      try {
        const requestBody: Record<string, unknown> = {
          prompt: finalPrompt,
          referenceImages: finalRefImages,
          aspectRatio: task.aspectRatio,
          resolution: params.resolution,
          useCustomKey,
        };

        if (useCustomKey) {
          requestBody.apiKey = apiKey;
          requestBody.baseUrl = baseUrl;
        }

        const response = await fetch("/api/image-gen/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();

          // 检查是否需要自定义 API key
          if (errorData.needCustomKey) {
            if (!customKeyRequired) {
              customKeyRequired = true;
              setNeedCustomKey(true);
              toast.error("后端 API 未配置,请使用自定义 API Key");
              updateSessionById(sessionId, (session) => ({
                ...session,
                tasks: session.tasks.map((t) =>
                  t.batchId === batchId
                    ? {
                        ...t,
                        status: "error",
                        error: "后端 API 未配置,请使用自定义 API Key",
                      }
                    : t,
                ),
                updatedAt: Date.now(),
              }));
            }
            return;
          }

          throw new Error(errorData.error || "生成失败");
        }

        const data = await response.json();
        const imageUrl = data.url || data.originUrl;

        if (!imageUrl) {
          throw new Error("未返回图片地址");
        }

        const generatedData: GeneratedImage = {
          id: task.id,
          batchId: batchId,
          url: imageUrl,
          originUrl: data.originUrl,
          stored: data.stored,
          prompt: finalPrompt,
          aspectRatio: task.aspectRatio,
          resolution: params.resolution,
          timestamp: Date.now(),
          styleId: selectedStyleId,
          referenceImages: finalRefImages,
        };

        updateSessionById(sessionId, (session) => ({
          ...session,
          tasks: session.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "success",
                  data: generatedData,
                }
              : t,
          ),
          updatedAt: Date.now(),
        }));
      } catch (err) {
        console.error("Generation error:", err);
        updateSessionById(sessionId, (session) => ({
          ...session,
          tasks: session.tasks.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "error",
                  error: err instanceof Error ? err.message : "生成失败",
                }
              : t,
          ),
          updatedAt: Date.now(),
        }));
        if (!customKeyRequired) {
          toast.error(err instanceof Error ? err.message : "生成失败");
        }
      }
    });

    await Promise.allSettled(generationPromises);

    setPrompt("");
    setReferenceImages([]);
  };

  const groupTasksByBatch = (tasks: GenerationTask[]) => {
    const groups: { [key: string]: GenerationTask[] } = {};
    const order: string[] = [];

    tasks.forEach((task) => {
      const bid = task.batchId || "legacy";
      if (!groups[bid]) {
        groups[bid] = [];
        order.push(bid);
      }
      groups[bid].push(task);
    });

    return order.map((bid) => groups[bid]);
  };

  const groupTasksByRatio = (tasks: GenerationTask[]) => {
    const groups: { [key: string]: GenerationTask[] } = {};
    tasks.forEach((task) => {
      if (!groups[task.aspectRatio]) groups[task.aspectRatio] = [];
      groups[task.aspectRatio].push(task);
    });
    return groups;
  };

  const groupedTasks = groupTasksByBatch(tasks);
  const sortedSessions = sortSessions(sessions);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <ImmersiveHeader className="md:hidden" title="AI 生图" />
      <div className="flex-1 overflow-y-auto pt-8 pb-48 px-4 md:px-8 scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
        <div className="max-w-[1800px] mx-auto space-y-10 min-h-[50vh]">
          <div className="flex flex-col gap-3 p-3 md:p-4 rounded-2xl border border-border/60 bg-background/70 backdrop-blur-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-2">
                  {sortedSessions.map((session) => {
                    const isActive = session.id === currentSessionId;
                    return (
                      <button
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`px-3 py-1.5 rounded-full border text-xs md:text-sm transition-all max-w-[220px] truncate ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/60 text-muted-foreground hover:text-foreground hover:border-border"
                        }`}
                        title={session.title || DEFAULT_SESSION_TITLE}
                      >
                        {session.title || DEFAULT_SESSION_TITLE}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={startNewSession}
                className="rounded-full h-9 px-3 md:px-4 flex items-center gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                新开对话
              </Button>
            </div>
            {groupedTasks.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>当前对话会沿用参考图/提示词。如果要开始完全新的设计，请点击“新开对话”创建一个新的会话。</span>
              </div>
            )}
          </div>
          {groupedTasks.length > 0 ? (
            <div className="space-y-20 pb-12">
              {groupedTasks.map((batch, index) => {
                const firstItem = batch[0];
                const refData = batch.find((t) => t.data)?.data;
                const promptText = firstItem.prompt;
                const timestamp = refData?.timestamp || Date.now();
                const resolution = refData?.resolution || params.resolution;
                const ratioGroups = groupTasksByRatio(batch);
                const referenceThumbs = refData?.referenceImages || firstItem.referenceImages || [];

                return (
                  <div
                    key={firstItem.batchId || index}
                    className="group relative animate-in fade-in slide-in-from-bottom-4 duration-500"
                  >
                    <div className="mb-8">
                      <p className="text-foreground text-lg md:text-xl font-normal leading-relaxed max-w-5xl">
                        {promptText}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground font-mono">
                        <span className="text-primary font-bold">
                          {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>•</span>
                        <span>{resolution}</span>
                      </div>
                      {referenceThumbs.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          <div className="text-[11px] uppercase font-bold text-muted-foreground tracking-[0.2em]">
                            参考图
                          </div>
                          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                            {referenceThumbs.map((img, idx) => (
                              <div
                                key={`${firstItem.batchId || index}-ref-${idx}`}
                                className="w-14 h-14 rounded-lg overflow-hidden border border-border/70 bg-muted/50 shrink-0"
                              >
                                <Image
                                  src={img}
                                  alt={`reference-${idx}`}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                  unoptimized
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-8">
                      {Object.entries(ratioGroups).map(([ratio, groupTasks]) => (
                        <div key={ratio} className="space-y-3">
                          <div className="text-xs uppercase font-bold text-muted-foreground pl-1 tracking-widest">
                            {ratio}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-6">
                            {groupTasks.map((task) => (
                              <Card
                                key={task.id}
                                className="overflow-hidden group/card hover:shadow-lg transition-shadow"
                              >
                                {task.status === "generating" && (
                                  <div className="aspect-video bg-muted flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                  </div>
                                )}
                                {task.status === "success" && task.data && (
                                  <div className="relative cursor-pointer" onClick={() => setLightboxImage(task.data!)}>
                                    <Image
                                      src={task.data.url}
                                      alt={task.prompt}
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                      unoptimized={task.data.url.startsWith("data:")}
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <Button
                                        size="icon"
                                        variant="secondary"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (task.data) {
                                            handleDownload(task.data);
                                          }
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {task.status === "error" && (
                                  <div className="aspect-video bg-destructive/10 flex items-center justify-center p-4">
                                    <p className="text-xs text-destructive text-center">{task.error || "生成失败"}</p>
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[65vh] flex flex-col items-center justify-center text-muted-foreground space-y-8">
              <div className="p-8 rounded-full bg-primary/5 border border-border/50">
                <span className="text-7xl">🍌</span>
              </div>
              <div className="text-center space-y-4">
                <h3 className="text-3xl font-semibold text-foreground tracking-tight"> 支持批量/多比例生成</h3>
                <p className="text-base text-muted-foreground max-w-sm mx-auto"> 基于 Google Gemini 3 Pro </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center justify-end pointer-events-none pb-6 px-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-20">
        <div className="w-full max-w-4xl pointer-events-auto flex flex-col items-center gap-3">
          {/* Settings Tray */}
          <div
            className={`w-full bg-background/80 backdrop-blur-2xl border border-border/50 rounded-3xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom shadow-2xl ${
              showConfig ? "max-h-[600px] opacity-100 scale-100 mb-0" : "max-h-0 opacity-0 scale-95 mb-0"
            }`}
          >
            <div className="p-6 space-y-6 relative">
              <button
                onClick={() => setShowConfig(false)}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Aspect Ratios */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <div className="text-sm font-medium text-foreground">生成设置</div>
                  </div>
                  <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block pl-1">
                    画面比例
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {ASPECT_RATIOS.portrait.map((ratio) => (
                      <div key={ratio} onClick={() => toggleRatio(ratio)} className="h-14">
                        <AspectRatioIcon
                          ratio={ratio}
                          active={params.aspectRatios.includes(ratio)}
                          orientation="portrait"
                        />
                      </div>
                    ))}
                    {ASPECT_RATIOS.landscape.map((ratio) => (
                      <div key={ratio} onClick={() => toggleRatio(ratio)} className="h-14">
                        <AspectRatioIcon
                          ratio={ratio}
                          active={params.aspectRatios.includes(ratio)}
                          orientation="landscape"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Count & Resolution */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block pl-1">
                      分辨率
                    </label>
                    <div className="flex bg-muted/50 rounded-xl p-1.5 border border-border/50">
                      {(["1K", "2K", "4K"] as const).map((res) => (
                        <button
                          key={res}
                          onClick={() => setParams((p) => ({ ...p, resolution: res }))}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                            params.resolution === res
                              ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between px-1">
                      <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                        图片数量
                      </label>
                      <span className="text-sm font-mono font-bold text-primary">{params.count}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={params.count}
                      onChange={(e) => setParams((p) => ({ ...p, count: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Style Chips */}
          <div className="w-full flex flex-col gap-2">
            <div className="w-full overflow-x-auto pb-1 scrollbar-none mask-linear-fade">
              <div className="flex gap-2 items-center justify-center md:justify-start px-1 min-w-max mx-auto">
                {DEFAULT_PRESETS.map((p) => {
                  const isSelected = selectedStyleId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedStyleId(p.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all border shadow-sm ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background/60 backdrop-blur-md border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border"
                      }`}
                    >
                      {p.icon && <span className="text-base">{p.icon}</span>}
                      <span className="font-medium">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Style Input */}
            {selectedStyleId === "custom" && (
              <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300 px-1">
                <div className="relative">
                  <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <input
                    type="text"
                    value={customStylePrompt}
                    onChange={(e) => setCustomStylePrompt(e.target.value)}
                    placeholder="输入自定义风格描述 (例如: 像素艺术, 8bit, 复古游戏风格...)"
                    className="w-full bg-background/60 backdrop-blur-md border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Main Input Bar */}
          <div
            className={`w-full bg-background/90 backdrop-blur-xl border border-border/50 rounded-[2rem] shadow-2xl shadow-black/5 flex flex-col p-2 gap-0 relative transition-all duration-300 hover:shadow-black/10 hover:border-border/80 ${
              isDragging ? "border-primary/60 ring-2 ring-primary/10" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            {/* Custom API Key Input (只在需要时显示) */}
            {needCustomKey && (
              <div className="mx-2 mt-2 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-2">
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  后端 API 未配置,请使用自定义 API Key
                </p>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        localStorage.setItem("gp_api_key", e.target.value);
                      }}
                      placeholder="AIzaSy... 或 sk-..."
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => {
                        setBaseUrl(e.target.value);
                        localStorage.setItem("gp_base_url", e.target.value);
                      }}
                      placeholder="https://generativelanguage.googleapis.com"
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (apiKey) {
                          setUseCustomKey(true);
                          setNeedCustomKey(false);
                          localStorage.setItem("gp_use_custom_key", "true");
                          toast.success("已切换到自定义 API Key");
                        } else {
                          toast.error("请先输入 API Key");
                        }
                      }}
                      className="rounded-xl px-6"
                    >
                      确认
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 rounded-xl">
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                        获取 Google Key
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="flex-1 rounded-xl">
                      <a href="https://302.ai" target="_blank" rel="noopener noreferrer">
                        获取 302.ai Key
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 已使用自定义 Key 的提示 */}
            {useCustomKey && !needCustomKey && (
              <div className="mx-2 mt-2 p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 pl-2">使用自定义 API Key</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs hover:bg-blue-500/10 hover:text-blue-600"
                  onClick={() => {
                    setUseCustomKey(false);
                    localStorage.setItem("gp_use_custom_key", "false");
                    toast.success("已切换到后端 API Key");
                  }}
                >
                  切换到后端
                </Button>
              </div>
            )}

            {tasks.length > 0 && (
              <div className="mx-2 mb-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 flex items-start gap-2 text-[11px] text-muted-foreground leading-relaxed">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>如果是全新设计,建议点击上方“新开对话”开始新的会话,避免沿用当前对话的参考图或描述。</span>
              </div>
            )}

            {/* Uploaded Images */}
            {referenceImages.length > 0 && (
              <div className="flex gap-3 overflow-x-auto p-3 scrollbar-none mb-1">
                {referenceImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-border group shadow-sm"
                  >
                    <Image
                      src={img}
                      alt={`ref-${idx}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                    <button
                      onClick={() => removeReferenceImage(idx)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                ))}
                {referenceImages.length < 6 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-16 h-16 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-muted/50 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-end gap-3 w-full p-1">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />

              {/* Image Upload Button (Left) */}
              <div className="hidden md:block pb-1">
                <Button
                  variant={referenceImages.length > 0 ? "default" : "secondary"}
                  size="icon"
                  className={`w-10 h-10 rounded-full shrink-0 transition-all ${referenceImages.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={referenceImages.length >= 6}
                >
                  <ImageIcon size={20} />
                  {referenceImages.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background">
                      {referenceImages.length}
                    </div>
                  )}
                </Button>
              </div>

              {/* Text Input */}
              <div className="relative flex-1">
                <Textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder={referenceImages.length > 0 ? "描述变化..." : "想象..."}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm md:text-base p-3 min-h-[80px] max-h-[240px] resize-none border-0 focus-visible:ring-0 shadow-none leading-relaxed"
                  rows={2}
                />
              </div>

              {/* Bottom/Side Controls */}
              <div className="flex justify-between items-center w-full md:w-auto md:pb-1 gap-2">
                {/* Mobile Image Upload Button */}
                <div className="md:hidden">
                  <Button
                    variant={referenceImages.length > 0 ? "default" : "secondary"}
                    size="icon"
                    className={`w-10 h-10 rounded-full shrink-0 ${referenceImages.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={referenceImages.length >= 6}
                  >
                    <ImageIcon size={20} />
                    {referenceImages.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background">
                        {referenceImages.length}
                      </div>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {/* Config Summary Pill */}
                  {!showConfig && (
                    <button
                      onClick={() => setShowConfig(true)}
                      className="hidden md:flex items-center gap-3 mr-1 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-md border border-border/50 text-foreground shadow-sm hover:shadow-md transition-all text-xs font-medium"
                    >
                      <span className="text-primary font-bold tracking-wide">
                        {params.aspectRatios.length > 2
                          ? `${params.aspectRatios.length} 比例`
                          : params.aspectRatios.join(", ")}
                      </span>
                      <span className="w-px h-3 bg-border shrink-0" />
                      <span className="shrink-0">{params.resolution}</span>
                      <span className="w-px h-3 bg-border shrink-0" />
                      <span className="shrink-0">{params.count}</span>
                    </button>
                  )}

                  {/* Settings Toggle */}
                  <Button
                    variant={showConfig ? "secondary" : "ghost"}
                    size="icon"
                    className={`w-10 h-10 rounded-full transition-all ${showConfig ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                    onClick={() => setShowConfig(!showConfig)}
                  >
                    <SlidersHorizontal size={20} />
                  </Button>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerate}
                    className="h-10 px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 hover:scale-105"
                  >
                    <span className="hidden sm:inline font-medium mr-2">生成</span>
                    <Sparkles size={18} fill="currentColor" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/98 backdrop-blur flex flex-col animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="shrink-0 h-16 flex justify-end items-center px-4 md:px-8">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setLightboxImage(null)}
              className="rounded-full text-white hover:bg-white/10"
            >
              <X size={24} />
            </Button>
          </div>

          <div className="flex-1 min-h-0 relative flex items-center justify-center px-4 md:px-12 pb-4">
            <Image
              src={lightboxImage.url}
              alt={lightboxImage.prompt}
              width={1920}
              height={1080}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              unoptimized={lightboxImage.url.startsWith("data:")}
              priority
            />
          </div>

          <div
            className="shrink-0 w-full bg-black/40 border-t border-white/5 p-6 backdrop-blur-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 text-center">
              <p className="text-base md:text-lg text-white font-medium leading-relaxed">{lightboxImage.prompt}</p>
              <div className="flex gap-3">
                <Button variant="secondary" asChild>
                  <a href={lightboxImage.url} download={`giga-banana-${lightboxImage.id}.png`}>
                    <Download size={18} />
                    下载
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
