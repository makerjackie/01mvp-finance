# 财务系统角色权限（Prisma + 中间件骨架）

## 1. 角色与模块映射

- `applicant`：提交申请、查看/编辑本人待审核申请。
- `reviewer`：继承 `applicant`，可进入审核中心、执行审核动作、查看统计。
- `admin`：继承 `reviewer`，可查看操作日志、分配权限、维护系统配置。

## 2. Prisma 表结构（建议版，支持未来多角色）

```prisma
model Role {
  id          String           @id @default(cuid()) @map("_id")
  code        String           @unique // applicant | reviewer | admin
  name        String
  description String?
  isSystem    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  permissions RolePermission[]
  userRoles   UserRole[]

  @@map("role")
}

model Permission {
  id          String           @id @default(cuid()) @map("_id")
  code        String           @unique
  name        String
  description String?
  module      String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  roles       RolePermission[]

  @@index([module])
  @@map("permission")
}

model RolePermission {
  id           String      @id @default(cuid()) @map("_id")
  roleId       String
  permissionId String
  role         Role        @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission  @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime    @default(now())

  @@unique([roleId, permissionId])
  @@index([permissionId])
  @@map("role_permission")
}

model UserRole {
  id        String   @id @default(cuid()) @map("_id")
  userId    String
  roleId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  createdBy String?

  @@unique([userId, roleId])
  @@index([roleId])
  @@map("user_role")
}
```

## 3. 当前落地策略（兼容现网）

- 当前代码仍基于 `User.role` 单字段运行，值采用：
  - `applicant`
  - `reviewer`
  - `admin`
- 兼容映射：
  - 旧值 `user` => `applicant`
  - 旧值 `manager` => `reviewer`
- 后续如需升级多角色，再引入 `Role/Permission/UserRole` 表并灰度迁移。

## 4. 权限常量建议

```ts
export const PERMISSIONS = {
  financeCreate: "finance:application:create",
  financeReadOwn: "finance:application:read:own",
  financeUpdateOwn: "finance:application:update:own",
  financeReview: "finance:application:review",
  financeStatsRead: "finance:stats:read",
  financeAuditRead: "finance:audit:read",
  financeRoleAssign: "finance:user-role:assign",
  financeConfigManage: "finance:config:update",
} as const;
```

## 5. 中间件骨架（Hono）

```ts
import { createMiddleware } from "hono/factory";
import { auth } from "@/server/lib/auth";
import { resolveRole, hasPermission, type Permission } from "@/lib/rbac";

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ message: "Unauthorized" }, 401);
  c.set("user", session.user);
  c.set("role", resolveRole(session.user.role));
  return next();
});

export const requirePermission = (permission: Permission | Permission[]) =>
  createMiddleware(async (c, next) => {
    const role = c.get("role");
    const required = Array.isArray(permission) ? permission : [permission];
    if (!required.some((item) => hasPermission(role, item))) {
      return c.json({ message: "Forbidden" }, 403);
    }
    return next();
  });
```

## 6. 页面可见性策略

- 前端菜单按权限渲染。
- 路由访问由 `proxy.ts` 二次校验。
- 后端接口使用 `sessionMiddleware + requirePermission` 强制鉴权。
- 规则：前端隐藏不等于授权，最终以后端为准。
