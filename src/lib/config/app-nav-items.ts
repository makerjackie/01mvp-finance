import {
  BarChart3,
  ClipboardList,
  ImageIcon,
  MessageSquare,
  PlusCircle,
  ScrollText,
  SlidersHorizontal,
  Settings,
  Settings2,
  ShieldCheck,
  Upload,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { canAccessAdmin } from "@/lib/rbac";

export type AppNavUser = { role?: string | null } | null | undefined;

export interface AppNavItem {
  key: string;
  title: string;
  href: string;
  activePath: string;
  icon: LucideIcon;
  children?: AppNavItem[];
}

const showAiSidebarItems = process.env.NEXT_PUBLIC_ENABLE_AI_SIDEBAR === "true";

const baseNavItems: AppNavItem[] = [
  {
    key: "finance-home",
    title: "财务主页",
    href: "/finance",
    activePath: "/finance",
    icon: Wallet,
  },
  {
    key: "finance-submit",
    title: "新建申请",
    href: "/finance/submit",
    activePath: "/finance/submit",
    icon: PlusCircle,
  },
  {
    key: "finance-records",
    title: "我的记录",
    href: "/finance/my-records",
    activePath: "/finance/my-records",
    icon: ClipboardList,
  },
  {
    key: "me",
    title: "账号资料",
    href: "/me",
    activePath: "/me",
    icon: Settings2,
  },
];

const aiNavItems: AppNavItem[] = [
  {
    key: "ai-chat",
    title: "AI 对话",
    href: "/chat",
    activePath: "/chat",
    icon: MessageSquare,
  },
  {
    key: "ai-image",
    title: "AI 生图",
    href: "/ai-image",
    activePath: "/ai-image",
    icon: ImageIcon,
  },
  {
    key: "upload",
    title: "文件上传",
    href: "/upload",
    activePath: "/upload",
    icon: Upload,
  },
];

const adminNavItems: AppNavItem[] = [
  {
    key: "admin",
    title: "管理员后台",
    href: "/finance/admin",
    activePath: "/finance/admin",
    icon: Settings,
    children: [
      {
        key: "admin-review",
        title: "审核后台",
        href: "/finance/admin",
        activePath: "/finance/admin",
        icon: ShieldCheck,
      },
      {
        key: "admin-stats",
        title: "数据统计",
        href: "/finance/admin/project-stats",
        activePath: "/finance/admin/project-stats",
        icon: BarChart3,
      },
      {
        key: "admin-audit-logs",
        title: "审计日志",
        href: "/admin/audit-logs",
        activePath: "/admin/audit-logs",
        icon: ScrollText,
      },
      {
        key: "admin-form-config",
        title: "表单配置",
        href: "/finance/admin/form-config",
        activePath: "/finance/admin/form-config",
        icon: SlidersHorizontal,
      },
    ],
  },
];

export function getAppNavItems(user?: AppNavUser): AppNavItem[] {
  const items = [...baseNavItems];

  if (showAiSidebarItems) {
    items.push(...aiNavItems);
  }

  if (canAccessAdmin(user)) {
    items.push(...adminNavItems);
  }

  return items;
}
