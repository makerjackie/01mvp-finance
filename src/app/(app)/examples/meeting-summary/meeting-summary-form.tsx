"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Copy, ExternalLink, RefreshCw, Square, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";

type HistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  model?: string;
  url: string;
  absoluteUrl: string;
  storagePublicUrl: string | null;
  inputPreview: string;
};

type ModelOption = { id: string; label: string; defaultChecked?: boolean };

const MODEL_OPTIONS: ModelOption[] = [
  { id: "deepseek-v3.2", label: "DeepSeek v3.2", defaultChecked: false },
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash Preview", defaultChecked: true },
  { id: "deepseek-chat", label: "DeepSeek Chat" },
  { id: "gpt-4o-mini", label: "GPT-4o mini" },
];

const safeCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("已复制");
  } catch {
    toast.error("复制失败，请手动复制");
  }
};

export function MeetingSummaryForm() {
  const [input, setInput] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(
    MODEL_OPTIONS.filter((m) => m.defaultChecked).map((m) => m.id),
  );

  const [runs, setRuns] = useState<
    Record<
      string,
      {
        isLoading: boolean;
        status: "idle" | "generating" | "finalizing" | "repairing";
        streamedHtml: string;
        result: HistoryItem | null;
      }
    >
  >({});

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const abortRefs = useRef<Record<string, AbortController | null>>({});
  const pendingDeltaRefs = useRef<Record<string, string>>({});
  const rafRefs = useRef<Record<string, number | null>>({});

  const anyLoading = useMemo(() => Object.values(runs).some((r) => r.isLoading), [runs]);
  const canSubmit = useMemo(
    () => input.trim().length >= 20 && selectedModels.length > 0 && !anyLoading,
    [input, selectedModels.length, anyLoading],
  );

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/examples/meeting-summary/history");
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) return;
      if (
        !data ||
        typeof data !== "object" ||
        !("items" in data) ||
        !Array.isArray((data as { items: unknown }).items)
      ) {
        return;
      }
      setHistory((data as { items: HistoryItem[] }).items);
    } catch {
      // ignore
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
    const rafs = rafRefs.current;
    const aborts = abortRefs.current;
    return () => {
      for (const model of Object.keys(rafs)) {
        const id = rafs[model];
        if (id) cancelAnimationFrame(id);
      }
      for (const controller of Object.values(aborts)) {
        controller?.abort();
      }
    };
  }, []);

  const flushPending = (model: string) => {
    const pending = pendingDeltaRefs.current[model] ?? "";
    if (!pending) return;
    pendingDeltaRefs.current[model] = "";
    setRuns((prev) => {
      const existing = prev[model] ?? { isLoading: false, status: "idle", streamedHtml: "", result: null };
      return { ...prev, [model]: { ...existing, streamedHtml: existing.streamedHtml + pending } };
    });
  };

  const scheduleFlush = (model: string) => {
    if (rafRefs.current[model]) return;
    rafRefs.current[model] = requestAnimationFrame(() => {
      rafRefs.current[model] = null;
      flushPending(model);
    });
  };

  const stopModel = (model: string) => {
    abortRefs.current[model]?.abort();
    abortRefs.current[model] = null;
    setRuns((prev) => {
      const existing = prev[model] ?? { isLoading: false, status: "idle", streamedHtml: "", result: null };
      return { ...prev, [model]: { ...existing, isLoading: false, status: "idle" } };
    });
    toast.message("已停止");
  };

  const runStream = async (model: string) => {
    setRuns((prev) => ({
      ...prev,
      [model]: { isLoading: true, status: "generating", streamedHtml: "", result: null },
    }));
    pendingDeltaRefs.current[model] = "";

    const controller = new AbortController();
    abortRefs.current[model] = controller;

    try {
      const res = await fetch("/api/examples/meeting-summary/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, model }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        toast.error(text || `生成失败（${res.status}）`);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        toast.error("无法读取流式响应");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          let msg: unknown;
          try {
            msg = JSON.parse(trimmed);
          } catch {
            continue;
          }

          if (!msg || typeof msg !== "object" || !("type" in msg)) continue;

          const type = (msg as { type?: unknown }).type;
          if (type === "delta") {
            const delta = (msg as { delta?: unknown }).delta;
            if (typeof delta === "string" && delta) {
              pendingDeltaRefs.current[model] = (pendingDeltaRefs.current[model] ?? "") + delta;
              scheduleFlush(model);
            }
            continue;
          }

          if (type === "status") {
            const next = (msg as { status?: unknown }).status;
            if (next === "generating" || next === "finalizing" || next === "repairing") {
              setRuns((prev) => {
                const existing = prev[model] ?? {
                  isLoading: true,
                  status: "generating",
                  streamedHtml: "",
                  result: null,
                };
                return { ...prev, [model]: { ...existing, status: next } };
              });
            }
            continue;
          }

          if (type === "done") {
            flushPending(model);
            const payload = (msg as { result?: unknown }).result;
            if (!payload || typeof payload !== "object" || !("id" in payload) || !("absoluteUrl" in payload)) {
              toast.error("返回数据异常");
              continue;
            }
            const item = payload as HistoryItem;
            setRuns((prev) => {
              const existing = prev[model] ?? { isLoading: true, status: "generating", streamedHtml: "", result: null };
              return { ...prev, [model]: { ...existing, result: item } };
            });
            setHistory((prev) => [item, ...prev.filter((x) => x.id !== item.id)]);
            toast.success("已生成");
            continue;
          }

          if (type === "error") {
            const err = (msg as { error?: unknown }).error;
            toast.error(typeof err === "string" ? err : "生成失败");
            continue;
          }
        }
      }
    } catch (error) {
      if ((error as { name?: unknown })?.name === "AbortError") {
        return;
      }
      toast.error(error instanceof Error ? error.message : "生成失败");
    } finally {
      setRuns((prev) => {
        const existing = prev[model] ?? { isLoading: false, status: "idle", streamedHtml: "", result: null };
        return { ...prev, [model]: { ...existing, isLoading: false, status: "idle" } };
      });
      abortRefs.current[model] = null;
    }
  };

  const onGenerate = () => {
    if (!canSubmit) return;
    for (const model of selectedModels) {
      void runStream(model);
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => (prev.includes(modelId) ? prev.filter((m) => m !== modelId) : [...prev, modelId]));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴会议文字纪要（建议包含：背景/议题/讨论点/结论/行动项/负责人）"
          className="min-h-[240px] text-sm"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">不少于 20 个字；可多选模型并行生成，便于对比效果。</p>
          <div className="flex gap-2 sm:w-auto w-full">
            <Button onClick={onGenerate} disabled={!canSubmit} className="flex-1 sm:flex-none">
              {anyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              生成（{selectedModels.length}）
            </Button>
            {anyLoading && (
              <Button
                variant="secondary"
                onClick={() => {
                  for (const model of selectedModels) stopModel(model);
                }}
                className="flex-1 sm:flex-none"
              >
                <Square className="h-4 w-4" />
                全部停止
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">选择模型（可多选）</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODEL_OPTIONS.map((m) => {
            const checked = selectedModels.includes(m.id);
            return (
              <label key={m.id} className="flex items-center gap-2 rounded-lg border bg-background p-3 text-sm">
                <input type="checkbox" checked={checked} onChange={() => toggleModel(m.id)} disabled={anyLoading} />
                <span className="flex-1">{m.label}</span>
                <span className="text-xs text-muted-foreground font-mono">{m.id}</span>
              </label>
            );
          })}
        </div>
      </div>

      {selectedModels.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {selectedModels.map((model) => {
            const run = runs[model] ?? { isLoading: false, status: "idle", streamedHtml: "", result: null };
            const label = MODEL_OPTIONS.find((m) => m.id === model)?.label ?? model;

            return (
              <div key={model} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{label}</div>
                    <div className="text-xs text-muted-foreground font-mono">{model}</div>
                  </div>
                  <div className="flex gap-2">
                    {run.isLoading && (
                      <Button size="sm" variant="secondary" onClick={() => stopModel(model)}>
                        <Square className="h-4 w-4" />
                        停止
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => safeCopy(run.streamedHtml)}
                      disabled={!run.streamedHtml}
                    >
                      <Copy className="h-4 w-4" />
                      复制输出
                    </Button>
                  </div>
                </div>

                {(run.isLoading || run.streamedHtml) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {run.status === "generating" && "生成中…"}
                        {run.status === "finalizing" && "整理中…"}
                        {run.status === "repairing" && "修复中…"}
                        {run.status === "idle" && run.isLoading && "处理中…"}
                      </p>
                      <p className="text-xs text-muted-foreground">{run.streamedHtml.length.toLocaleString()} chars</p>
                    </div>
                    <pre className="max-h-[240px] overflow-auto rounded-lg bg-muted/40 p-3 text-[12px] leading-relaxed whitespace-pre-wrap break-words">
                      {run.streamedHtml || "（等待模型输出…）"}
                    </pre>
                  </div>
                )}

                {run.result && (
                  <div className="rounded-lg border bg-background p-3 space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">已生成公开页面</p>
                      <p className="text-xs text-muted-foreground break-all">{run.result.absoluteUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => safeCopy(run.result?.absoluteUrl ?? "")}>
                        <Copy className="h-4 w-4" />
                        复制链接
                      </Button>
                      <Button size="sm" asChild>
                        <a href={run.result.url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          打开
                        </a>
                      </Button>
                    </div>
                    {run.result.storagePublicUrl && (
                      <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="break-all">
                            对象存储直链：<span className="font-mono">{run.result.storagePublicUrl}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => safeCopy(run.result?.storagePublicUrl ?? "")}
                          >
                            <Copy className="h-4 w-4" />
                            复制
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">历史</p>
            <p className="text-xs text-muted-foreground">仅你可见（需要登录），点击可打开之前生成的公开页面。</p>
          </div>
          <Button size="sm" variant="secondary" onClick={loadHistory} disabled={isHistoryLoading}>
            <RefreshCw className={isHistoryLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            刷新
          </Button>
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无记录</div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 20).map((item) => (
              <div key={item.id} className="rounded-lg border bg-background p-3 flex flex-col gap-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{item.title || "会议纪要总结"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                      {item.model ? (
                        <>
                          {" "}
                          · <span className="font-mono">{item.model}</span>
                        </>
                      ) : null}{" "}
                      · <span className="font-mono">{item.id}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => safeCopy(item.absoluteUrl)}>
                      <Copy className="h-4 w-4" />
                      复制
                    </Button>
                    <Button size="sm" asChild>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        打开
                      </a>
                    </Button>
                  </div>
                </div>
                {item.inputPreview && <div className="text-xs text-muted-foreground">{item.inputPreview}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
