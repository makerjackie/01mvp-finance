import { Hono } from "hono";
import { auth } from "@/server/lib/auth";
import { writeFile, readBinary, fileExists } from "@/server/lib/storage";
import path from "path";
import { nanoid } from "nanoid";

const app = new Hono()
  .post("/", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
        return c.json({ error: "Invalid file type. Only images are allowed." }, 400);
    }
    
    // Max size check (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return c.json({ error: "File too large (max 5MB)" }, 400);
    }

    const extension = path.extname(file.name) || ".jpg";
    const filename = `${nanoid()}${extension}`;
    const buffer = await file.arrayBuffer();

    await writeFile(filename, Buffer.from(buffer));

    return c.json({
      url: `/api/uploads/${filename}`,
    });
  })
  .get("/:filename", async (c) => {
    const filename = c.req.param("filename");
    
    // Basic security check
    if (filename.includes("..") || filename.includes("/")) {
        return c.json({ error: "Invalid filename" }, 400);
    }

    if (await fileExists(filename)) {
      const buffer = await readBinary(filename);
      const arrayBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer;
      
      let contentType = "application/octet-stream";
      const ext = path.extname(filename).toLowerCase();
      if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".gif") contentType = "image/gif";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".svg") contentType = "image/svg+xml";

      return c.body(arrayBuffer, 200, { "Content-Type": contentType });
    }

    return c.json({ error: "File not found" }, 404);
  });

export default app;

