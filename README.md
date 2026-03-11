# 社区财务系统

基于 Next.js + Hono + Better Auth + Prisma 的社区财务管理系统。

当前定位：
- 核心业务：财务申请、审核、统计（`/finance`）
- 基础通用功能保留：AI 对话、AI 生图、文件上传等能力（按需使用）

## 主要功能

- 财务申请：收入登记、支出申请、我的记录。
- 财务审核：管理员审核、备注、统计（收入/支出/余额）。
- 认证体系：短信验证码 + 用户名密码登录。
- 基础工具：AI 对话、AI 生图、文件上传。

## 技术栈

- 前端：Next.js App Router + Tailwind CSS
- 后端：Hono（`/api`）
- 认证：Better Auth
- 数据库：Prisma + PostgreSQL

## 快速开始

### 新手完整设置指南

如果你是第一次设置这个项目，推荐使用我们的 AI 设置向导：

```bash
# 安装 skill（在任意目录）
npx skills add Jackiexiao/01mvp-finance

# 在 AI 编辑器中调用
/setup-finance-app
```

这个 skill 会引导你完成：
1. 环境检查（Node.js、pnpm、GitHub CLI）
2. 克隆项目
3. 安装依赖
4. 配置环境变量
5. 数据库设置
6. 启动开发服务器

**前置要求**：
- Node.js 和 pnpm
- GitHub 账号（有仓库访问权限）
- AI 编辑器（推荐 Claude Code 或 Cursor）
- `.env.local` 文件（联系 Jackie 获取）

### 快速启动（已克隆项目）

```bash
pnpm install
pnpm run db:generate
pnpm run db:push
pnpm dev
```

本地访问：`http://localhost:3000`

## 常用命令

- `pnpm dev`：开发环境
- `pnpm run build`：构建
- `pnpm start`：生产启动
- `pnpm run lint`：代码检查
- `pnpm run typecheck`：类型检查
- `pnpm run format`：格式化

## 关键路由

- 财务系统：`/finance`
- 财务接口：`/api/finance/*`
- 认证接口：`/api/auth/*`
- 通用工具：`/chat`、`/ai-image`、`/upload`

## 环境变量

先复制：

```bash
cp .env.example .env.local
```

至少需要：
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `NEXT_PUBLIC_SITE_URL`

可选能力（启用对应功能时配置）：
- AI：`AI_API_ENDPOINT`、`AI_API_KEY`、`AI_MODEL`
- 短信：`TENCENT_*`
- 存储：`S3_*`


## 文档

- 财务功能说明：`FINANCE_README.md`
