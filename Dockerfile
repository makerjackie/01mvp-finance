# 多阶段构建：Bun 安装 + 编译，Node 运行 standalone

FROM node:22-bullseye AS base
WORKDIR /app

# 安装 Bun（用于安装&构建），从官方镜像拷贝二进制避免线上 curl 脚本
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# ---------- 依赖阶段 ----------
FROM base AS deps
COPY package.json bun.lockb ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --ignore-scripts # skip postinstall; prisma schema not copied yet

# 生成 Prisma Client（使用当前仓库的 schema）
COPY src/server/prisma ./src/server/prisma
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
    bun x prisma generate --schema=src/server/prisma/schema.prisma # dummy url satisfies prisma config

# ---------- 构建阶段 ----------
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/server/prisma ./src/server/prisma
COPY . .

RUN --mount=type=cache,target=/app/.next/cache \
    NEXT_TELEMETRY_DISABLED=1 \
    bun run build

# ---------- 运行阶段 ----------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 运行期需要 openssl（Prisma）与健康检查依赖
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates wget \
 && rm -rf /var/lib/apt/lists/*

# 非 root 用户
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/src/server/prisma ./src/server/prisma

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
