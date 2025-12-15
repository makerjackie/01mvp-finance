import { Prisma } from "@/server/prisma/generated/prisma/client";
import { Message, UIMessage } from "ai";
import { prisma } from "./db";

type PersistableMessage = Message | UIMessage;

type NormalizedMessage = {
  role: PersistableMessage["role"];
  parts: UIMessage["parts"];
  content: string;
  clientId?: string;
};

const truncate = (text: string, max = 80) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const partsToPlainText = (parts: UIMessage["parts"]) =>
  parts
    .map((part) => {
      if (part.type === "text") return part.text;
      if (part.type === "reasoning") return part.reasoning;
      return "";
    })
    .filter(Boolean)
    .join(" ")
    .trim();

const toParts = (message: PersistableMessage): UIMessage["parts"] => {
  const withParts = message as UIMessage;
  if (Array.isArray(withParts.parts) && withParts.parts.length > 0) return withParts.parts;

  const content = (message as Message).content;
  if (typeof content === "string") return [{ type: "text", text: content }];

  if (Array.isArray(content)) {
    return (content as Array<Record<string, unknown>>).map((part) => {
      const type = (part as { type?: string }).type;
      if (type === "text") {
        const textValue = (part as { text?: unknown }).text;
        return { type: "text", text: typeof textValue === "string" ? textValue : String(textValue ?? "") };
      }
      if (type === "reasoning") {
        const reasoningPart = part as {
          reasoning?: string;
          details?: Array<{ type: "text"; text: string; signature?: string } | { type: "redacted"; data: string }>;
        };
        const details = Array.isArray(reasoningPart.details) ? reasoningPart.details : [];
        return { type: "reasoning", reasoning: reasoningPart.reasoning ?? "", details };
      }
      return { type: "text", text: typeof part === "string" ? part : JSON.stringify(part) };
    });
  }

  return [];
};

const normalizeMessages = (messages: PersistableMessage[]): NormalizedMessage[] =>
  messages.map((message) => {
    const parts = toParts(message);
    return {
      role: message.role,
      parts,
      content: partsToPlainText(parts),
      clientId: (message as UIMessage).id,
    };
  });

const parseStoredParts = (parts: Prisma.JsonValue | null): UIMessage["parts"] => {
  if (!parts) return [];
  if (Array.isArray(parts)) return parts as UIMessage["parts"];

  try {
    return JSON.parse(String(parts)) as UIMessage["parts"];
  } catch {
    return [];
  }
};

export async function saveChatHistory({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: PersistableMessage[];
  userId?: string | null;
}) {
  if (!messages.length) return;

  const normalized = normalizeMessages(messages);
  const lastTwo = normalized.slice(-2);
  if (lastTwo.length === 0) return;

  const firstUserMessage = normalized.find((msg) => msg.role === "user");

  const session = await prisma.chatSession.upsert({
    where: { id },
    update: userId ? { userId } : {},
    create: {
      id,
      userId: userId ?? undefined,
      title: truncate(firstUserMessage?.content ?? "新的对话"),
    },
  });

  await prisma.chatMessage.createMany({
    data: lastTwo.map((message) => ({
      sessionId: session.id,
      userId: userId ?? undefined,
      role: message.role,
      content: message.content,
      parts: message.parts as Prisma.InputJsonValue,
      clientId: message.clientId,
    })),
    skipDuplicates: true,
  });
}

export async function listChatSessions(userId?: string | null) {
  const where = userId === undefined ? undefined : userId === null ? { userId: null } : { userId };

  const sessions = await prisma.chatSession.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return sessions.map((session) => {
    const lastMessage = session.messages[0];
    const parts = lastMessage ? parseStoredParts(lastMessage.parts) : [];

    return {
      id: session.id,
      title: session.title ?? "新的对话",
      updatedAt: session.updatedAt,
      lastMessage: lastMessage
        ? {
            content: lastMessage.content || partsToPlainText(parts),
          }
        : null,
    };
  });
}

export async function getChatSessionMessages(id: string, userId?: string | null) {
  const where = userId === undefined ? { id } : userId === null ? { id, userId: null } : { id, userId };

  const session = await prisma.chatSession.findFirst({
    where,
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) return null;

  const messages: UIMessage[] = session.messages.map((message) => {
    const parts = parseStoredParts(message.parts);
    const content = message.content || partsToPlainText(parts);

    return {
      id: message.clientId ?? message.id,
      role: message.role as UIMessage["role"],
      content,
      parts,
    };
  });

  return { session, messages };
}
