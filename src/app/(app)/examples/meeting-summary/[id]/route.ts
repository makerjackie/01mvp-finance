import { readFile } from "@/server/lib/storage";

export const runtime = "nodejs";

type Params = {
  id: string;
};

const isSafeId = (id: string) => /^[a-f0-9-]{36}$/i.test(id);

export async function GET(_req: Request, ctx: { params: Params | Promise<Params> }) {
  const { id } = await Promise.resolve(ctx.params);

  if (!isSafeId(id)) {
    return new Response("Not Found", { status: 404 });
  }

  const key = `examples/meeting-summary/${id}.html`;

  try {
    const html = await readFile(key);
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
