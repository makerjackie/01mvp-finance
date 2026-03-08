"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (
    activityName: string,
    eventDate?: string,
    city?: string,
    activityDescription?: string,
  ) => Promise<void> | void;
}

export function CreateActivityDialog({ open, onOpenChange, onSuccess }: CreateActivityDialogProps) {
  const [activityName, setActivityName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    const trimmedName = activityName.trim();

    if (!trimmedName) {
      setError("请输入项目/活动名称");
      return;
    }

    if (trimmedName.length < 2) {
      setError("项目/活动名称至少需要2个字符");
      return;
    }

    // 直接传递原始名称和日期，不要组合
    await onSuccess(
      trimmedName,
      eventDate || undefined,
      city.trim() || undefined,
      activityDescription.trim() || undefined,
    );

    // 重置表单
    setActivityName("");
    setEventDate("");
    setCity("");
    setActivityDescription("");
    setError("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setActivityName("");
    setEventDate("");
    setCity("");
    setActivityDescription("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建活动</DialogTitle>
          <DialogDescription>创建一个新的项目或活动，填写基本信息后即可在下拉框中选择。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="activity-name">
                项目/活动名称<span className="text-destructive">*</span>
              </Label>
              <Input
                id="activity-name"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="例如：春季团建活动"
                className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">活动举办日期（可选）</Label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
              />
              <p className="text-xs text-muted-foreground">如果填写日期，将自动组合为“活动名称 日期”的格式</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-city">活动城市（可选）</Label>
              <Input
                id="activity-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="例如：深圳"
                className="h-11 rounded-xl border-border/60 text-sm shadow-sm"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">可填写活动举办城市，最多 30 字</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity-description">活动描述（可选）</Label>
              <Textarea
                id="activity-description"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="例如：用于记录活动背景、用途或补充说明"
                className="min-h-[88px] rounded-xl border-border/60 text-sm shadow-sm"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">最多 200 字，可留空</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} className="rounded-xl">
              取消
            </Button>
            <Button type="submit" className="rounded-xl">
              <PlusCircle className="h-4 w-4 mr-2" />
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
