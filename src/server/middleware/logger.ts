import type { Context, Next } from "hono";
import { consola, type ConsolaInstance } from "consola";

const isDev = process.env.NODE_ENV !== "production";

const serializeError = (error: Error) => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
  ...Object.fromEntries(Object.entries(error)),
});

const jsonReplacer = (_key: string, value: unknown) => {
  if (value instanceof Error) {
    return serializeError(value);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

const normalizeLogArgs = (args: unknown[]) => {
  const messages: string[] = [];
  const payloads: unknown[] = [];

  for (const arg of args) {
    if (typeof arg === "string" || typeof arg === "number" || typeof arg === "boolean") {
      messages.push(String(arg));
    } else if (arg instanceof Error) {
      messages.push(`${arg.name}: ${arg.message}`);
      payloads.push(serializeError(arg));
    } else if (arg !== undefined) {
      payloads.push(arg);
    }
  }

  const payload = payloads.length === 0 ? undefined : payloads.length === 1 ? payloads[0] : payloads;

  const message =
    messages.length > 0
      ? messages.join(" ")
      : payload !== undefined
        ? (() => {
            try {
              return JSON.stringify(payload, jsonReplacer);
            } catch {
              return String(payload);
            }
          })()
        : "";

  return { message, payload };
};

/**
 * Consola logger 实例
 * - 开发环境：漂亮的彩色输出
 * - 生产环境：JSON 格式输出
 */
export const logger: ConsolaInstance = consola.create({
  level: isDev ? 4 : 3, // debug:4, info:3, warn:2, error:1
  formatOptions: {
    date: true,
    colors: isDev,
  },
  reporters: isDev
    ? undefined
    : [
        {
          log: (logObj) => {
            // 生产环境输出 JSON 格式，并序列化对象参数
            const { message, payload } = normalizeLogArgs(logObj.args ?? []);
            const output = JSON.stringify(
              {
                timestamp: new Date().toISOString(),
                level: logObj.type,
                message,
                ...(payload !== undefined ? { data: payload } : {}),
                ...(logObj.tag ? { tag: logObj.tag } : {}),
              },
              jsonReplacer,
            );
            console.log(output);
          },
        },
      ],
});

/**
 * Hono 请求日志中间件
 */
export function requestLogger() {
  return async (c: Context, next: Next) => {
    const start = Date.now();

    await next();

    // 跳过健康检查日志
    if (c.req.path === "/api/health") {
      return;
    }

    const duration = Date.now() - start;
    const status = c.res.status;

    const logData = {
      method: c.req.method,
      path: c.req.path,
      status,
      duration: `${duration}ms`,
    };

    if (status >= 500) {
      logger.error(logData);
    } else if (status >= 400) {
      logger.warn(logData);
    } else if (isDev) {
      logger.info(logData);
    }
  };
}

// 类型声明
declare module "hono" {
  interface ContextVariableMap {
    logger: ConsolaInstance;
  }
}
