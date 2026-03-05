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

### C. Top Nav / Tabbar 显隐策略与间距
* **保留场景**：主导航/可切换入口（仪表盘、聊天列表、功能中心、个人中心）。这些页面需要快速跳转，保留 Top Nav（面包屑/标题）+ 移动端 Tabbar。
* **隐藏场景**：需要沉浸或关键操作的单任务流（支付/授权、扫码、全屏预览、数字名片预览、地图、表单签名、绑定手机号、全屏对话模式）。隐藏 Top Nav 和 Tabbar，确保不被遮挡。
* **沉浸式导航 (Immersive Nav)**：
  * **适用场景**：详情页、内容浏览页（如活动详情、文章阅读）。
  * **布局**：
    *   左侧：返回按钮 (Back Button) + 标题 (Title)。
    *   右侧：功能操作区 (Actions)，如“关注”、“分享”、“更多”。
  *   **交互**：点击返回按钮回退上一页；右侧按钮触发上下文相关操作。
* **顶部选项卡 (Top Tabs)**：
  * **适用场景**：复杂详情页需展示多维度信息（如活动详情页包含：活动信息、参与者、项目信息）。
  * **位置**：位于 Top Nav 下方，吸顶或随页面滚动。
  * **样式**：Segmented Control 或 Underline Tabs。
* **聊天/设置类页面**：
  * 聊天列表：保留 Top Nav + Tabbar；单聊详情：保留 Top Nav，隐藏全局 Tabbar（底部只留输入区，避免与键盘/Tabbar 竞争）。
  * 设置/用户资料编辑：保留 Top Nav（标题/返回），隐藏 Tabbar（设置是深层任务）。
  * 数字名片：编辑态保留 Top Nav、隐藏 Tabbar；预览态全屏隐藏两者，并提供轻扫/点击唤起导航的手势或按钮。
* **间距规范**：内容容器默认 `padding-top`=Top Nav 高度+`env(safe-area-inset-top)`，`padding-bottom`=Tabbar 高度+`env(safe-area-inset-bottom)`。滚动区 `overflow-auto`；浮动按钮需在内容流内放置并留出 Tabbar 高度。
* **实现方式（当前代码）**：
  * 营销页：`src/app/(marketing)/layout.tsx` 内统一挂载 `TopNav`。
  * 应用页：`src/app/(app)/layout.tsx` 内统一挂载 `AppHeader`（Top Nav）+ `MobileTabbar`；`MobileTabbar` 已在登录/注册路径下自动隐藏。
  * 登录/注册：`src/app/(login)/layout.tsx` 无 Top Nav/Tabbar，天然全屏。
  * **隐藏 Tabbar**：在 `MobileTabbar` 组件中检查当前路径，若在黑名单（如 `/chat`, `/example-ui/*`）中则不渲染。
  * **沉浸式导航**：在页面组件中使用自定义 Header 替代默认 `AppHeader`，或在 `AppHeader` 中根据路由动态切换模式。

### D. 功能中心与 Example UI 响应式策略（移动优先，桌面增强）
* **功能中心（/features）**：作为总览入口，顶部 Tabs 区分“核心功能 / UI 演示”；移动端保持单列网格，`md+` 保持左右留白与 2 列起的栅格。
* **沉浸式导航示例（immersive-nav）**：移动端维持全屏沉浸；`md+` 可加 72-96px 的窄侧 Rail 放锚点/章节，高亮与滚动同步，避免喧宾夺主。
* **复杂标签示例（complex-tabs）**：Tabs 是主导航，默认不叠加 Sidebar；`md+` 仅做排版增强（内容区更宽、左右留白、Tabs 吸顶）。如内容极长再考虑镜像 Sidebar，但需与 Tabs 共用同一数据源和高亮状态。
* **桌面端细节（轻量改动）**：
  * 容器：移动端基础样式不改；`md/ lg` 叠加 `max-w-5xl~6xl`、`px-6~8`、更大的段落间距。
  * 导航：`md+` 可使用 `sticky` Tabs/Nav（`top` 根据 Header 高度预留）；Hover/Focus 态适当增强。
  * 锚点：长内容加 `id` 与 `scroll-margin-top`，配合 Sidebar/Rail 平滑滚动。
* **实现建议**：提取 `ExampleLayout`/`LayoutShell` 组件，包含容器宽度、内边距、可选 Sidebar Slot。页面仅传入导航数据与内容，避免重复样式散落。

### E. 财务提交页优先级（`/finance/submit`）
* **核心入口排序**：提交类型/申请类型的第一位固定为 **报销**，并作为默认选项（在业务允许时）。
* **快捷入口排序**：财务相关入口按使用频率排序，首位展示“报销申请”，其余入口再按业务优先级补充。
* **降低决策成本**：报销入口使用高辨识度图标与明确文案，用户应可在 1 次点击内进入报销提交流程。

---

## 3. UI 组件规范 (Component Specs)

### 字体系统 (Typography)
为提升移动端可读性，默认字体基线升级为 **16px**，采用当前主流移动端信息密度：

| 文本层级 | 推荐字号/行高（Mobile） | 建议字重 | Tailwind |
| :--- | :--- | :--- | :--- |
| 页面主标题（H1） | 24 / 32 | 700 | `text-2xl leading-8` |
| 区块标题（H2） | 20 / 28 | 600 | `text-xl leading-7` |
| 卡片标题（H3） | 18 / 26 | 600 | `text-lg leading-7` |
| 正文（Body） | 16 / 24 | 400 | `text-base leading-6` |
| 次级正文（Secondary） | 14 / 22 | 400 | `text-sm leading-6` |
| 按钮/输入/主导航文案 | 16 / 24 | 500 | `text-base leading-6` |
| 说明/注释（Caption） | 12 / 18 | 400 | `text-xs leading-5` |

* **移动端下限**：正文不低于 `14px`，默认使用 `16px`；仅注释类信息使用 `12px`。
* **表单可用性**：`input/select/textarea` 字号不低于 `16px`（避免 iOS 自动放大）。
* **层级比例**：标题与正文保持约 `1.125 ~ 1.25` 的缩放梯度，避免“满屏小字”或层级断裂。

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
   - Use `text-base` (16px) as the default body/input font size on mobile.
   - Bottom padding `pb-24` to account for the floating TabBar.
```

---

## 5. 示例页实现与可维护性最佳实践

* **单一数据源驱动导航**：Tabs 与 Sidebar/Rail 并存时，共享同一 `items` 数据与高亮状态，避免双重导航分叉。
* **组件化布局**：用可复用的 `ExampleLayout`/`PageContainer` 管理 `max-width`、padding、gap、sticky header/rail；示例页面仅提供插槽内容。
* **响应式叠加思路**：先写移动端样式，再在 `md/ lg` 断点用少量类名/媒体查询叠加，不重写一套桌面样式。
* **低侵入增强**：桌面端只做留白、吸顶、Hover/Focus 提示，不额外引入复杂动画或脚本，确保移动端一致性。
* **可访问性与性能**：保留 `role="tablist"`、`aria-selected`、键盘导航；滚动锚点使用原生行为，避免多重监听器影响性能。
