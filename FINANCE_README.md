# 社区财务管理系统

一个简单的社区财务申请与审核系统。

## 功能特性

### 用户功能
- 手机号登录（必须填写真实姓名）
- 提交四种类型的财务申请：
  - 💰 收入登记
  - 🛒 采购支出
  - 🧾 费用报销
  - 💼 劳务与分润结算
- 查看和修改自己的申请记录（仅待审核状态可修改）
- 删除自己的待审核申请

### 管理员功能
- 查看所有财务申请记录
- 审核申请（通过/拒绝）
- 查看财务统计数据（总收入、总支出、余额）
- 按类型和状态筛选记录

## 快速开始

### 1. 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:3000

### 2. 登录系统

- 使用手机号登录
- 首次登录会自动注册
- 登录时必须填写真实姓名

### 3. 设置管理员

默认情况下，所有用户都是普通用户。要设置管理员，需要在数据库中手动修改用户的 `role` 字段为 `admin`。

```sql
-- 在 Prisma Studio 或数据库中执行
UPDATE "user" SET role = 'admin' WHERE phone_number = '你的手机号';
```

或使用 Prisma Studio：

```bash
pnpm run db:studio
```

### 4. 使用财务系统

#### 普通用户流程：
1. 访问 `/finance` 页面
2. 选择要提交的申请类型
3. 填写表单并提交
4. 在"我的申请记录"中查看状态
5. 待审核状态的记录可以修改或删除

#### 管理员流程：
1. 访问 `/finance/admin` 管理后台
2. 查看所有待审核的申请
3. 点击"通过"或"拒绝"进行审核
4. 可选填写审核备注
5. 查看财务统计数据

## 数据库结构

### FinanceRecord 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 申请人ID |
| type | String | 类型：income/purchase/reimbursement/labor |
| amount | Float | 金额 |
| relatedProject | String? | 关联项目名称 |
| description | String | 详细说明 |
| attachments | String[] | 附件URL数组 |
| status | String | 状态：pending/approved/rejected |
| reviewNote | String? | 审核备注 |
| reviewedAt | DateTime? | 审核时间 |
| reviewedBy | String? | 审批人ID |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### 类型特定字段

**收入登记 (income)**
- incomeType: 收入类型（A/B/C/D）
- paymentChannel: 收款渠道

**采购支出 (purchase)**
- expenseCategory: 支出类别（A/B/C）
- supplierName: 供应商名称
- supplierAccount: 供应商账号

**费用报销 (reimbursement)**
- expenseCategory: 费用类别
- reimbursementDetails: 报销明细
- recipientAccount: 收款账号

**劳务结算 (labor)**
- recipientName: 收款人姓名
- recipientIdCard: 身份证号
- laborType: 劳务类型（A/B/C）
- taxHandling: 税务处理方式（A/B）

## API 接口

### 用户接口

- `POST /api/finance` - 创建财务记录
- `GET /api/finance/my-records` - 获取我的记录
- `GET /api/finance/:id` - 获取单条记录详情
- `PUT /api/finance/:id` - 更新记录
- `DELETE /api/finance/:id` - 删除记录

### 管理员接口

- `GET /api/finance/admin/all` - 获取所有记录
- `POST /api/finance/:id/review` - 审核记录
- `GET /api/finance/admin/stats` - 获取统计数据

## 权限说明

### 普通用户
- 只能查看、修改、删除自己的记录
- 只能修改/删除待审核状态的记录
- 无法访问管理员后台

### 管理员 (role=admin)
- 可以查看所有记录
- 可以审核任何记录
- 可以修改/删除任何记录
- 可以查看统计数据

## 待实现功能

- [ ] 附件上传功能
- [ ] 导出财务报表
- [ ] 邮件/短信通知
- [ ] 批量审核
- [ ] 更详细的财务分析

## 技术栈

- Next.js 16 (App Router)
- Prisma + PostgreSQL
- Better Auth (手机号登录)
- Hono (API 路由)
- Tailwind CSS
- TypeScript
