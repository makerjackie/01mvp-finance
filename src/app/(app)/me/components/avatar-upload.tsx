"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Edit2 } from "lucide-react";
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
  className?: string;
}

export function AvatarUpload({ user, className }: AvatarUploadProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className={cn("relative inline-block", className)}>
      <label
        className={cn(
          "group relative block h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm transition-all hover:opacity-90",
          isUploading && "opacity-50 cursor-wait",
        )}
        title="Click to change avatar"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="sr-only"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <Avatar className="h-full w-full">
          <AvatarImage src={user.image || ""} alt={user.name || "Avatar"} className="object-cover" />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {user.name?.[0] || user.username?.[0] || "U"}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </label>

      {/* Edit Badge - Always visible or on hover */}
      <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background shadow-sm">
          <Edit2 className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}
