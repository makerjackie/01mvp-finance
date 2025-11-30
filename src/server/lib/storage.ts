import fs from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

// 存储配置
const STORAGE_ROOT = process.env.STORAGE_ROOT ?? path.join(process.cwd(), "storage");

const S3_BUCKET = process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
export const useS3 = Boolean(S3_BUCKET && S3_ENDPOINT && S3_ACCESS_KEY && S3_SECRET_KEY);

const s3Client = useS3
  ? new S3Client({
      endpoint: S3_ENDPOINT?.startsWith("http") ? S3_ENDPOINT : `https://${S3_ENDPOINT}`,
      region: process.env.S3_REGION ?? "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: S3_ACCESS_KEY as string,
        secretAccessKey: S3_SECRET_KEY as string,
      },
    })
  : null;

// 辅助函数
const ensureDir = async (dir: string) => {
  if (!useS3) {
    await fs.mkdir(dir, { recursive: true });
  }
};

const readBodyToBuffer = async (body: unknown) => {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === "function") {
    const arr = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(arr);
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

/**
 * 写入文件
 */
export const writeFile = async (key: string, content: string | Buffer, contentType?: string) => {
  if (useS3 && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: typeof content === "string" ? Buffer.from(content) : content,
        ContentType: contentType ?? "application/octet-stream",
      }),
    );
    return;
  }
  const filePath = path.join(STORAGE_ROOT, key);
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content);
};

/**
 * 读取文件（文本）
 */
export const readFile = async (key: string): Promise<string> => {
  if (useS3 && s3Client) {
    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }),
    );
    const buffer = await readBodyToBuffer(res.Body);
    return buffer.toString("utf8");
  }
  const filePath = path.join(STORAGE_ROOT, key);
  return fs.readFile(filePath, "utf8");
};

/**
 * 读取文件（二进制）
 */
export const readBinary = async (key: string): Promise<Buffer> => {
  if (useS3 && s3Client) {
    const res = await s3Client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }),
    );
    return readBodyToBuffer(res.Body);
  }
  const filePath = path.join(STORAGE_ROOT, key);
  return fs.readFile(filePath);
};

/**
 * 删除文件
 */
export const deleteFile = async (key: string) => {
  if (useS3 && s3Client) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }),
    );
    return;
  }
  const filePath = path.join(STORAGE_ROOT, key);
  await fs.unlink(filePath).catch(() => {});
};

/**
 * 列出目录下的文件
 */
export const listFiles = async (prefix: string): Promise<string[]> => {
  if (useS3 && s3Client) {
    const objects: string[] = [];
    let continuationToken: string | undefined;
    do {
      const res = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: S3_BUCKET,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      continuationToken = res.NextContinuationToken;
      if (res.Contents) {
        objects.push(...res.Contents.map((obj) => obj.Key ?? "").filter(Boolean));
      }
    } while (continuationToken);
    return objects;
  }

  const dirPath = path.join(STORAGE_ROOT, prefix);
  try {
    const entries = await fs.readdir(dirPath, { recursive: true, withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(prefix, entry.parentPath?.replace(dirPath, "") ?? "", entry.name));
  } catch {
    return [];
  }
};

/**
 * 检查文件是否存在
 */
export const fileExists = async (key: string): Promise<boolean> => {
  if (useS3 && s3Client) {
    try {
      await s3Client.send(
        new GetObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
  const filePath = path.join(STORAGE_ROOT, key);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * 获取文件的公开访问 URL
 */
export const getPublicUrl = (key: string): string | null => {
  if (useS3) {
    if (process.env.S3_PUBLIC_DOMAIN) {
      // Remove trailing slash from domain if present
      const domain = process.env.S3_PUBLIC_DOMAIN.replace(/\/$/, "");
      return `${domain}/${key}`;
    }
    // Fallback: construct URL from endpoint and bucket
    // Note: This assumes the endpoint is accessible publicly.
    const endpoint = S3_ENDPOINT?.startsWith("http") ? S3_ENDPOINT : `https://${S3_ENDPOINT}`;
    // Using path style as default since forcePathStyle is true in client config
    return `${endpoint}/${S3_BUCKET}/${key}`;
  }
  return null;
};
