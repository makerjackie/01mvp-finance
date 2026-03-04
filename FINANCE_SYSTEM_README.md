# 财务管理系统

一个专业的公司财务申请与审核系统，支持移动端和桌面端。

## 功能特性

### 用户功能
- 📱 手机号验证码登录（首次注册必须填写真实姓名）
- 💰 收入登记：项目收入、服务收入、咨询收入、捐赠收入等
- 💸 支出申请：
  - 物料费
  - 交通费
  - 住宿费
  - 办公费
  - 通讯费
  - 比赛奖金
  - 劳务补贴
  - 福利费
  - 工资
  - 其他支出
- 📋 查看和管理自己的申请记录
- ✏️ 修改待审核状态的申请
- 🗑️ 删除待审核状态的申请

### 管理员功能
- 📊 数据表格视图（支持排序、筛选、分页）
- ✅ 审核申请（通过/拒绝，可填写备注）
- 📈 财务统计数据：
  - 总收入
  - 总支出
  - 当前余额
  - 待审核数量
  - 已通过数量
  - 已拒绝数量
- 🔍 按类型、状态、申请人筛选记录
- ✏️ 编辑和删除任何记录

### 移动端优化
- 📱 完全响应式设计
- 👆 触摸友好的界面
- 📏 自适应字体和间距
- 🎯 优化的表单输入体验

## 快速开始

### 1. 启动开发服务器

```bash
pnpm run dev
```

访问 http://localhost:3000

### 2. 登录系统

- 使用手机号验证码登录
- 首次登录会要求填写真实姓名
- 系统会自动创建账号

### 3. 设置管理员

默认情况下，所有用户都是普通用户。要设置管理员，需要在数据库中手动修改用户的 `role` 字段为 `admin`。

使用 Prisma Studio：

```bash
pnpm run db:studio
```

在 Prisma Studio 中找到你的用户，将 `role` 字段改为 `admin`

### 4. 使用财务系统

#### 普通用户流程：
1. 访问 `/finance` 页面
2. 选择"收入登记"或"支出申请"
3. 选择具体类别并填写表单
4. 提交申请
5. 在"我的申请记录"中查看状态
6. 待审核状态的记录可以修改或删除

#### 管理员流程：
1. 访问 `/finance/admin` 管理后台
2. 查看数据表格，支持：
   - 按类型筛选（收入/支出）
   - 按状态筛选（待审核/已通过/已拒绝）
   - 按申请人姓名搜索
   - 点击列标题排序
   - 分页浏览（每页20条）
3. 点击"通过"或"拒绝"进行审核
4. 可选填写审核备注
5. 查看财务统计数据
6. 编辑或删除任何记录

## 数据库结构

### FinanceRecord 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | 主键 |
| userId | String | 申请人ID |
| type | String | 类型：income(收入) / expense(支出) |
| category | String | 具体类别（如：物料费、工资等） |
| amount | Float | 金额 |
| relatedProject | String? | 关联项目名称 |
| description | String | 详细说明 |
| attachments | String[] | 附件URL数组 |
| recipientName | String? | 收款人/供应商名称 |
| recipientAccount | String? | 收款账号 |
| recipientIdCard | String? | 收款人身份证（工资类需要） |
| status | String | 状态：pending/approved/rejected |
| reviewNote | String? | 审核备注 |
| reviewedAt | DateTime? | 审核时间 |
| reviewedBy | String? | 审批人ID |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

## API 接口

### 用户接口

- `POST /api/finance` - 创建财务记录
- `GET /api/finance/my-records` - 获取我的记录
- `GET /api/finance/:id` - 获取单条记录详情
- `PUT /api/finance/:id` - 更新记录
- `DELETE /api/finance/:id` - 删除记录

### 管理员接口

- `GET /api/finance/admin/all` - 获取所有记录（支持筛选）
- `POST /api/finance/:id/review` - 审核记录
- `GET /api/finance/admin/stats` - 获取统计数据

### 认证接口

- `GET /api/auth/check-phone` - 检查手机号是否已注册
- `POST /api/auth/update-profile` - 更新用户信息

## 收入类别

- 项目收入
- 服务收入
- 咨询收入
- 捐赠收入
- 其他收入

## 支出类别

- 物料费
- 交通费
- 住宿费
- 办公费
- 通讯费
- 比赛奖金
- 劳务补贴
- 福利费
- 工资（需要填写收款人身份证）
- 其他支出

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
- 可以使用高级筛选和搜索功能

## 移动端特性

- ✅ 响应式布局，自动适配手机、平板、桌面
- ✅ 触摸优化的按钮和表单
- ✅ 移动端友好的字体大小
- ✅ 优化的间距和留白
- ✅ 横向滚动的数据表格
- ✅ 移动端优化的导航

## 待实现功能

- [ ] 附件上传功能
- [ ] 导出财务报表（Excel/PDF）
- [ ] 邮件/短信通知
- [ ] 批量审核
- [ ] 更详细的财务分析图表
- [ ] 财务报表打印
- [ ] 审批流程（多级审批）

## 技术栈

- Next.js 16 (App Router)
- Prisma + PostgreSQL
- Better Auth (手机号登录)
- Hono (API 路由)
- TanStack Table (数据表格)
- Tailwind CSS
- TypeScript

## 注意事项

1. 首次使用手机号登录时，必须填写真实姓名
2. 工资类支出需要填写收款人身份证号
3. 只有待审核状态的记录可以被申请人修改或删除
4. 管理员可以修改和删除任何状态的记录
5. 审核通过的记录会计入财务统计
6. 系统支持移动端访问，建议使用现代浏览器

## 开发说明

### 环境变量

确保 `.env` 文件包含以下配置：

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
```

### 数据库迁移

```bash
# 推送 schema 变更
pnpm run db:push

# 生成 Prisma Client
pnpm run db:generate

# 打开 Prisma Studio
pnpm run db:studio
```

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 启动生产服务器
pnpm start
```

## 截图

（建议添加系统截图）

- 登录页面（手机号验证码）
- 财务首页
- 提交申请表单
- 我的申请记录
- 管理员后台（数据表格）
- 财务统计数据

## 许可证

MIT
