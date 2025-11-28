"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ImageIcon, Link2, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type UploadResponse = {
  url: string;
};

export function UploadDemo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const formatSize = (size: number) => {
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    if (size >= 1024) return `${Math.round(size / 1024)} KB`;
    return `${size} B`;
  };

  const resetState = () => {
    setFile(null);
    setUploadedUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFile = (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      toast.error("仅支持图片文件");
      resetState();
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("文件大小不能超过 5MB");
      resetState();
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selected);
    setUploadedUrl(null);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      handleFile(selected);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("请先选择文件");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "上传失败");
      }

      const data: UploadResponse = await res.json();
      setUploadedUrl(data.url);
      toast.success("上传成功");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "上传失败");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="card p-6 space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">上传图片</h2>
          <p className="text-sm text-muted-foreground">
            默认写入本地 <code className="font-mono">storage</code> 目录，配置 S3 环境变量后会改为云存储。
          </p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) {
              handleFile(dropped);
            }
          }}
          className="cursor-pointer rounded-xl border border-dashed border-border/70 bg-muted/40 px-4 py-10 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
          data-state={isDragging ? "dragging" : undefined}
        >
          {previewUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="overflow-hidden rounded-lg border border-border/50 bg-background shadow-sm">
                {/* 预览需要展示本地 object URL，使用原生 img */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt={file?.name ?? "预览"} className="h-44 w-auto max-w-full object-contain" />
              </div>
              <p className="text-xs text-muted-foreground">
                {file?.name} · {file ? formatSize(file.size) : ""}
              </p>
              <Button type="button" variant="secondary" size="sm">
                重新选择
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">点击或拖拽上传</p>
                <p className="text-xs text-muted-foreground">支持 PNG/JPG/GIF/WebP/SVG，单文件不超过 5MB</p>
              </div>
            </div>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 font-medium text-green-700 dark:bg-green-950/40 dark:text-green-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            登录后上传
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
            <AlertCircle className="h-3.5 w-3.5" />
            图片类型，最大 5MB
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button className="flex-1" onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                正在上传...
              </>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                上传并生成链接
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={resetState} disabled={!file && !previewUrl && !uploadedUrl}>
            清空
          </Button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">上传结果</h3>
          <p className="text-sm text-muted-foreground">接口返回直链地址，可直接用于头像或富文本编辑器。</p>
        </div>

        {uploadedUrl ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/40">
              {/* 上传结果展示远程文件直链，使用原生 img */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploadedUrl} alt="上传后的文件" className="h-56 w-full object-contain bg-background" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-xs font-mono break-all">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              {uploadedUrl}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              地址可公开访问，需鉴权的场景可以在 Hono 路由中增加校验。
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={uploadedUrl} target="_blank" rel="noreferrer">
                  新标签页打开
                </a>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(uploadedUrl).then(
                    () => toast.success("已复制地址"),
                    () => toast.error("复制失败，请手动复制"),
                  );
                }}
              >
                复制链接
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
            <p>上传后将在这里展示预览和直链。</p>
          </div>
        )}
      </div>
    </div>
  );
}
