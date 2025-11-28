"use client";

import { useRef, useState } from "react";
import { Loader2, Edit2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarUploadProps {
  user: {
    image?: string | null;
    name?: string | null;
    username?: string | null;
  };
  size?: "md" | "lg";
  className?: string;
}

export function AvatarUpload({ user, size = "lg", className }: AvatarUploadProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sizeClass = size === "md" ? "h-20 w-20" : "h-24 w-24";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate locally
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
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
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();

      await authClient.updateUser({
        image: data.url,
      });

      toast.success("Avatar updated successfully");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update avatar");
    } finally {
      setIsUploading(false);
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative inline-flex">
      <label
        className={cn(
          "group relative block cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/60 shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0",
          sizeClass,
          isUploading && "opacity-60 cursor-wait",
          className,
        )}
        title="点击更换头像"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="sr-only"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <Avatar className="h-full w-full border border-border/50">
          <AvatarImage src={user.image || ""} alt={user.name || "Avatar"} className="object-cover" />
          <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
            {user.name?.[0] || user.username?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/30">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </label>

      <div className="pointer-events-none absolute -bottom-1 -right-1 z-10">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background shadow-sm">
          <Edit2 className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
}
