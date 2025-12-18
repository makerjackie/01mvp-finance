import fs from "node:fs/promises";
import path from "node:path";
import { getPublicUrl, listFiles, readFile, useS3, writeFile } from "@/server/lib/storage";

export type MeetingSummaryHistoryItem = {
  id: string;
  title: string;
  createdAt: string; // ISO string
  model?: string;
  url: string; // /examples/meeting-summary/:id
  absoluteUrl: string;
  storageKey: string; // examples/meeting-summary/:id.html
  storagePublicUrl: string | null;
  inputPreview: string;
};

const STORAGE_ROOT = process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");
const historyPrefix = (userId: string) => `examples/meeting-summary/history/${userId}`;
const historyKey = (userId: string, id: string) => `${historyPrefix(userId)}/${id}.json`;

const safeTitleFromHtml = (html: string) => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]?.trim()) return titleMatch[1].trim().slice(0, 120);

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]?.trim()) {
    return h1Match[1]
      .replace(/<[^>]+>/g, "")
      .trim()
      .slice(0, 120);
  }

  return "会议纪要总结";
};

const previewFromText = (text: string) => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > 160 ? `${cleaned.slice(0, 160)}...` : cleaned;
};

export async function saveMeetingSummaryHistoryItem({
  userId,
  id,
  origin,
  inputText,
  html,
  model,
}: {
  userId: string;
  id: string;
  origin: string;
  inputText: string;
  html: string;
  model?: string;
}) {
  const storageKey = `examples/meeting-summary/${id}.html`;
  const url = `/examples/meeting-summary/${id}`;
  const absoluteUrl = new URL(url, origin).toString();

  const item: MeetingSummaryHistoryItem = {
    id,
    title: safeTitleFromHtml(html),
    createdAt: new Date().toISOString(),
    model,
    url,
    absoluteUrl,
    storageKey,
    storagePublicUrl: getPublicUrl(storageKey),
    inputPreview: previewFromText(inputText),
  };

  await writeFile(historyKey(userId, id), JSON.stringify(item, null, 2), "application/json; charset=utf-8");
  return item;
}

const listLocalHistoryKeys = async (userId: string) => {
  const prefix = historyPrefix(userId);
  const dirPath = path.join(STORAGE_ROOT, prefix);
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => path.posix.join(prefix, entry.name));
  } catch {
    return [];
  }
};

export async function listMeetingSummaryHistory(userId: string): Promise<MeetingSummaryHistoryItem[]> {
  const prefix = `${historyPrefix(userId)}/`;
  const keys = useS3 ? await listFiles(prefix) : await listLocalHistoryKeys(userId);

  const items = await Promise.all(
    keys
      .filter((key) => key.endsWith(".json"))
      .map(async (key) => {
        try {
          const raw = await readFile(key);
          return JSON.parse(raw) as MeetingSummaryHistoryItem;
        } catch {
          return null;
        }
      }),
  );

  const filtered = items.filter((item): item is MeetingSummaryHistoryItem => item !== null);
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
