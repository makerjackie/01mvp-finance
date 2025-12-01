# AI 图片生成 API 配置说明

## 响应格式配置

API 支持两种返回格式,可在 `src/server/modules/image-gen/index.ts` 中通过 `USE_URL_FORMAT` 常量配置。

### 1. URL 格式 (推荐,默认)

```typescript
const USE_URL_FORMAT = true;
```

**优点**:
- 响应体小 (~2KB)
- 传输速度快
- 适合实时预览场景
- 节省服务器带宽

**缺点**:
- 图片存储在 302.ai CDN
- 可能有时效性 (建议用户下载保存)

**返回格式**: `{ url: "https://file.302.ai/gpt/imgs/..." }`

**使用场景**:
- 快速原型开发
- 实时预览
- 对图片持久性要求不高
- 希望节省服务器带宽

---

### 2. Base64 格式

```typescript
const USE_URL_FORMAT = false;
```

**优点**:
- 图片数据直接在响应中
- 不依赖外部 CDN 存储
- 可以立即保存到自己的对象存储 (S3/OSS 等)
- 图片永久有效

**缺点**:
- 响应体大 (通常 >1MB)
- 传输速度慢
- 可能超出某些环境的响应大小限制

**返回格式**: `{ url: "data:image/png;base64,iVBORw0KG..." }`

**使用场景**:
- 需要图片长期存储
- 不希望依赖第三方 CDN
- 有自己的对象存储服务

---

## API 选择: 302.ai vs Google 原版

### 302.ai API (推荐,默认)

**优势**:
- ✅ 支持 `response_format=url` 返回 CDN 链接
- ✅ 支持 `response_format=b64_json` 返回 base64
- ✅ 支持传入 `image_url` 进行图片编辑 (未来可实现)
- ✅ 国内访问速度快,无需科学上网
- ✅ 价格相对便宜

**配置** (`.env.local`):
```bash
GEMINI_IMAGE_API_ENDPOINT=https://api.302.ai
GEMINI_IMAGE_API_KEY=sk-xxx
```

**适用场景**:
- 国内用户
- 快速开发和原型验证
- 对成本敏感的项目

---

### Google 原版 API

**优势**:
- ✅ 官方接口,稳定性更高
- ✅ 数据隐私保护更好
- ✅ Google 生态集成

**劣势**:
- ❌ 只支持 base64 格式,响应体大
- ❌ 需要科学上网
- ❌ 国内访问速度慢
- ❌ 价格相对较高

**配置** (用户自定义):
```
API Key: AIzaSy...
Base URL: https://generativelanguage.googleapis.com
```

**适用场景**:
- 对稳定性要求极高
- 已有 Google Cloud 账号和科学上网
- 对数据隐私有特殊要求

---

## 推荐配置

### 开发环境
- **API**: 302.ai
- **格式**: URL 格式 (`USE_URL_FORMAT = true`)
- **原因**: 快速迭代,节省带宽

### 生产环境 (方案一: 快速预览)
- **API**: 302.ai
- **格式**: URL 格式 (`USE_URL_FORMAT = true`)
- **额外处理**:
  - 前端提供下载按钮供用户保存
  - 可选:后台异步下载到自己的对象存储

### 生产环境 (方案二: 自有存储)
- **API**: 302.ai
- **格式**: Base64 格式 (`USE_URL_FORMAT = false`)
- **额外处理**:
  - 后端接收到 base64 后上传到 S3/OSS
  - 返回自己的 CDN 链接给前端

---

## 切换指南

### 切换响应格式

编辑 `src/server/modules/image-gen/index.ts`:

```typescript
// URL 格式 (推荐)
const USE_URL_FORMAT = true;

// Base64 格式
// const USE_URL_FORMAT = false;
```

### 切换 API 服务商

**使用 302.ai** (后端配置):
```bash
# .env.local
GEMINI_IMAGE_API_ENDPOINT=https://api.302.ai
GEMINI_IMAGE_API_KEY=sk-xxx
```

**使用 Google 原版** (用户自定义):
- 前端页面中输入自定义 API Key
- Base URL: `https://generativelanguage.googleapis.com`
- API Key: `AIzaSy...`

---

## 302.ai 特殊功能 (待实现)

### 图片编辑功能

302.ai 支持传入 `image_url` 参数对现有图片进行编辑:

```typescript
// 未来可实现的功能
const payload = {
  contents: [{
    parts: [
      { image_url: "https://example.com/image.png" },
      { text: "将这张图片改成赛博朋克风格" }
    ]
  }],
  // ...
};
```

**使用场景**:
- 图片风格转换
- 图片修复和增强
- 基于现有图片的再创作

---

## FAQ

### Q: URL 格式的图片会过期吗?
A: 302.ai 的 CDN 链接目前没有明确的过期时间,但建议用户及时下载保存重要图片。

### Q: 如何将 base64 图片上传到自己的对象存储?
A: 参考 `src/server/lib/storage.ts` 中的 S3 上传示例:

```typescript
const buffer = Buffer.from(base64Data, 'base64');
await uploadToS3(buffer, 'images/generated.png');
```

### Q: 为什么选择 URL 格式而不是 base64?
A: 对于实时预览场景,URL 格式响应速度快 10-20 倍,用户体验更好。如果需要持久化,可以后台异步处理。

### Q: 可以混用 302.ai 和 Google 原版吗?
A: 可以。用户可以在前端选择使用后端的 302.ai API 或自己的 Google API Key。
