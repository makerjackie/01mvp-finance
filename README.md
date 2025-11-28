# 01mvp Next.js Template

开箱即用的 Next.js + Hono + Better Auth + Prisma 模板，内置短信验证码/用户名密码登录、AI 对话示例、S3/本地存储封装，支持 Bun/Node 运行与 Docker standalone 部署。

## 功能亮点

- 认证：Better Auth（短信 OTP、用户名+密码、2FA、组织/管理员插件）。
- API：Hono `/api` 路由 + `lib/api-client.ts` 类型安全客户端。
- AI：OpenAI 兼容接口流式对话示例 `/api/chat` + `app/chat`。
- 存储：本地 `storage` 目录或 S3 兼容存储（MinIO/Sealos/OSS 等）。
- DevOps：Biome + ESLint + typecheck + CI hooks，Docker multi-stage & CNB 管道。
- UI/配置：Tailwind v4 tokens，组件在 `components/ui`，文案集中 `lib/config/site.ts`。

## 技术栈与约定

- 前端：Next.js App Router、Tailwind v4、SWR。
- 后端：Hono（`/api` 前缀）、Better Auth、Prisma（PostgreSQL）。
- 客户端工具：`lib/api-client.ts`（typed Hono client）、`lib/auth-client.ts`。
- 主题：默认浅色，可在 `app/layout.tsx` 的 `defaultTheme` 切换。

## 目录速览

- `app/`：页面（`(login)` 登录注册，`dashboard` 私有示例，`chat` AI 对话，根目录为落地页）。
- `components/`：UI 与业务组件（登录、私有路由示例等）。
- `lib/`：配置、auth 客户端、API 客户端、工具函数。
- `server/`：Hono 路由、Better Auth 配置、Prisma schema（`server/prisma`）、存储与 AI/SMS 封装。
- `public/`：静态资源。
- `Dockerfile`：多阶段，Bun 构建 + Node 运行 `.next/standalone`。

## 环境变量

```bash
cp .env.example .env.local
```

- `DATABASE_URL`：Postgres 连接串。  
- `BETTER_AUTH_SECRET`：随机字符串。  
- `BETTER_AUTH_URL` / `NEXT_PUBLIC_API_URL`：本地默认 `http://localhost:3000`。  
- AI：`AI_API_ENDPOINT`、`AI_API_KEY`、`AI_MODEL`（允许 `deepseek-chat` / `gpt-4o-mini`）。  
- 短信登录：`TENCENT_*`（见 `.env.example`），未配置时改用用户名密码登录。  
- 存储：`S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET/S3_REGION`（留空则使用本地 `storage` 目录）。  
- 其他：`LOG_LEVEL`、`PLUNK_API_KEY` 等。

## 本地开发

```bash
bun install
bun run db:generate        # 生成 Prisma Client
bun run db:push            # 同步 schema
bun dev                    # http://localhost:3000
```

- 登录体验：默认短信验证码登录（需要 `TENCENT_*`），也可切换“密码登录”；用户名会自动转成 `{username}@local.test` 注册。  
- 注册成功跳转 `/dashboard`，私有接口示例在 `components/privateRoute.tsx`。

## API 路由

- `/api/auth/*`：Better Auth handler（`authClient` 调用）。
- `/api/chat`：AI 对话流式接口（OpenAI 兼容）。
- `/api/private`：受保护示例，middleware 校验 session。
- `/api/health`：健康检查。

## 前后端串接

- 认证：`lib/auth-client.ts` + `components/login.tsx`（短信/密码双模式）。  
- 数据：`lib/api-client.ts` 提供 typed fetch，示例见 `components/privateRoute.tsx`。  
- 登录态：Better Auth cookie，`server/middleware.ts` 读取 session。

## 常见开发任务

- 修改站点文案/链接：`lib/config/site.ts`
- 调整主题模式：`app/layout.tsx` 中 `defaultTheme`
- 调整色板：`app/globals.css` 的 CSS 变量
- 调用 API：直接用 `lib/api-client.ts`
- 认证调用：`lib/auth-client.ts`
- Lint：`bun run lint`

## 代码质量

- 使用 Biome：`bun run format` 自动格式化，`bun run format:check` 在 pre-commit 钩子与 CI 中检查。
- `bun run lint`（ESLint）、`bun run typecheck`、`bun run build` 均在 CI 流程执行，建议本地修改前先跑一遍。

## 构建与 Docker 部署（standalone）

1. 生产构建（本地）：
   ```bash
   bun run build
   ```
   构建后会生成 `.next/standalone` 与静态资源。

2. Docker 本地镜像：
   ```bash
   docker build -t 01mvp-nextjs-template-standalone .
   docker run -p 3000:3000 --env-file .env.production 01mvp-nextjs-template-standalone
   ```

- Dockerfile 采用多阶段：Bun 安装依赖与构建，最终镜像使用 `node:22-slim` 运行 `.next/standalone`，非 root 用户，带基础健康检查。
- 健康检查路径：`/api/health`。
- 部署时确保同样的环境变量（`DATABASE_URL`、`BETTER_AUTH_SECRET`、`NEXT_PUBLIC_API_URL`、`AI_API_KEY`、`TENCENT_*` 等）。

## CNB 构建流水线（.cnb.yml）

- CNB 平台自动构建并推送镜像到 `${CNB_DOCKER_REGISTRY:-cnb.cool}`；`main` 分支产出 `:latest`，`v*` 标签使用对应 tag，其余分支使用分支名作为 tag。
- 构建前会尝试加载 `.env.build`（默认不提供）；需在构建阶段注入变量时再本地创建（不提交），如 `NEXT_PUBLIC_SITE_URL`、`S3_ENDPOINT`、`S3_BUCKET` 等。
- 如需推送到私有仓库，设置 `CNB_TRIGGER_USER` 与 `CNB_TRIGGER_TOKEN` 以完成 `docker login`，可通过 `CNB_REPO_SLUG_LOWERCASE` 或直接传入 `IMAGE_TAG` 自定义仓库/镜像名。
- 支持 buildx，如不存在则回退到普通 `docker build`。

## Docker Compose & Makefile 使用

- 生产部署使用 `docker-compose.prod.yml`：默认镜像 `docker.cnb.cool/01mvp/01mvp-nextjs-template:latest`，读取 `.env.production`，`HOST_PORT`（默认 3000）决定对外端口，`PLATFORM` 默认为 `linux/amd64`。
- 运行时环境变量（S3 访问参数、域名/站点 URL 等）应放在 `.env.production` 或通过 `docker compose -f docker-compose.prod.yml ... --env-file ...` 注入，以便随时变更而无需重新构建镜像。
- 服务器快速拉起示例：
  ```bash
  HOST_PORT=3000 IMAGE=docker.cnb.cool/01mvp/01mvp-nextjs-template:v1.0.0 docker compose -f docker-compose.prod.yml up -d
  docker compose -f docker-compose.prod.yml logs -f app
  ```
- `Makefile` 封装本地与生产命令：`make dev/build/clean`，`make up/down/logs/shell/restart/ps` 管理本地 compose；`make release TAG=v1.2.0` 构建并推送镜像；`make deploy TAG=v1.2.0` 拉起生产 compose；`make prod-logs`/`make prod-shell` 便于运维。
- 可通过环境变量或参数覆盖 `IMAGE_NAME`、`IMAGE_TAG`、`REGISTRY`、`HOST_PORT`、`PLATFORM` 等，如 `make release TAG=v1.2.0 IMAGE_NAME=foo REGISTRY=registry.example.com/bar`。

## Cloudflare Pages 部署（可选）

> 适合纯前端或调用外部 API 的场景；项目内的 Prisma + PostgreSQL 依赖 Node 原生二进制，无法在 Cloudflare Pages Functions/Workers 上运行，完整功能仍建议保持 Docker/Node 部署。

- 先登录 Cloudflare：`wrangler login`，并在 Pages 控制台创建项目。
- 构建产物：`bun run cf:build`（基于 `@cloudflare/next-on-pages` 生成 `.vercel/output`）。
- 本地预览：`bun run cf:preview`（`wrangler pages dev .vercel/output/static`）。
- 部署上线：`bun run cf:deploy`（默认使用 `wrangler.toml` 的 `name`，可用 `-p <project>` 覆盖），在 Cloudflare Pages 设置好 `NEXT_PUBLIC_API_URL` 等环境变量。
- 此配置只增加 Cloudflare 选项，不影响现有 Docker 镜像/Compose 流程。

## 常见问题

- 短信收不到：确认 `TENCENT_*` 已配置，模板 ID、签名、短信 AppId 与手机号区号匹配。  
- 登录 401：确保同域访问（cookie 生效），并已注册账号；如仍不通，清理浏览器 cookie 重试。  
- AI 相关错误：检查 `AI_API_KEY`/`AI_API_ENDPOINT`/`AI_MODEL`，并确认模型在 `allowedModels` 白名单。  
- 数据库 500：确认 `DATABASE_URL` 指向 PostgreSQL，Prisma Client 已生成（`bun run db:generate`）。  
- Lint 报错：运行 `bun run lint`（只检查 `app/components/lib/server`，`.next` 已忽略）。
- 健康检查失败：确认 `/api/health` 可通，容器内端口为 3000。

## 想要自定义

- 换主题：调整 `app/globals.css` 的变量或在 `ThemeProvider` 切换默认主题。
- 改导航/CTA/描述：编辑 `lib/config/site.ts`。
- 调整认证策略：在 `server/lib/auth.ts` 增加/删除 Better Auth 插件，或改用其他短信服务。
- 扩展 API：在 `src/server/modules` 增加路由，更新 `lib/api-client.ts` 生成的 typed client。
