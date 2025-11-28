# 01MVP 全局 UI 设计规范 (v2.0)

## 1. 核心设计理念 (Core Philosophy)

**"Hybrid App Shell" (混合应用外壳)**

我们采用 **"营销页 (Marketing) + 应用页 (App)"** 分离的布局策略，同时在应用内采用 **"移动端优先 + 桌面端增强"** 的响应式导航体系。

*   **风格关键词**：Professional (专业), Minimalist (极简), Card-Based (卡片式), Native-Like (原生感)。
*   **技术栈**：Next.js (App Router), Tailwind CSS, shadcn/ui, Lucide Icons.

---

## 2. 导航架构 (Navigation Architecture)

### A. 营销/落地页布局 (Marketing Layout)
*   **适用页面**：`/` (首页), `/pricing`, `/blog`
*   **导航**：传统的 **Top Nav (顶部导航栏)**。
    *   左侧：Logo。
    *   中间：产品链接。
    *   右侧：登录/注册按钮 (CTA)。
*   **页脚**：完整的 Footer。

### B. 应用/功能页布局 (App Layout)
*   **适用页面**：`/dashboard`, `/chat`, `/me`, `/features` 等所有登录后页面。
*   **核心逻辑**：

| 区域 | 桌面端 (Desktop, lg+) | 移动端 (Mobile, <lg) |
| :--- | :--- | :--- |
| **Sidebar (侧边栏)** | **常驻左侧** (w-64)。<br>包含：Logo、主导航、历史记录、用户菜单(底部)。 | **默认隐藏**。<br>通过左上角汉堡菜单呼出 **Drawer (抽屉)**。<br>内容与桌面端一致。 |
| **Top Nav (顶部栏)** | **极简模式**。<br>仅显示：面包屑 (Breadcrumbs) / 页面标题。<br>右侧：通知、帮助。 | **标准模式**。<br>左侧：汉堡菜单。<br>中间：Logo/标题。<br>右侧：头像/通知。 |
| **Tab Bar (底栏)** | **隐藏**。<br>功能由 Sidebar 承载。 | **常驻底部 (Floating)**。<br>悬浮胶囊样式。<br>仅放 3-4 个最高频入口 (Chat, Home, Me)。 |

---

## 3. UI 组件规范 (Component Specs)

### 颜色系统 (Colors)
*   **背景**：
    *   App 背景：`bg-gray-50/50` (Light), `bg-neutral-950` (Dark)。
    *   Sidebar/Card 背景：`bg-white` (Light), `bg-neutral-900` (Dark)。
*   **边框**：统一使用 `border-border/40` 或 `border-border/60`，避免过重的 `border-gray-200`。
*   **主色**：`primary` (通常为黑/白反色)，用于高亮按钮和选中状态。

### 卡片 (Cards)
*   **圆角**：统一使用 `rounded-xl` (小卡片) 或 `rounded-2xl` (大容器)。
*   **阴影**：极简风格，使用 `shadow-sm`，悬浮时 `hover:shadow-md`。
*   **边框**：所有卡片必须有细边框 `border border-border/50`。

### 交互反馈 (Micro-Interactions)
*   **可点击元素**：所有 Card、Button、ListItem 在点击时应有反馈。
    *   `active:scale-[0.98]` (轻微缩放)。
    *   `transition-all duration-200` (平滑过渡)。

---

## 4. AI 开发提示词 (System Prompt)

当要求 AI (Cursor, v0, Claude) 生成新页面时，请附带以下指令：

```markdown
# Role
UI/UX Expert specializing in Next.js & shadcn/ui.

# Context
We are building a "Hybrid App Shell" AI tool.
- **Layout**: The page is wrapped in an `AppLayout` (Sidebar on Desktop, TabBar on Mobile).
- **Style**: "Linear-like" minimalism. Clean, whitespace-heavy, border-based hierarchy.

# Requirements for New Page
1. **Header**: Do NOT create a full TopNav. Use a simple sticky header with a title or breadcrumbs if needed.
2. **Content Container**: 
   - Max-width: `max-w-5xl` (Desktop), `w-full` (Mobile).
   - Padding: `px-4 py-6` (Mobile), `px-8 py-8` (Desktop).
3. **Components**:
   - Use `shadcn/ui` components (`Card`, `Button`, `Avatar`, `Badge`, `Separator`).
   - Use `lucide-react` icons.
4. **Mobile Optimization**:
   - Ensure touch targets are at least 44px.
   - Bottom padding `pb-24` to account for the floating TabBar.
```
