export const meetingSummaryPromptTemplate = `

## 角色
你是一位精通飞书 (Lark) 设计系统的资深 UI/UX 设计师。你的目标是生成一个专业、美观、符合飞书 AI 自动摘要美学的会议纪要 HTML 页面。

## 纪要内容原则 (核心)
- 言简意赅：用最精炼的语言总结，避免冗长。
- 完整覆盖：在精炼的同时，确保不遗漏任何核心决策、重点问题或行动项。

## UI 样式规范 (核心要求)
1. 布局控制: 必须适配 16:9 的屏幕比例，固定宽高以确保在一个屏幕内呈现全部内容，绝对不能出现滚动条。
2. 色彩方案: 
    - 页面底色：#F9FAFB (极浅灰)。
    - 卡片背景：纯白 #FFFFFF。
    - 品牌色：飞书蓝 (#3370FF)、警告红 (#F54A45)、紫色 (#7E45F5)、橙黄色 (#FFB11B)。
3. 字体排版: 使用系统默认无衬线字体 (苹方、微软雅黑)。标题：20px-24px 加粗；正文：14px；列表：13px。
4. 核心组件:
    - 标题栏: 大标题加粗 + 下方灰色副标题。
    - 核心板块 (动态栅格布局): 
        - 外层容器：每个板块是一个带圆角的背景卡片，背景色为对应主题色的极淡色（如淡蓝、淡橘），且顶部必须带有一条 4px 的主题色实心边框。
        - 板块头部：左侧显示彩色图标 + 标题，右侧显示小尺寸浅色背景标签。
        - 内层嵌套卡片：内容区应嵌套在一个纯白色圆角背景卡片中，与外层背景形成对比。
        - 中间分隔：内容内部使用浅灰色虚线分隔符 (border-top: 1px dashed #E5E6EB)。
    - 标签样式: 圆角矩形，边框与背景色同色系（深色文字 + 5% 透明度背景）。
    - 底部总结: 使用浅黄色背景 (#FFF7E8) 的全宽 Banner，带紫色星星图标，内容加粗显示。
5. 细节质感: 
    - 圆角大小固定为 8px-12px。
    - 不使用投影 (Box-shadow)，保持扁平清爽。
    - 使用 CSS Flexbox 或 Grid 进行精准对齐。

## 内容驱动布局 (非刻板)
- 自由排版：不要死板固定为 3 个模块。请根据会议内容的复杂度自适应选择 1-3 列排版。
- 语义聚类：AI 应根据会议内容的逻辑关系自动合并或分拆模块，重点是确保内容简明扼要，直观突出重点。
- 16:9 适配：无论模块多少，最终必须通过调整间距和比例，确保在 16:9 的视觉容器内完美呈现。

## 结构参考 (AI 自由发挥)
- 会议标题 & 副标题
- 核心讨论内容 (动态生成 1-N 个主题板块)
- 核心结论 (底部总结 Banner)

## 输出要求
- 输出单个 HTML 文件（含 CSS）。
- 不使用任何外部库（如 Tailwind/Bootstrap）。
- 代码必须是现代化的 CSS 布局。
- 确保内容在 16:9 的容器内自适应。
- 会议纪要言简意赅，保证不遗漏重要内容
`;

export const buildMeetingSummaryPrompt = (meetingText: string) => {
  return [
    "请基于用户提供的会议文字纪要，提炼会议信息并生成一个“可直接公开访问”的单文件 HTML 页面（包含 <style> 内联样式）。",
    "输出必须是“完整 HTML 文档”：必须包含 <!doctype html>、<html>、<head>、<meta charset>、<meta viewport>、<body>，并以 </html> 结束。",
    "严禁输出 Markdown 代码块（不要 ```），严禁输出任何解释文字，只能输出 HTML 源码本身。",
    "不要引用外部资源（不要外链 CSS/JS/图片）。不要包含任何 <script>。",
    "第一行必须以：<!doctype html> 开头。",
    "若纪要信息不足，请合理补全，但要保持克制，优先从原文提炼；可用“待确认”标注不确定项。",
    "",
    meetingSummaryPromptTemplate.trim(),
    "",
    "以下为会议文字纪要原文：",
    meetingText.trim(),
  ].join("\n");
};

export const stripHtmlFromModelOutput = (raw: string) => {
  const text = raw.trim();

  const fenceMatch = text.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const htmlStart = text.search(/<!doctype\s+html|<html[\s>]/i);
  if (htmlStart >= 0) {
    return text.slice(htmlStart).trim();
  }

  return text;
};

const extractStyleTags = (fragment: string) => {
  const styles: string[] = [];
  const rest = fragment.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (m) => {
    styles.push(m);
    return "";
  });
  return { styles, rest: rest.trim() };
};

export const ensureFullHtmlDocument = (maybeHtml: string) => {
  const input = maybeHtml.trim();
  if (!input) return input;

  if (/<html[\s>]/i.test(input)) {
    if (/<!doctype\s+html/i.test(input)) return input;
    return `<!doctype html>\n${input}`;
  }

  const { styles, rest } = extractStyleTags(input);
  const headExtra = styles.length ? `\n${styles.join("\n")}\n` : "\n";
  const bodyContent = rest || input;

  return [
    "<!doctype html>",
    '<html lang="zh-CN">',
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  ${headExtra.trimEnd().split("\n").join("\n  ").trimEnd()}`,
    "</head>",
    "<body>",
    bodyContent,
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
};

export const validateGeneratedHtml = (html: string) => {
  const text = html.trim();
  if (!text) return { ok: false as const, reason: "empty" };
  if (!/<!doctype\s+html/i.test(text)) return { ok: false as const, reason: "missing doctype" };
  if (!/<html[\s>]/i.test(text) || !/<\/html>/i.test(text)) return { ok: false as const, reason: "missing html tag" };
  if (!/<body[\s>]/i.test(text) || !/<\/body>/i.test(text)) return { ok: false as const, reason: "missing body tag" };
  if (/<script[\s>]/i.test(text)) return { ok: false as const, reason: "contains script" };
  return { ok: true as const };
};
