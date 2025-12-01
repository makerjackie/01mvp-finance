export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
export type Resolution = "1K" | "2K" | "4K";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  icon?: string;
  referenceImages?: string[];
}

export interface GenerationParams {
  aspectRatios: AspectRatio[];
  resolution: Resolution;
  count: number;
}

export interface GeneratedImage {
  id: string;
  batchId?: string;
  url: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  timestamp: number;
  styleId?: string;
  referenceImages?: string[];
  isFavorite?: boolean;
}

export interface GenerationTask {
  id: string;
  batchId?: string;
  status: "pending" | "generating" | "success" | "error";
  aspectRatio: AspectRatio;
  prompt: string;
  placeholder?: boolean;
  data?: GeneratedImage;
  error?: string;
}
