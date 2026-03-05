import { NextRequest, NextResponse } from "next/server";
import { readBinary } from "@/server/lib/storage";

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await context.params;
    if (
      segments.length === 0 ||
      segments.some(
        (segment) => !segment || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\"),
      )
    ) {
      return new NextResponse("Invalid file path", { status: 400 });
    }

    const filePath = segments.join("/");
    const buffer = await readBinary(filePath);

    // 根据文件扩展名设置Content-Type
    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

    const bytes = Uint8Array.from(buffer);
    const body = new Blob([bytes]);

    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File read error:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
