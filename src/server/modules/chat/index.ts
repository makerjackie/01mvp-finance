import { Hono } from "hono";
import { appendResponseMessages, streamText, type UIMessage } from "ai";
import { nanoid } from "nanoid";
import { auth } from "@/server/lib/auth";
import { ai, allowedModels, defaultModel, isAllowedModel } from "@/server/lib/ai";
import { getChatSessionMessages, listChatSessions, saveChatHistory } from "@/server/lib/chat-history";
import { logger } from "@/server/lib/logger";

const chatRoutes = new Hono()
  .get("/sessions", async (c) => {
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      const userId = session?.user?.id ?? null;

      const sessions = await listChatSessions(userId);
      return c.json({ sessions });
    } catch (error) {
      logger.error("Failed to fetch chat sessions", { error: error instanceof Error ? error.message : String(error) });
      return c.json({ error: "无法获取历史对话" }, 500);
    }
  })
  .get("/:id", async (c) => {
    try {
      const sessionId = c.req.param("id");
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      const userId = session?.user?.id ?? null;

      const result = await getChatSessionMessages(sessionId, userId);
      if (!result) {
        return c.json({ error: "会话不存在" }, 404);
      }

      return c.json({
        id: result.session.id,
        title: result.session.title,
        messages: result.messages,
      });
    } catch (error) {
      logger.error("Failed to fetch chat messages", { error: error instanceof Error ? error.message : String(error) });
      return c.json({ error: "获取会话失败" }, 500);
    }
  })
  // 流式聊天
  .post("/", async (c) => {
    try {
      const body = await c.req.json<{ messages: UIMessage[]; model?: string; id?: string }>();
      const { messages, model, id } = body;

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
      const chatId = id || nanoid();
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      const userId = session?.user?.id ?? null;

      logger.info("Chat request", { messageCount: messages.length, model: selectedModel });

      const result = streamText({
        model: ai(selectedModel),
        messages,
        onFinish: async ({ response }) => {
          try {
            const history = appendResponseMessages({
              messages,
              responseMessages: response.messages,
            });

            await saveChatHistory({
              id: chatId,
              messages: history,
              userId,
            });
          } catch (error) {
            logger.error("Failed to save chat history", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
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
