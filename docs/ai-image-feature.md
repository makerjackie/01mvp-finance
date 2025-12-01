# AI 图片生成功能

## 功能概述

基于 Giga-Peach 代码实现的 nano bana AI 生图功能，使用 Google Gemini 3 Pro Image Preview 模型进行图片生成。

## 技术架构

### 后端 API
- **路径**: `/api/image-gen/generate`
- **位置**: `src/server/modules/image-gen/`
- **模型**: `gemini-3-pro-image-preview`
- **功能**:
  - 支持文本提示词生成
  - 支持参考图片 (最多6张)
  - 支持多种画面比例
  - 支持 1K/2K/4K 分辨率

### 前端页面
- **路径**: `/ai-image`
- **位置**: `src/app/(app)/ai-image/page.tsx`
- **功能**:
  - 批量生成 (支持多比例、多数量)
  - 风格预设 (水彩、赛博朋克、动漫、写实、极简等)
  - 参考图片上传
  - 历史记录管理
  - 图片灯箱查看
  - 本地存储 API Key

## 使用方法

1. **设置 API Key**
   - 访问 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取 API Key
   - 在页面底部输入框中输入 API Key (自动保存到 localStorage)

2. **生成图片**
   - 输入提示词描述想要生成的图片
   - (可选) 上传参考图片
   - (可选) 选择风格预设
   - (可选) 调整生成参数:
     - 画面比例: 1:1, 4:5, 3:4, 2:3, 9:16, 5:4, 4:3, 3:2, 16:9, 21:9
     - 分辨率: 1K, 2K, 4K
     - 图片数量: 1-8张
   - 点击"生成"按钮

3. **查看结果**
   - 生成的图片会按批次和比例分组显示
   - 点击图片可以在灯箱模式中查看
   - 支持下载图片

## 导航集成

### 桌面端
- 在侧边栏的"核心功能"分组中添加了"AI 生图"菜单项
- 图标: 📷 (ImageIcon)

### 移动端
- 在底部 Tabbar 中添加了"生图"按钮
- 替换了原来的"功能"按钮

## 配置文件

修改的配置文件:
- `src/server/index.ts` - 注册图片生成 API 路由
- `src/components/app-sidebar.tsx` - 添加桌面端导航项
- `src/components/mobile-tabbar.tsx` - 添加移动端导航项
- `src/lib/config/navigation.ts` - 配置沉浸式页面

## 特性

- ✅ 批量生成多个比例的图片
- ✅ 支持参考图片引导生成
- ✅ 内置多种风格预设
- ✅ 实时生成进度显示
- ✅ 错误处理和提示
- ✅ 响应式设计 (支持移动端和桌面端)
- ✅ 沉浸式全屏体验
- ✅ API Key 本地存储

## 参考

本功能参考了 [Giga-Peach](https://github.com/CocoSgt/Giga-Peach) 项目的设计和实现。
