export const PERMISSIONS = {
  accessAdmin: "admin:access",
  manageAuth: "admin:auth",
  manageUsers: "admin:users",
  manageFeatureFlags: "admin:flags",
  runOps: "admin:ops",
  financeCreate: "finance:application:create",
  financeReadOwn: "finance:application:read:own",
  financeUpdateOwn: "finance:application:update:own",
  financeReview: "finance:application:review",
  financeStatsRead: "finance:stats:read",
  financeAuditRead: "finance:audit:read",
  financeRoleAssign: "finance:user-role:assign",
  financeConfigManage: "finance:config:update",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type RoleKey = "admin" | "reviewer" | "applicant";

type RbacUser = { role?: string | null } | null | undefined;

const ROLE_DEFINITIONS: Record<RoleKey, { label: string; description: string; permissions: Permission[] }> = {
  admin: {
    label: "管理员",
    description: "拥有全部后台权限，适合站点拥有者或技术负责人。",
    permissions: [
      PERMISSIONS.accessAdmin,
      PERMISSIONS.manageAuth,
      PERMISSIONS.manageUsers,
      PERMISSIONS.manageFeatureFlags,
      PERMISSIONS.runOps,
      PERMISSIONS.financeCreate,
      PERMISSIONS.financeReadOwn,
      PERMISSIONS.financeUpdateOwn,
      PERMISSIONS.financeReview,
      PERMISSIONS.financeStatsRead,
      PERMISSIONS.financeAuditRead,
      PERMISSIONS.financeRoleAssign,
      PERMISSIONS.financeConfigManage,
    ],
  },
  reviewer: {
    label: "审核员",
    description: "可处理审核任务并查看统计数据，不可访问权限分配与审计日志。",
    permissions: [
      PERMISSIONS.financeCreate,
      PERMISSIONS.financeReadOwn,
      PERMISSIONS.financeUpdateOwn,
      PERMISSIONS.financeReview,
      PERMISSIONS.financeStatsRead,
    ],
  },
  applicant: {
    label: "普通用户",
    description: "仅可提交申请并维护自己的申请内容。",
    permissions: [PERMISSIONS.financeCreate, PERMISSIONS.financeReadOwn, PERMISSIONS.financeUpdateOwn],
  },
};

export const ROLE_OPTIONS = Object.entries(ROLE_DEFINITIONS).map(([value, meta]) => ({
  value: value as RoleKey,
  label: meta.label,
  description: meta.description,
}));

export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.accessAdmin]: "访问后台",
  [PERMISSIONS.manageAuth]: "登录方式/安全配置",
  [PERMISSIONS.manageUsers]: "用户与角色管理",
  [PERMISSIONS.manageFeatureFlags]: "Feature Flags 管理",
  [PERMISSIONS.runOps]: "导入导出与运维",
  [PERMISSIONS.financeCreate]: "提交申请",
  [PERMISSIONS.financeReadOwn]: "查看本人申请",
  [PERMISSIONS.financeUpdateOwn]: "编辑本人申请",
  [PERMISSIONS.financeReview]: "审核申请",
  [PERMISSIONS.financeStatsRead]: "查看统计",
  [PERMISSIONS.financeAuditRead]: "查看操作日志",
  [PERMISSIONS.financeRoleAssign]: "权限分配",
  [PERMISSIONS.financeConfigManage]: "系统配置",
};

export function resolveRole(role?: string | null): RoleKey {
  if (role === "admin") return "admin";
  if (role === "reviewer" || role === "manager") return "reviewer";
  if (role === "applicant" || role === "user") return "applicant";
  return "applicant";
}

export function getPermissionsForRole(role?: string | null): Permission[] {
  const resolved = resolveRole(role);
  const fromMap = ROLE_DEFINITIONS[resolved]?.permissions ?? [];
  // admin 作为超管，未来新增权限默认放行
  if (resolved === "admin") {
    const all = new Set<Permission>([...fromMap, ...Object.values(PERMISSIONS)]);
    return Array.from(all);
  }
  return fromMap;
}

export function hasPermission(subject: RbacUser | RoleKey, permission: Permission) {
  const role = typeof subject === "string" ? subject : resolveRole(subject?.role);
  if (role === "admin") return true;
  return getPermissionsForRole(role).includes(permission);
}

export function canAccessAdmin(user: RbacUser) {
  return hasPermission(user, PERMISSIONS.accessAdmin);
}

export function canManageAuth(user: RbacUser) {
  return hasPermission(user, PERMISSIONS.manageAuth);
}

export function canManageUsers(user: RbacUser) {
  return hasPermission(user, PERMISSIONS.manageUsers);
}

export function canManageFeatureFlags(user: RbacUser) {
  return hasPermission(user, PERMISSIONS.manageFeatureFlags);
}

export function canRunOps(user: RbacUser) {
  return hasPermission(user, PERMISSIONS.runOps);
}

export function canAccessFinanceReview(subject: RbacUser | RoleKey) {
  return hasPermission(subject, PERMISSIONS.financeReview);
}

export function canAccessFinanceStats(subject: RbacUser | RoleKey) {
  return hasPermission(subject, PERMISSIONS.financeStatsRead);
}

export function canAccessFinanceAuditLogs(subject: RbacUser | RoleKey) {
  return hasPermission(subject, PERMISSIONS.financeAuditRead);
}

export function canManageFinanceRoles(subject: RbacUser | RoleKey) {
  return hasPermission(subject, PERMISSIONS.financeRoleAssign);
}

export function canManageFinanceConfig(subject: RbacUser | RoleKey) {
  return hasPermission(subject, PERMISSIONS.financeConfigManage);
}

export function canReviewFinance(subject: RbacUser | RoleKey) {
  return hasPermission(subject, PERMISSIONS.financeReview);
}
