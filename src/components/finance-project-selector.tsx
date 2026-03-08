"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, PlusCircle, Search } from "lucide-react";
import {
  DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT,
  getSettlementDescription,
  inferProjectCategory,
  inferProjectSettlementConfig,
  PROJECT_CATEGORY_LABELS,
  PROJECT_SETTLEMENT_MODE_LABELS,
  type ProjectSettlementMode,
  toProjectNormalizedName,
} from "@/lib/project-categories";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateActivityDialog } from "@/components/create-activity-dialog";

type ProjectItem = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  settlementMode: ProjectSettlementMode;
  settlementModeLabel: string;
  communitySharePercent: number;
  settlementDescription: string;
};

type SearchResponse = {
  success?: boolean;
  error?: string;
  data?: ProjectItem[];
};

type CreateResponse = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    category: string;
    categoryLabel: string;
    settlementMode: ProjectSettlementMode;
    settlementModeLabel: string;
    communitySharePercent: number;
    settlementDescription: string;
    created: boolean;
  };
};

interface FinanceProjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  applicationType?: string;
  subcategory?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showHint?: boolean;
}

export function FinanceProjectSelector({
  value,
  onChange,
  applicationType,
  subcategory,
  disabled = false,
  required = false,
  placeholder = "输入关键字搜索项目，搜不到可新建",
  className,
  inputClassName,
  showHint = true,
}: FinanceProjectSelectorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const inferredCategory = useMemo(
    () => inferProjectCategory({ subcategory, applicationType }),
    [subcategory, applicationType],
  );
  const inferredSettlement = useMemo(
    () => inferProjectSettlementConfig({ subcategory, applicationType }),
    [subcategory, applicationType],
  );
  const [selectedSettlementMode, setSelectedSettlementMode] = useState<ProjectSettlementMode>(
    inferredSettlement.settlementMode,
  );
  const [communitySharePercent, setCommunitySharePercent] = useState(inferredSettlement.communitySharePercent);

  const normalizedCurrentValue = useMemo(() => toProjectNormalizedName(value), [value]);

  useEffect(() => {
    setSelectedSettlementMode(inferredSettlement.settlementMode);
    setCommunitySharePercent(inferredSettlement.communitySharePercent);
  }, [inferredSettlement.settlementMode, inferredSettlement.communitySharePercent]);

  useEffect(() => {
    if (!open || disabled) {
      return;
    }

    const trimmed = value.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const query = new URLSearchParams();
        query.set("limit", "8");
        if (trimmed) {
          query.set("query", trimmed);
        }

        const res = await fetch(`/api/finance/projects?${query.toString()}`, {
          signal: controller.signal,
        });
        const result = (await res.json()) as SearchResponse;

        if (!res.ok || !result.success) {
          setErrorMessage(result.error || "项目搜索失败，请稍后重试");
          setItems([]);
          return;
        }

        setItems(result.data || []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage("项目搜索失败，请稍后重试");
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, open, disabled]);

  const exactMatchExists = items.some((item) => toProjectNormalizedName(item.name) === normalizedCurrentValue);
  const canCreate = value.trim().length >= 2 && !exactMatchExists;

  const handleSelect = (name: string) => {
    onChange(name);
    setFeedbackMessage(`已选择项目：${name}`);
    setOpen(false);
    setErrorMessage(null);
  };

  const handleCreate = async () => {
    if (!canCreate || creating) return;

    setCreating(true);
    setErrorMessage(null);

    try {
      const normalizedSharePercent = Number.isFinite(communitySharePercent)
        ? Math.max(0, Math.min(100, Math.round(communitySharePercent)))
        : DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT;

      const res = await fetch("/api/finance/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: value,
          category: inferredCategory,
          subcategory,
          applicationType,
          settlementMode: selectedSettlementMode,
          communitySharePercent: normalizedSharePercent,
        }),
      });

      const result = (await res.json()) as CreateResponse;

      if (!res.ok || !result.success || !result.data) {
        setErrorMessage(result.error || "项目创建失败，请稍后重试");
        return;
      }

      const project = result.data;
      onChange(project.name);
      setItems((prev) => {
        const merged = [project, ...prev.filter((item) => item.id !== project.id)];
        return merged.slice(0, 8);
      });
      setFeedbackMessage(project.created ? `已新建项目：${project.name}` : `已匹配项目：${project.name}`);
      setOpen(false);
    } catch {
      setErrorMessage("项目创建失败，请稍后重试");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateActivity = async (activityName: string, eventDate?: string) => {
    setCreating(true);
    setErrorMessage(null);

    try {
      const normalizedSharePercent = Number.isFinite(communitySharePercent)
        ? Math.max(0, Math.min(100, Math.round(communitySharePercent)))
        : DEFAULT_PROFIT_SHARE_COMMUNITY_PERCENT;

      const res = await fetch("/api/finance/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: activityName,
          category: inferredCategory,
          subcategory,
          applicationType,
          settlementMode: selectedSettlementMode,
          communitySharePercent: normalizedSharePercent,
          eventDate: eventDate || undefined,
        }),
      });

      const result = (await res.json()) as CreateResponse;

      if (!res.ok || !result.success || !result.data) {
        setErrorMessage(result.error || "活动创建失败，请稍后重试");
        return;
      }

      const project = result.data;
      onChange(project.name);
      setItems((prev) => {
        const merged = [project, ...prev.filter((item) => item.id !== project.id)];
        return merged.slice(0, 8);
      });
      setFeedbackMessage(project.created ? `已新建活动：${project.name}` : `已匹配活动：${project.name}`);
      setOpen(false);
    } catch {
      setErrorMessage("活动创建失败，请稍后重试");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={cn("relative space-y-2", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          required={required}
          disabled={disabled}
          value={value}
          onFocus={() => {
            setOpen(true);
            setFeedbackMessage(null);
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setFeedbackMessage(null);
          }}
          className={cn("h-11 rounded-xl border-border/60 pl-9 text-sm shadow-sm", inputClassName)}
          placeholder={placeholder}
        />

        {open && !disabled && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border/70 bg-background p-1 shadow-lg">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在搜索项目...
              </div>
            ) : (
              <>
                {/* 顶部新建活动按钮 */}
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setShowCreateDialog(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/5"
                >
                  <PlusCircle className="h-4 w-4" />+ 新建活动
                </button>

                {items.length > 0 && <div className="my-1 border-t border-border/40" />}

                {items.length > 0 ? (
                  <div className="max-h-56 space-y-1 overflow-y-auto">
                    {items.map((item) => {
                      const active = toProjectNormalizedName(item.name) === normalizedCurrentValue;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSelect(item.name);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors",
                            active ? "bg-primary/10 text-primary" : "hover:bg-muted/70",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{item.settlementDescription}</p>
                          </div>
                          <div className="ml-2 flex shrink-0 items-center gap-1">
                            <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                              {item.categoryLabel}
                            </span>
                            <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                              {item.settlementModeLabel}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground">暂无匹配项目</div>
                )}

                {canCreate && (
                  <div className="border-t border-border/60 p-1">
                    <div className="space-y-1 rounded-lg bg-muted/30 px-2.5 py-2">
                      <p className="text-[11px] font-medium text-muted-foreground">新建项目结算配置</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(["cost_only", "profit_share"] as ProjectSettlementMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              setSelectedSettlementMode(mode);
                            }}
                            className={cn(
                              "rounded-md border px-2 py-1 text-[11px] transition-colors",
                              selectedSettlementMode === mode
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {PROJECT_SETTLEMENT_MODE_LABELS[mode]}
                          </button>
                        ))}
                      </div>

                      {selectedSettlementMode === "profit_share" && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>社区分成</span>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={communitySharePercent}
                            onChange={(event) => setCommunitySharePercent(Number(event.target.value || 0))}
                            onMouseDown={(event) => event.stopPropagation()}
                            className="h-7 w-16 rounded-md border-border/60 bg-background px-2 text-[11px]"
                          />
                          <span>
                            %（默认 20%，团队 {100 - Math.max(0, Math.min(100, communitySharePercent || 0))}%）
                          </span>
                        </div>
                      )}

                      <p className="text-[11px] text-muted-foreground">
                        {getSettlementDescription(selectedSettlementMode, communitySharePercent)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={creating}
                      className="mt-1 h-8 w-full justify-start gap-2 rounded-lg border-dashed border-border/60 text-xs"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        void handleCreate();
                      }}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          正在创建项目...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-3.5 w-3.5" />
                          新建项目 “{value.trim()}”
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={creating}
                      className="mt-1 h-8 w-full justify-start gap-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setShowCreateDialog(true);
                      }}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      新建活动（可填写举办日期）
                    </Button>
                  </div>
                )}

                {errorMessage && <p className="px-3 pb-2 text-[11px] text-rose-600">{errorMessage}</p>}
              </>
            )}
          </div>
        )}
      </div>

      {showHint && (
        <p className="text-xs text-muted-foreground">
          支持搜索已有项目；若没有匹配项，可一键新建并归类到“{PROJECT_CATEGORY_LABELS[inferredCategory]}”。
          可设置为“仅覆盖成本”或“盈利分成”（默认社区 20% / 团队 80%）。
        </p>
      )}

      {feedbackMessage && (
        <p className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          {feedbackMessage}
        </p>
      )}

      <CreateActivityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={(activityName, eventDate) => {
          void handleCreateActivity(activityName, eventDate);
        }}
      />
    </div>
  );
}
