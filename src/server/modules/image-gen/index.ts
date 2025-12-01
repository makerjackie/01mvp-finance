import { Hono } from "hono";
import type { AspectRatio, Resolution } from "./types";

const imageGenRoutes = new Hono();

interface GenerateImageRequest {
  prompt: string;
  referenceImages?: string[];
  aspectRatio: AspectRatio;
  resolution: Resolution;
  apiKey?: string;
  baseUrl?: string;
  useCustomKey?: boolean;
}

const MODEL_NAME = "gemini-3-pro-image-preview";

/**
 * 302.ai 图片生成响应格式配置
 *
 * 支持两种返回格式:
 * 1. URL 格式 (response_format=url) - 推荐
 *    - 优点: 响应体小(~2KB),传输快,适合实时预览
 *    - 缺点: 图片存储在 302.ai,可能有时效性
 *    - 返回: { candidates[0].content.parts[].url: "https://file.302.ai/..." }
 *
 * 2. Base64 格式 (不带 response_format 参数或 response_format=b64_json)
 *    - 优点: 图片数据在响应中,不依赖外部存储,可直接保存到自己服务器
 *    - 缺点: 响应体大(可能>1MB),传输慢,可能超出响应大小限制
 *    - 返回: { candidates[0].content.parts[].inlineData: { mimeType, data } }
 *
 * 当前配置: 使用 URL 格式 (更适合快速预览场景)
 * 如需切换到 Base64 格式: 将下面的 USE_URL_FORMAT 改为 false
 */
const USE_URL_FORMAT = true;

/**
 * Google Gemini 原版 API vs 302.ai API 对比
 *
 * 302.ai API 优势:
 * - 支持 response_format=url 返回 CDN 链接,响应更快
 * - 支持传入 image_url 进行图片编辑(待实现)
 * - 国内访问速度更快
 *
 * Google 原版 API:
 * - 官方接口,更稳定可靠
 * - 只支持 inlineData (base64) 格式
 * - 需要科学上网
 *
 * 建议:
 * - 生产环境使用 302.ai (速度快,功能多)
 * - 如果需要图片长期存储,考虑使用 base64 格式并上传到自己的对象存储
 */

imageGenRoutes.post("/generate", async (c) => {
  try {
    const body = await c.req.json<GenerateImageRequest>();
    const { prompt, referenceImages, aspectRatio, resolution, apiKey, baseUrl, useCustomKey } = body;

    if (!prompt && (!referenceImages || referenceImages.length === 0)) {
      return c.json({ error: "Prompt or reference images are required" }, 400);
    }

    // 决定使用哪个 API Key 和 Base URL
    let finalApiKey: string;
    let finalBaseUrl: string;
    let use302Format = false;

    if (useCustomKey && apiKey) {
      // 使用用户自定义的 API Key
      finalApiKey = apiKey.trim();
      finalBaseUrl = baseUrl?.trim() || "https://generativelanguage.googleapis.com";
    } else {
      // 使用后端环境变量中的 API Key
      finalApiKey = process.env.GEMINI_IMAGE_API_KEY || "";
      finalBaseUrl = process.env.GEMINI_IMAGE_API_ENDPOINT || "https://api.302.ai";
      use302Format = true; // 后端默认使用 302.ai 格式

      if (!finalApiKey) {
        return c.json(
          {
            error: "Backend API key not configured. Please use custom API key.",
            needCustomKey: true,
          },
          400,
        );
      }
    }

    // 构建请求 URL
    let url: string;
    let headers: Record<string, string>;

    if (use302Format) {
      // 302.ai 格式
      // 注意: 302.ai 支持 response_format 参数来控制返回格式
      // - response_format=url: 返回 CDN 链接 (推荐,响应快)
      // - response_format=b64_json 或不传: 返回 base64 数据
      const responseFormat = USE_URL_FORMAT ? "?response_format=url" : "";
      url = `${finalBaseUrl}/google/v1/models/${MODEL_NAME}${responseFormat}`;
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${finalApiKey}`,
      };
    } else {
      // Google 原版格式 (只支持 base64)
      url = `${finalBaseUrl}/v1beta/models/${MODEL_NAME}:generateContent?key=${finalApiKey}`;
      headers = {
        "Content-Type": "application/json",
      };
    }

    // 构建请求体
    const parts: any[] = [];

    if (referenceImages && referenceImages.length > 0) {
      for (const img of referenceImages) {
        const matches = img.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }
    }

    parts.push({ text: prompt });

    const payload = {
      contents: [
        {
          parts: parts,
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspect_ratio: aspectRatio,
        },
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API Error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        errorMessage += ` - ${errorText.substring(0, 100)}`;
      }
      return c.json({ error: errorMessage }, response.status >= 500 ? 500 : 400);
    }

    const data = await response.json();

    // === 响应格式处理 ===
    // 302.ai 和 Google 原版 API 的响应格式说明:
    //
    // 1. 302.ai URL 格式 (response_format=url):
    //    理论返回: { output: "https://..." }
    //    实际返回: { candidates[0].content.parts[{ url: "https://..." }] }
    //
    // 2. 302.ai Base64 格式 (不带 response_format):
    //    返回: { candidates[0].content.parts[{ inlineData: { mimeType, data } }] }
    //
    // 3. Google 原版格式:
    //    返回: { candidates[0].content.parts[{ inlineData: { mimeType, data } }] }

    // 尝试处理 302.ai 理论格式 (实际很少返回这种格式)
    if (use302Format && data.output) {
      return c.json({
        url: data.output,
      });
    }

    // 处理通用格式 (302.ai 和 Google 原版都使用 candidates 结构)
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        // 跳过思考过程文本 (302.ai 会返回 thought: true 的文本)
        if (part.thought === true) {
          continue;
        }

        // 302.ai URL 格式: { url: "https://file.302.ai/..." }
        if (part.url) {
          return c.json({
            url: part.url,
          });
        }

        // Base64 格式: { inlineData: { mimeType: "image/png", data: "..." } }
        // 302.ai 和 Google 原版都支持此格式
        if (part.inlineData && part.inlineData.data) {
          return c.json({
            url: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`,
          });
        }
      }
    }

    // 未找到图片数据,记录响应以便调试
    console.error("No image data found in response:", JSON.stringify(data).substring(0, 500));
    return c.json({ error: "No image data found in response" }, 500);
  } catch (error) {
    console.error("Image generation error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      500,
    );
  }
});

export default imageGenRoutes;
