import { Hono } from "hono";
import { generateText, streamText } from "ai";
import { ai, defaultModel, isAllowedModel } from "@/server/lib/ai";
import { getPublicUrl, writeFile } from "@/server/lib/storage";
import { sessionMiddleware, type AuthEnv } from "@/server/middleware";
import {
  buildMeetingSummaryPrompt,
  ensureFullHtmlDocument,
  stripHtmlFromModelOutput,
  validateGeneratedHtml,
} from "./prompt";
import { appDailyQuota, appGlobalDailyQuota, appRateLimit } from "@/server/middleware/app-limits";
import { listMeetingSummaryHistory, saveMeetingSummaryHistoryItem } from "./history";

type Body = {
  text?: string;
  model?: string;
};

const MAX_CHARS = 50_000;

const system = [
  "你是严谨的 HTML 生成器。",
  "你只能输出单文件 HTML 源码，不要输出任何额外文本。",
  "必须以 <!doctype html> 开头，必须包含 <html>、<head>、<meta charset>、<meta viewport>、<body>，并以 </html> 结束。",
  "禁止输出 Markdown 代码块（不要 ```）。禁止包含 <script>。禁止引用外部资源（不要外链 CSS/JS/图片）。",
].join("\n");

const validateInput = (body: Body) => {
  const text = body.text?.trim() ?? "";
  if (!text) return { ok: false as const, error: "会议纪要不能为空" };
  if (text.length < 20) return { ok: false as const, error: "会议纪要内容太短" };
  if (text.length > MAX_CHARS) return { ok: false as const, error: `会议纪要过长（最多 ${MAX_CHARS} 字符）` };
  return { ok: true as const, text };
};

export const meetingSummaryRoutes = new Hono<AuthEnv>()
  .use(sessionMiddleware)
  .use(appRateLimit({ cap: 20 }))
  .get("/history", async (c) => {
    const userId = c.get("user")?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const items = await listMeetingSummaryHistory(userId);
    return c.json({ items });
  })
  .post("/stream", appDailyQuota(), appGlobalDailyQuota(), async (c) => {
    const userId = c.get("user")?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    if (!process.env.AI_API_KEY) {
      return c.json({ error: "AI 服务未配置" }, 500);
    }

    let body: Body;
    try {
      body = await c.req.json<Body>();
    } catch {
      return c.json({ error: "请求格式错误" }, 400);
    }

    const input = validateInput(body);
    if (!input.ok) return c.json({ error: input.error }, 400);

    const selectedModel = isAllowedModel(body.model) ? body.model : defaultModel;
    const origin = new URL(c.req.url).origin;
    const encoder = new TextEncoder();
    const writeLine = (controller: ReadableStreamDefaultController<Uint8Array>, obj: unknown) => {
      controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
    };

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        void (async () => {
          writeLine(controller, { type: "status", status: "generating" });
          try {
            const prompt = buildMeetingSummaryPrompt(input.text);
            const result = streamText({
              model: ai(selectedModel),
              messages: [
                { role: "system", content: system },
                { role: "user", content: prompt },
              ],
              temperature: 0.2,
              abortSignal: c.req.raw.signal,
            });

            let raw = "";
            for await (const delta of result.textStream) {
              raw += delta;
              writeLine(controller, { type: "delta", delta });
            }

            writeLine(controller, { type: "status", status: "finalizing" });

            const stripped = stripHtmlFromModelOutput(raw);
            let html = ensureFullHtmlDocument(stripped);
            const validation = validateGeneratedHtml(html);

            if (!validation.ok) {
              writeLine(controller, { type: "status", status: "repairing" });
              const { text: repaired } = await generateText({
                model: ai(selectedModel),
                messages: [
                  { role: "system", content: system },
                  { role: "user", content: prompt },
                  { role: "assistant", content: stripped },
                  { role: "user", content: `上面的输出不符合要求（${validation.reason}）。请修复并仅输出完整 HTML。` },
                ],
                temperature: 0.1,
                abortSignal: c.req.raw.signal,
              });

              html = ensureFullHtmlDocument(stripHtmlFromModelOutput(repaired));
              const validation2 = validateGeneratedHtml(html);
              if (!validation2.ok) {
                writeLine(controller, { type: "error", error: "模型输出不符合 HTML 格式，请重试" });
                controller.close();
                return;
              }
            }

            const id = crypto.randomUUID();
            const key = `examples/meeting-summary/${id}.html`;
            await writeFile(key, html, "text/html; charset=utf-8");

            const historyItem = await saveMeetingSummaryHistoryItem({
              userId,
              id,
              origin,
              inputText: input.text,
              html,
              model: selectedModel,
            });

            writeLine(controller, { type: "done", result: historyItem });
          } catch (error) {
            const message = error instanceof Error ? error.message : "生成失败";
            writeLine(controller, { type: "error", error: message });
          } finally {
            controller.close();
          }
        })();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
      },
    });
  })
  .post("/", appDailyQuota(), appGlobalDailyQuota(), async (c) => {
    const userId = c.get("user")?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    if (!process.env.AI_API_KEY) {
      return c.json({ error: "AI 服务未配置" }, 500);
    }

    let body: Body;
    try {
      body = await c.req.json<Body>();
    } catch {
      return c.json({ error: "请求格式错误" }, 400);
    }

    const input = validateInput(body);
    if (!input.ok) return c.json({ error: input.error }, 400);

    const selectedModel = isAllowedModel(body.model) ? body.model : defaultModel;
    const prompt = buildMeetingSummaryPrompt(input.text);

    const { text: rawHtml } = await generateText({
      model: ai(selectedModel),
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const stripped = stripHtmlFromModelOutput(rawHtml);
    let html = ensureFullHtmlDocument(stripped);
    const validation = validateGeneratedHtml(html);

    if (!validation.ok) {
      const { text: repaired } = await generateText({
        model: ai(selectedModel),
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
          { role: "assistant", content: stripped },
          { role: "user", content: `上面的输出不符合要求（${validation.reason}）。请修复并仅输出完整 HTML。` },
        ],
        temperature: 0.1,
      });

      html = ensureFullHtmlDocument(stripHtmlFromModelOutput(repaired));
      const validation2 = validateGeneratedHtml(html);
      if (!validation2.ok) {
        return c.json({ error: "模型输出不符合 HTML 格式，请重试" }, 502);
      }
    }

    const id = crypto.randomUUID();
    const key = `examples/meeting-summary/${id}.html`;
    await writeFile(key, html, "text/html; charset=utf-8");
    const origin = new URL(c.req.url).origin;

    const historyItem = await saveMeetingSummaryHistoryItem({
      userId,
      id,
      origin,
      inputText: input.text,
      html,
      model: selectedModel,
    });

    return c.json({ ...historyItem, storagePublicUrl: getPublicUrl(key) });
  });
