import { toast as sonnerToast, type ExternalToast } from "sonner";
import { Copy } from "lucide-react";
import React from "react";

export const toast = {
  ...sonnerToast,
  error: (message: string | React.ReactNode, data?: ExternalToast) => {
    return sonnerToast.error(
      <div className="flex w-full justify-between items-start gap-2 group">
        <span className="flex-1">{message}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Try to copy the message content
            let textToCopy = "";
            if (typeof message === "string") {
              textToCopy = message;
            } else if (typeof message === "number") {
              textToCopy = String(message);
            } else {
              // Fallback for ReactNodes or objects, though less likely to be useful text
              textToCopy = "Error occurred";
            }

            navigator.clipboard.writeText(textToCopy);
            sonnerToast.success("已复制错误信息");
          }}
          className="shrink-0 p-1 text-foreground/50 hover:text-foreground hover:bg-foreground/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="复制错误信息"
          type="button"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>,
      data,
    );
  },
};
