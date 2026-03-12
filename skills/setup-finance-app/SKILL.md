---
name: setup-finance-app
description: 引导新用户一步步克隆、配置、启动和部署 01mvp-finance 财务应用
version: 1.0.0
author: Jackie Xiao
tags: [onboarding, setup, deployment, finance]
---

# 01MVP Finance 应用设置向导

这个 skill 会引导你完成从零开始设置、运行和部署 01mvp-finance 应用的全过程。

## 前置要求检查

在开始之前，请确保你已经准备好以下内容：

### 1. 开发环境
- **Node.js**（推荐 v18 或更高版本）
- **pnpm**（包管理器）

### 2. GitHub 访问权限
- GitHub 账号
- 对 `jackiexiao/01mvp-finance` 仓库的访问权限
- 能够推送代码到该仓库

### 3. 环境变量文件
- 需要从 Jackie 获取 `.env.local` 文件
- 该文件包含数据库密钥等部署所需的敏感信息

---

## 设置步骤

### 步骤 1: 检查环境

首先，让我检查你的开发环境是否已经准备好：

```bash
# 检查 Node.js
node --version

# 检查 pnpm
pnpm --version

# 检查 GitHub CLI
gh --version
```

如果缺少任何工具，我会指导你安装。

### 步骤 2: 克隆项目

使用 GitHub CLI 克隆项目：

```bash
gh repo clone jackiexiao/01mvp-finance
cd 01mvp-finance
```

**注意**：如果这是你第一次使用 GitHub CLI，可能需要先登录：
```bash
gh auth login
```

### 步骤 3: 安装依赖

```bash
pnpm install
```

### 步骤 4: 配置环境变量

1. 确认你已经从 Jackie 那里获取了 `.env.local` 文件
2. 将该文件放在项目根目录下
3. 验证文件内容（不要泄露敏感信息）

```bash
# 检查文件是否存在
ls -la .env.local
```

### 步骤 5: 设置数据库

```bash
# 生成 Prisma 客户端
pnpm run db:generate

# 推送数据库 schema
pnpm run db:push
```

### 步骤 6: 启动开发服务器

```bash
pnpm run dev
```

服务器启动后，访问 `http://localhost:3000` 查看应用。

---

## 开发工作流

### 进行代码修改

1. 在 AI 编辑器中打开项目
2. 根据需求修改代码
3. 保存文件后，开发服务器会自动热重载

### 提交和推送代码

```bash
# 查看修改
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "描述你的修改"

# 推送到 GitHub
git push
```

### 自动部署

代码推送到 GitHub 后，会自动部署到：
**https://ops.hacksonweekly.com**

---

## 常用命令参考

```bash
# 开发
pnpm run dev          # 启动开发服务器
pnpm run build        # 生产构建
pnpm run lint         # 代码检查
pnpm run typecheck    # 类型检查
pnpm run format       # 代码格式化

# 数据库
pnpm run db:generate  # 生成 Prisma 客户端
pnpm run db:push      # 推送 schema 到数据库
pnpm run db:studio    # 打开 Prisma Studio

# Cloudflare 部署
pnpm run cf:build     # 构建 Cloudflare Pages 版本
pnpm run cf:preview   # 本地预览
pnpm run cf:deploy    # 手动部署到 Cloudflare
```

---

## 交互式设置流程

当用户调用这个 skill 时，我会：

1. **检查当前目录**：确认用户是否已经在项目目录中
2. **环境检查**：验证 Node.js、pnpm、GitHub CLI 是否已安装
3. **克隆项目**（如果需要）：使用 `gh repo clone` 克隆仓库
4. **安装依赖**：运行 `pnpm install`
5. **环境变量检查**：确认 `.env.local` 文件是否存在
6. **数据库设置**：运行 Prisma 命令
7. **启动服务器**：运行 `pnpm run dev`
8. **提供后续指导**：告诉用户如何修改代码和部署

每一步都会等待用户确认或处理错误，确保新手能够顺利完成整个流程。

---

## 故障排除

### 问题：GitHub CLI 未登录
```bash
gh auth login
```

### 问题：pnpm 未安装
```bash
npm install -g pnpm
```

### 问题：数据库连接失败
- 检查 `.env.local` 中的 `DATABASE_URL` 是否正确
- 确认数据库服务是否运行

### 问题：端口被占用
```bash
# 查找占用 3000 端口的进程
lsof -ti:3000

# 杀死该进程
kill -9 $(lsof -ti:3000)
```

---

## 获取帮助

如果遇到问题：
1. 查看项目的 `CLAUDE.md` 文件了解更多技术细节
2. 查看 `README.md` 了解项目概述
3. 联系 Jackie 获取支持
