import { createOpenAI } from "@ai-sdk/openai";

export const allowedModels = ["deepseek-v3.2", "gemini-3-flash-preview", "deepseek-chat", "gpt-4o-mini"] as const;
export type AllowedModel = (typeof allowedModels)[number];

export const isAllowedModel = (model?: string): model is AllowedModel =>
  !!model && allowedModels.includes(model as AllowedModel);

const envModel = process.env.AI_MODEL;
export const defaultModel: AllowedModel = isAllowedModel(envModel) ? envModel : "deepseek-chat";

// 使用自定义 API 端点
export const ai = createOpenAI({
  baseURL: process.env.AI_API_ENDPOINT || "https://api.openai.com/v1",
  apiKey: process.env.AI_API_KEY || "",
});
