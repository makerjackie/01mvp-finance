# Drop - 免登录上传的静态页面托管

- 像 Netlify Drop：拖拽 HTML/ZIP 立刻生成可分享的 `/p/{slug}` 页面，带文件浏览、在线编辑与素材拖拽上传。
- 仅展示自己上传的内容（管理员可见全部），单个文件 ≤ 20MB，违规内容会被下架。
- 当前为内测版本，数据与链接可能随时清理；管理员后台（Better Auth + Prisma）可屏蔽/恢复页面；普通上传无需登录。

## 技术栈与约定

- 前端：Next.js App Router、Tailwind v4（变量式 tokens）、SWR。
- 后端：Hono（`/api` 前缀）、Better Auth（用户名+密码）、Prisma（PostgreSQL）。
- 客户端工具：类型安全的 Hono 客户端 `lib/api-client.ts`，认证客户端 `lib/auth-client.ts`。
- UI：轻量组件在 `components/ui`，文案/站点配置集中在 `lib/config/site.ts`。
- 主题：默认浅色，可在 `app/layout.tsx` 的 `defaultTheme` 切换。

## 存储

- 默认将上传的文件写入本地 `storage/sites`；设置 `S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET` 时会自动改用 S3/MinIO（路径前缀为 `slug/`）。部署时请为 `storage` 挂载持久卷或提供 S3。

## 目录速览

- `app/`：页面（`(login)` 登录注册，`dashboard` 私有示例，根目录为落地页）。
- `components/`：UI 与业务组件（登录、退出、私有路由示例）。
- `lib/`：配置、auth 客户端、API 客户端、工具函数。
- `server/`：Hono 路由、Better Auth 配置、Prisma schema（`server/prisma`）。
- `public/`：静态资源。
- `Dockerfile`：多阶段，Bun 构建 + Node 运行 `.next/standalone`。

## 环境准备

1) 安装 Bun（或 Node 18+，仍推荐 Bun 跑命令）。  
2) 复制环境变量并填写：
   ```bash
   cp .env.example .env.local
   ```
   必填/常用：
   - `DATABASE_URL`：Postgres 连接串。
   - `BETTER_AUTH_SECRET`：随机字符串。
   - `BETTER_AUTH_URL` / `NEXT_PUBLIC_API_URL`：本地默认 `http://localhost:3000`。

## 本地启动

```bash
bun install
bun run db:generate        # 生成 Prisma Client
bun run db:push            # 同步 schema
bun dev                    # 启动开发，默认 3000 端口
```

- 登录体验：使用「用户名 + 密码」注册/登录。前端会自动把用户名转换为 `用户名@local` 传给 Better Auth，不需要真实邮箱。
- 注册后跳转 `/dashboard`，私有接口示例在 `components/privateRoute.tsx`。

## 常见开发任务

- 修改站点文案/链接：`lib/config/site.ts`
- 调整主题模式：`app/layout.tsx` 中 `defaultTheme`
- 调整色板：`app/globals.css` 的 CSS 变量
- 调用 API：直接用 `lib/api-client.ts`（Hono 生成的 typed client）；示例见 `components/privateRoute.tsx`
- 认证调用：`lib/auth-client.ts`，表单实现见 `components/login.tsx`
- Lint：`bun run lint`

## 代码质量

- 使用 Biome：`bun run format` 自动格式化，`bun run format:check` 在 pre-commit 钩子与 CI 中检查。
- `bun run lint`（ESLint）、`bun run typecheck`、`bun run build` 均在 CI 流程执行，建议本地修改前先跑一遍。

## API 路由说明

- 入口：`/api`（Hono）
  - `/api/auth/*`：Better Auth handler（前端通过 `authClient` 调）。
  - `/api/private`：受保护示例，带 middleware 校验 session。
  - `/api/health`：健康检查。

## 前后端如何串起来

- 前端通过 `lib/auth-client.ts` 完成登录/注册/退出；表单在 `components/login.tsx`。
- 受保护的数据请求：`components/privateRoute.tsx` 用 SWR + `lib/api-client.ts`。
- 登录态：Better Auth 用 cookie 维护，middleware 在 `server/middleware.ts` 读取 session。

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

- Dockerfile 采用多阶段：Bun 安装依赖与构建，最终镜像使用 `node:22-slim` 运行 `.next/standalone`（standalone 模式），非 root 用户，带基础健康检查。
- 健康检查路径：`/api/health`（已在 `server/index.ts` 添加）。
- 部署时确保同样的环境变量（`DATABASE_URL`、`BETTER_AUTH_SECRET`、`NEXT_PUBLIC_API_URL`）。

## CNB 构建流水线（.cnb.yml）

- CNB 平台自动构建并推送镜像到 `${CNB_DOCKER_REGISTRY:-cnb.cool}`；`main` 分支产出 `:latest`，`v*` 标签使用对应 tag，其余分支使用分支名作为 tag。
- 构建前会尝试加载 `.env.build`，但默认仓库不包含该文件；如无特殊编译期需求可忽略，不创建即可。需要时再手动创建（不提交）并写入 `NEXT_PUBLIC_SITE_URL`、`S3_ENDPOINT`、`S3_BUCKET` 等仅在构建阶段需要的变量。
- 如需推送到私有仓库，设置 `CNB_TRIGGER_USER` 与 `CNB_TRIGGER_TOKEN` 以完成 `docker login`，可通过 `CNB_REPO_SLUG_LOWERCASE` 或直接传入 `IMAGE_TAG` 自定义仓库/镜像名。
- 支持 buildx，如不存在则回退到普通 `docker build`。

## Docker Compose & Makefile 使用

- 生产部署使用 `docker-compose.prod.yml`：默认镜像 `docker.cnb.cool/01mvp/01mvp-nextjs-template:latest`，读取 `.env.production`，`HOST_PORT`（默认 3000）决定对外端口，`PLATFORM` 默认为 `linux/amd64`。
- 运行时环境变量（S3 访问参数、域名/站点 URL 等）应放在 `.env.production` 或通过 `docker compose -f docker-compose.prod.yml ... --env-file ...` 注入，以便随时变更而无需重新构建镜像；构建阶段只需覆盖确实需要 bake-in 的值。
- 服务器快速拉起示例：
  ```bash
  HOST_PORT=3000 IMAGE=docker.cnb.cool/01mvp/01mvp-nextjs-template:v1.0.0 docker compose -f docker-compose.prod.yml up -d
  docker compose -f docker-compose.prod.yml logs -f app
  ```
- `Makefile` 封装了本地与生产命令：`make dev/build/clean`，`make up/down/logs/shell/restart/ps` 管理本地 compose；`make release TAG=v1.2.0` 构建并推送镜像（使用 `IMAGE_NAME`、`REGISTRY`、`PLATFORM`）；`make deploy TAG=v1.2.0` 拉起生产 compose；`make prod-logs`/`make prod-shell` 便于运维。
- 可通过环境变量或参数覆盖 `IMAGE_NAME`、`IMAGE_TAG`、`REGISTRY`、`HOST_PORT`、`PLATFORM` 等值，例如 `make release TAG=v1.2.0 IMAGE_NAME=foo REGISTRY=registry.example.com/bar`。

## 常见问题

- 登录 401：确认已在同一域名下访问（cookie 生效），并已在前端注册一个账号。
- 500/数据库错误：检查 `DATABASE_URL` 是否指向 PostgreSQL，Prisma Client 是否生成（`bun run db:generate`）。
- Lint 报错：运行 `bun run lint` 只检查 `app/components/lib/server`，`.next` 已忽略。
- 健康检查失败：确认 `/api/health` 可通，容器内端口为 3000。

## 想要自定义

- 换主题：调整 `globals.css` 的色值或在 `ThemeProvider` 切换默认主题。
- 改导航/CTA/描述：编辑 `lib/config/site.ts`，落地页自动读取。
- 加社交登录：在 Better Auth 配置中追加相应 provider，前端表单可复用。
