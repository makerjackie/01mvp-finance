import {
  BarChart3,
  ClipboardList,
  ImageIcon,
  MessageSquare,
  PlusCircle,
  ScrollText,
  SlidersHorizontal,
  ShieldCheck,
  Upload,
  UserCog,
  Wallet,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import {
  canAccessFinanceAuditLogs,
  canAccessFinanceReview,
  canAccessFinanceStats,
  canManageFinanceConfig,
  canManageFinanceRoles,
} from "@/lib/rbac";

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
];

const profileNavItem: AppNavItem = {
  key: "me",
  title: "账号资料",
  href: "/me",
  activePath: "/me",
  icon: Settings2,
};

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

const reviewNavItem: AppNavItem = {
  key: "review-center",
  title: "审核中心",
  href: "/finance/admin",
  activePath: "/finance/admin",
  icon: ShieldCheck,
};

const statsNavItem: AppNavItem = {
  key: "review-stats",
  title: "数据统计",
  href: "/finance/admin/project-stats",
  activePath: "/finance/admin/project-stats",
  icon: BarChart3,
};

const formConfigNavItem: AppNavItem = {
  key: "finance-form-config",
  title: "系统配置",
  href: "/finance/admin/form-config",
  activePath: "/finance/admin/form-config",
  icon: SlidersHorizontal,
};

const roleManageNavItem: AppNavItem = {
  key: "role-assign",
  title: "权限分配",
  href: "/admin",
  activePath: "/admin",
  icon: UserCog,
};

const auditLogsNavItem: AppNavItem = {
  key: "operation-logs",
  title: "操作日志",
  href: "/admin/audit-logs",
  activePath: "/admin/audit-logs",
  icon: ScrollText,
};

export function getAppNavItems(user?: AppNavUser): AppNavItem[] {
  const items = [...baseNavItems];

  if (showAiSidebarItems) {
    items.push(...aiNavItems);
  }

  const adminChildren: AppNavItem[] = [];
  if (canAccessFinanceReview(user)) adminChildren.push(reviewNavItem);
  if (canAccessFinanceStats(user)) adminChildren.push(statsNavItem);
  if (canManageFinanceConfig(user)) adminChildren.push(formConfigNavItem);
  if (canManageFinanceRoles(user)) adminChildren.push(roleManageNavItem);
  if (canAccessFinanceAuditLogs(user)) adminChildren.push(auditLogsNavItem);

  if (adminChildren.length > 0) {
    items.push({
      key: "admin",
      title: "管理员后台",
      href: adminChildren[0]?.href || "/finance/admin",
      activePath: "/finance/admin",
      icon: UserCog,
      children: adminChildren,
    });
  }

  items.push(profileNavItem);

  return items;
}
