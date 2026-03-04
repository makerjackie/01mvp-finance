import { Hono } from "hono";
import { auth } from "@/server/lib/auth";
import { writeFile, getPublicUrl } from "@/server/lib/storage";
import crypto from "crypto";

const app = new Hono();

// 上传文件
app.post("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return c.json({ error: "未选择文件" }, 400);
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "文件大小不能超过10MB" }, 400);
    }

    // 验证文件类型
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "不支持的文件类型" }, 400);
    }

    // 生成唯一文件名
    const ext = file.name.split(".").pop();
    const hash = crypto.randomBytes(16).toString("hex");
    const key = `finance/${session.user.id}/${hash}.${ext}`;

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());

    // 保存文件
    await writeFile(key, buffer, file.type);

    // 获取访问URL
    const url = getPublicUrl(key) || `/api/uploads/${key}`;

    return c.json({
      success: true,
      data: {
        key,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "上传失败" }, 500);
  }
});

export default app;
