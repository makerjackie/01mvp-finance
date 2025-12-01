# Docker 部署 SSL 错误修复

## 问题描述

在通过 Docker 部署应用时，遇到以下错误：

```
TypeError: fetch failed
  [cause]: [Error: SSL routines:tls_get_more_records:packet length too long:
  ] {
    library: 'SSL routines',
    reason: 'packet length too long',
    code: 'ERR_SSL_PACKET_LENGTH_TOO_LONG'
  }
```

## 根本原因

在 Docker 容器内部，应用程序使用 `BETTER_AUTH_URL=https://nextjs-template.01mvp.cn` 来构建 better-auth 的 `baseURL`。

当 better-auth 在容器内部调用自己的 API 端点时（如 `/api/auth/*`），它会尝试使用 HTTPS 连接到 `https://nextjs-template.01mvp.cn/api/auth`，但实际上：

1. 容器内部的 Next.js 应用只监听 HTTP (端口 3000)
2. SSL/TLS 终止发生在 Caddy（反向代理）层
3. 尝试用 HTTPS 协议连接 HTTP 服务 → SSL 错误

## 架构说明

```
客户端 
  ↓ HTTPS
Caddy (SSL终止)
  ↓ HTTP
Docker 容器 (Next.js on :3000)
  ↓ 内部调用应使用 HTTP
自身 API
```

## 解决方案

引入新的环境变量 `BETTER_AUTH_INTERNAL_URL`：

### 1. 修改 `src/server/lib/auth.ts`

```typescript
// Docker 容器内部应使用内部 URL，避免 SSL 错误
// BETTER_AUTH_INTERNAL_URL 用于容器内部调用（http://localhost:3000）
// BETTER_AUTH_URL 用于外部访问和客户端重定向（https://your-domain.com）
const authOrigin =
  parseOrigin(process.env.BETTER_AUTH_INTERNAL_URL) ||
  parseOrigin(process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:3000";
```

### 2. 更新 `docker-compose.prod.yml`

```yaml
environment:
  NODE_ENV: production
  PORT: 3000
  # 容器内部使用 HTTP，避免 SSL 错误
  BETTER_AUTH_INTERNAL_URL: http://localhost:3000
```

### 3. `.env.production` 配置

```bash
# 外部访问 URL（用于客户端重定向和 CORS）
BETTER_AUTH_URL=https://nextjs-template.01mvp.cn
NEXT_PUBLIC_API_URL=https://nextjs-template.01mvp.cn

# 内部调用会自动使用 docker-compose.prod.yml 中设置的
# BETTER_AUTH_INTERNAL_URL=http://localhost:3000
```

**注意**：不需要在 `.env.production` 中设置 `BETTER_AUTH_INTERNAL_URL`，因为它已经在 `docker-compose.prod.yml` 中硬编码了。

## 环境变量优先级

1. **BETTER_AUTH_INTERNAL_URL**：容器内部 API 调用（优先级最高）
2. **BETTER_AUTH_URL**：外部访问地址
3. **NEXT_PUBLIC_API_URL**：备用外部地址
4. **默认值**：`http://localhost:3000`

## 部署步骤

1. 确保代码已更新
2. 重新构建并推送镜像：
   ```bash
   make release TAG=v1.0.1
   ```

3. 部署到生产环境：
   ```bash
   make deploy TAG=v1.0.1
   ```

4. 验证服务正常：
   ```bash
   make prod-logs
   ```

## 验证

部署后，检查日志应该不再出现 SSL 错误：

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

应用应该正常响应，better-auth 的所有功能（登录、注册等）都能正常工作。
