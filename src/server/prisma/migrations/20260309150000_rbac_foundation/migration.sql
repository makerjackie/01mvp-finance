-- RBAC foundation for applicant/reviewer/admin
ALTER TABLE "user"
ALTER COLUMN "role" SET DEFAULT 'applicant';

UPDATE "user"
SET "role" = 'applicant'
WHERE "role" IS NULL OR "role" = 'user';

UPDATE "user"
SET "role" = 'reviewer'
WHERE "role" = 'manager';

CREATE TABLE IF NOT EXISTS "role" (
  "_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_pkey" PRIMARY KEY ("_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_code_key" ON "role"("code");

CREATE TABLE IF NOT EXISTS "permission" (
  "_id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "module" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permission_pkey" PRIMARY KEY ("_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "permission_code_key" ON "permission"("code");
CREATE INDEX IF NOT EXISTS "permission_module_idx" ON "permission"("module");

CREATE TABLE IF NOT EXISTS "role_permission" (
  "_id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_permission_pkey" PRIMARY KEY ("_id"),
  CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "role_permission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permission"("_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_permission_roleId_permissionId_key"
ON "role_permission"("roleId", "permissionId");
CREATE INDEX IF NOT EXISTS "role_permission_permissionId_idx" ON "role_permission"("permissionId");

CREATE TABLE IF NOT EXISTS "user_role" (
  "_id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT,
  CONSTRAINT "user_role_pkey" PRIMARY KEY ("_id"),
  CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("_id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_role_userId_roleId_key"
ON "user_role"("userId", "roleId");
CREATE INDEX IF NOT EXISTS "user_role_roleId_idx" ON "user_role"("roleId");

INSERT INTO "role" ("_id", "code", "name", "description", "isSystem")
VALUES
  ('role_applicant', 'applicant', '普通用户', '仅可提交申请并维护自己的申请内容。', true),
  ('role_reviewer', 'reviewer', '审核员', '可处理审核任务并查看统计数据。', true),
  ('role_admin', 'admin', '管理员', '拥有全部权限并可进行权限分配。', true)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "permission" ("_id", "code", "name", "module")
VALUES
  ('perm_admin_access', 'admin:access', '访问后台', 'admin'),
  ('perm_admin_auth', 'admin:auth', '登录方式/安全配置', 'admin'),
  ('perm_admin_users', 'admin:users', '用户与角色管理', 'admin'),
  ('perm_admin_flags', 'admin:flags', 'Feature Flags 管理', 'admin'),
  ('perm_admin_ops', 'admin:ops', '导入导出与运维', 'admin'),
  ('perm_finance_create', 'finance:application:create', '提交申请', 'finance'),
  ('perm_finance_read_own', 'finance:application:read:own', '查看本人申请', 'finance'),
  ('perm_finance_update_own', 'finance:application:update:own', '编辑本人申请', 'finance'),
  ('perm_finance_review', 'finance:application:review', '审核申请', 'finance'),
  ('perm_finance_stats_read', 'finance:stats:read', '查看统计', 'finance'),
  ('perm_finance_audit_read', 'finance:audit:read', '查看操作日志', 'finance'),
  ('perm_finance_role_assign', 'finance:user-role:assign', '权限分配', 'finance'),
  ('perm_finance_config_manage', 'finance:config:update', '系统配置', 'finance')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permission" ("_id", "roleId", "permissionId")
VALUES
  ('rp_applicant_finance_create', 'role_applicant', 'perm_finance_create'),
  ('rp_applicant_finance_read_own', 'role_applicant', 'perm_finance_read_own'),
  ('rp_applicant_finance_update_own', 'role_applicant', 'perm_finance_update_own'),
  ('rp_reviewer_finance_create', 'role_reviewer', 'perm_finance_create'),
  ('rp_reviewer_finance_read_own', 'role_reviewer', 'perm_finance_read_own'),
  ('rp_reviewer_finance_update_own', 'role_reviewer', 'perm_finance_update_own'),
  ('rp_reviewer_finance_review', 'role_reviewer', 'perm_finance_review'),
  ('rp_reviewer_finance_stats_read', 'role_reviewer', 'perm_finance_stats_read'),
  ('rp_admin_admin_access', 'role_admin', 'perm_admin_access'),
  ('rp_admin_admin_auth', 'role_admin', 'perm_admin_auth'),
  ('rp_admin_admin_users', 'role_admin', 'perm_admin_users'),
  ('rp_admin_admin_flags', 'role_admin', 'perm_admin_flags'),
  ('rp_admin_admin_ops', 'role_admin', 'perm_admin_ops'),
  ('rp_admin_finance_create', 'role_admin', 'perm_finance_create'),
  ('rp_admin_finance_read_own', 'role_admin', 'perm_finance_read_own'),
  ('rp_admin_finance_update_own', 'role_admin', 'perm_finance_update_own'),
  ('rp_admin_finance_review', 'role_admin', 'perm_finance_review'),
  ('rp_admin_finance_stats_read', 'role_admin', 'perm_finance_stats_read'),
  ('rp_admin_finance_audit_read', 'role_admin', 'perm_finance_audit_read'),
  ('rp_admin_finance_role_assign', 'role_admin', 'perm_finance_role_assign'),
  ('rp_admin_finance_config_manage', 'role_admin', 'perm_finance_config_manage')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
