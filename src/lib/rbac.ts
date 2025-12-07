export const PERMISSIONS = {
  accessAdmin: "admin:access",
  manageAuth: "admin:auth",
  manageUsers: "admin:users",
  manageFeatureFlags: "admin:flags",
  runOps: "admin:ops",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type RoleKey = "admin" | "manager" | "user";

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
    ],
  },
  manager: {
    label: "运营/经理",
    description: "可进入后台并管理用户与 Feature Flag，无法修改系统配置或运维操作。",
    permissions: [PERMISSIONS.accessAdmin, PERMISSIONS.manageUsers, PERMISSIONS.manageFeatureFlags],
  },
  user: {
    label: "普通用户",
    description: "仅能访问业务功能，无后台权限。",
    permissions: [],
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
};

export function resolveRole(role?: string | null): RoleKey {
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  return "user";
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
