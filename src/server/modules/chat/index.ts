import { Hono } from "hono";
import { streamText } from "ai";
import { ai, allowedModels, defaultModel, isAllowedModel } from "@/server/lib/ai";
import { logger } from "@/server/lib/logger";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const chatRoutes = new Hono()
  // 流式聊天
  .post("/", async (c) => {
    try {
      const body = await c.req.json<{ messages: Message[]; model?: string }>();
      const { messages, model } = body;

      if (!messages || !Array.isArray(messages)) {
        return c.json({ error: "消息列表不能为空" }, 400);
      }

      if (model && !isAllowedModel(model)) {
        return c.json({ error: `不支持的模型，仅支持: ${allowedModels.join(", ")}` }, 400);
      }

      if (!process.env.AI_API_KEY) {
        logger.error("Chat failed: AI service not configured");
        return c.json({ error: "AI 服务未配置" }, 500);
      }

      const selectedModel = isAllowedModel(model) ? model : defaultModel;

      logger.info("Chat request", { messageCount: messages.length, model: selectedModel });

      const result = streamText({
        model: ai(selectedModel),
        messages,
      });

      // 返回流式响应
      return result.toDataStreamResponse();
    } catch (error) {
      logger.error("Chat error", { error: error instanceof Error ? error.message : String(error) });
      const message = error instanceof Error ? error.message : "AI 服务暂时不可用";
      return c.json({ error: message }, 500);
    }
  });

export default chatRoutes;
