import { Hono } from "hono";
import type { Prisma } from "@/server/prisma/generated/prisma/client";
import { prisma } from "@/server/lib/db";
import { auth } from "@/server/lib/auth";
import { notifyAdmins, createNotification } from "@/server/lib/notification";
import { createAuditLog } from "@/server/lib/audit";

const app = new Hono();

// 创建财务记录
app.post("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const data = await c.req.json();

  // 基本验证
  if (!data.type || !data.category || !data.amount || !data.description) {
    return c.json({ error: "缺少必填字段" }, 400);
  }

  if (!["income", "expense"].includes(data.type)) {
    return c.json({ error: "无效的记录类型" }, 400);
  }

  const record = await prisma.financeRecord.create({
    data: {
      type: data.type,
      category: data.category,
      subcategory: data.subcategory || null,
      amount: Number(data.amount),
      relatedProject: data.relatedProject || null,
      description: data.description,
      attachments: data.attachments || [],
      recipientName: data.recipientName || null,
      recipientAccount: data.recipientAccount || null,
      recipientBank: data.recipientBank || null,
      recipientIdCard: data.recipientIdCard || null,
      transactionNo: data.transactionNo || null,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : null,
      summary: data.summary || null,
      purpose: data.purpose || null,
      paymentStatus: "unpaid",
      accountPeriod: data.accountPeriod || null,
      taxHandling: data.taxHandling || null,
      isCommunity: data.isCommunity !== undefined ? data.isCommunity : true, // 默认为社区账目
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  await notifyAdmins({
    type: "finance_submitted",
    title: "新的财务申请",
    content: `${session.user.name} 提交了一条${data.type === "income" ? "收入" : "支出"}申请`,
    link: `/finance/edit/${record.id}`,
    financeRecordId: record.id,
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "create",
    resource: "finance_record",
    resourceId: record.id,
    metadata: { type: data.type, amount: data.amount },
    req: c.req.raw,
  });

  return c.json({ success: true, data: record });
});

// 获取当前用户的财务记录列表
app.get("/my-records", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const records = await prisma.financeRecord.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  return c.json({ success: true, data: records });
});

// 获取单条财务记录详情
app.get("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const id = c.req.param("id");
  const record = await prisma.financeRecord.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  // 普通用户只能查看自己的记录
  if (session.user.role !== "admin" && record.userId !== session.user.id) {
    return c.json({ error: "无权访问" }, 403);
  }

  return c.json({ success: true, data: record });
});

// 更新财务记录（用户只能更新自己的待审核记录）
app.put("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const id = c.req.param("id");
  const data = await c.req.json();

  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  // 普通用户只能更新自己的待审核记录
  if (session.user.role !== "admin") {
    if (record.userId !== session.user.id) {
      return c.json({ error: "无权修改" }, 403);
    }
    if (record.status !== "pending") {
      return c.json({ error: "只能修改待审核的记录" }, 403);
    }
  }

  const updateData: Prisma.FinanceRecordUpdateInput = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
  if (data.amount !== undefined) updateData.amount = Number(data.amount);
  if (data.relatedProject !== undefined) updateData.relatedProject = data.relatedProject;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.recipientName !== undefined) updateData.recipientName = data.recipientName;
  if (data.recipientAccount !== undefined) updateData.recipientAccount = data.recipientAccount;
  if (data.recipientBank !== undefined) updateData.recipientBank = data.recipientBank;
  if (data.recipientIdCard !== undefined) updateData.recipientIdCard = data.recipientIdCard;
  if (data.transactionNo !== undefined) updateData.transactionNo = data.transactionNo;
  if (data.transactionDate !== undefined)
    updateData.transactionDate = data.transactionDate ? new Date(data.transactionDate) : null;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.purpose !== undefined) updateData.purpose = data.purpose;
  if (data.accountPeriod !== undefined) updateData.accountPeriod = data.accountPeriod;
  if (data.taxHandling !== undefined) updateData.taxHandling = data.taxHandling;
  if (data.attachments !== undefined) updateData.attachments = data.attachments;

  // 只有管理员可以修改 isCommunity 字段
  if (session.user.role === "admin" && data.isCommunity !== undefined) {
    updateData.isCommunity = data.isCommunity;
  }

  const updated = await prisma.financeRecord.update({
    where: { id },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "update",
    resource: "finance_record",
    resourceId: id,
    changes: updateData,
    req: c.req.raw,
  });

  return c.json({ success: true, data: updated });
});

// 删除财务记录（用户只能删除自己的待审核记录）
app.delete("/:id", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    return c.json({ error: "未登录" }, 401);
  }

  const id = c.req.param("id");
  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  // 普通用户只能删除自己的待审核记录
  if (session.user.role !== "admin") {
    if (record.userId !== session.user.id) {
      return c.json({ error: "无权删除" }, 403);
    }
    if (record.status !== "pending") {
      return c.json({ error: "只能删除待审核的记录" }, 403);
    }
  }

  await prisma.financeRecord.delete({
    where: { id },
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "delete",
    resource: "finance_record",
    resourceId: id,
    req: c.req.raw,
  });

  return c.json({ success: true });
});

// 管理员：获取所有财务记录
app.get("/admin/all", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user || session.user.role !== "admin") {
    return c.json({ error: "无权访问" }, 403);
  }

  const { type, status, category } = c.req.query();

  const records = await prisma.financeRecord.findMany({
    where: {
      ...(type && { type }),
      ...(status && { status }),
      ...(category && { category }),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  return c.json({ success: true, data: records });
});

// 管理员：审核财务记录
app.post("/:id/review", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user || session.user.role !== "admin") {
    return c.json({ error: "无权操作" }, 403);
  }

  const id = c.req.param("id");
  const data = await c.req.json();

  if (!data.status || !["approved", "rejected"].includes(data.status)) {
    return c.json({ error: "无效的审核状态" }, 400);
  }

  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  const updated = await prisma.financeRecord.update({
    where: { id },
    data: {
      status: data.status,
      reviewNote: data.reviewNote || null,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  await createNotification({
    userId: record.userId,
    type: "finance_reviewed",
    title: data.status === "approved" ? "申请已通过" : "申请已拒绝",
    content: `您的财务申请已${data.status === "approved" ? "通过" : "拒绝"}审核`,
    link: `/finance/edit/${record.id}`,
    financeRecordId: record.id,
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "review",
    resource: "finance_record",
    resourceId: id,
    changes: { status: data.status, reviewNote: data.reviewNote },
    req: c.req.raw,
  });

  return c.json({ success: true, data: updated });
});

// 管理员：标记为已支付
app.post("/:id/mark-paid", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user || session.user.role !== "admin") {
    return c.json({ error: "无权操作" }, 403);
  }

  const id = c.req.param("id");
  const data = await c.req.json();

  const record = await prisma.financeRecord.findUnique({
    where: { id },
  });

  if (!record) {
    return c.json({ error: "记录不存在" }, 404);
  }

  if (record.status !== "approved") {
    return c.json({ error: "只能标记已审核通过的记录为已支付" }, 400);
  }

  const updated = await prisma.financeRecord.update({
    where: { id },
    data: {
      paymentStatus: "paid",
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      paidBy: session.user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  await createNotification({
    userId: record.userId,
    type: "finance_paid",
    title: "款项已支付",
    content: "您的财务申请款项已支付",
    link: `/finance/edit/${record.id}`,
    financeRecordId: record.id,
  });

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name || "Unknown",
    action: "mark_paid",
    resource: "finance_record",
    resourceId: id,
    changes: { paymentStatus: "paid", paymentDate: data.paymentDate },
    req: c.req.raw,
  });

  return c.json({ success: true, data: updated });
});

// 管理员：获取财务统计
app.get("/admin/stats", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user || session.user.role !== "admin") {
    return c.json({ error: "无权访问" }, 403);
  }

  const [totalIncome, totalExpense, communityIncome, communityExpense, pendingCount, approvedCount, rejectedCount] =
    await Promise.all([
      // 总收入（已通过的收入记录 - 公司账目）
      prisma.financeRecord.aggregate({
        where: {
          type: "income",
          status: "approved",
        },
        _sum: {
          amount: true,
        },
      }),
      // 总支出（已通过的支出记录 - 公司账目）
      prisma.financeRecord.aggregate({
        where: {
          type: "expense",
          status: "approved",
        },
        _sum: {
          amount: true,
        },
      }),
      // 社区收入（已通过的社区收入记录）
      prisma.financeRecord.aggregate({
        where: {
          type: "income",
          status: "approved",
          isCommunity: true,
        },
        _sum: {
          amount: true,
        },
      }),
      // 社区支出（已通过的社区支出记录）
      prisma.financeRecord.aggregate({
        where: {
          type: "expense",
          status: "approved",
          isCommunity: true,
        },
        _sum: {
          amount: true,
        },
      }),
      // 待审核数量
      prisma.financeRecord.count({
        where: { status: "pending" },
      }),
      // 已通过数量
      prisma.financeRecord.count({
        where: { status: "approved" },
      }),
      // 已拒绝数量
      prisma.financeRecord.count({
        where: { status: "rejected" },
      }),
    ]);

  const companyBalance = (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0);
  const communityBalance = (communityIncome._sum.amount || 0) - (communityExpense._sum.amount || 0);

  return c.json({
    success: true,
    data: {
      // 公司账目（全部）
      company: {
        totalIncome: totalIncome._sum.amount || 0,
        totalExpense: totalExpense._sum.amount || 0,
        balance: companyBalance,
      },
      // 社区账目（公开）
      community: {
        totalIncome: communityIncome._sum.amount || 0,
        totalExpense: communityExpense._sum.amount || 0,
        balance: communityBalance,
      },
      pendingCount,
      approvedCount,
      rejectedCount,
    },
  });
});

// 公开接口：获取社区财务统计（无需登录）
app.get("/public/stats", async (c) => {
  const [communityIncome, communityExpense] = await Promise.all([
    // 社区收入（已通过的社区收入记录）
    prisma.financeRecord.aggregate({
      where: {
        type: "income",
        status: "approved",
        isCommunity: true,
      },
      _sum: {
        amount: true,
      },
    }),
    // 社区支出（已通过的社区支出记录）
    prisma.financeRecord.aggregate({
      where: {
        type: "expense",
        status: "approved",
        isCommunity: true,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const communityBalance = (communityIncome._sum.amount || 0) - (communityExpense._sum.amount || 0);

  return c.json({
    success: true,
    data: {
      totalIncome: communityIncome._sum.amount || 0,
      totalExpense: communityExpense._sum.amount || 0,
      balance: communityBalance,
    },
  });
});

// 管理员：导出CSV
app.get("/admin/export", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user || session.user.role !== "admin") {
    return c.json({ error: "无权访问" }, 403);
  }

  const { type, status, isCommunity } = c.req.query();

  const records = await prisma.financeRecord.findMany({
    where: {
      ...(type && { type }),
      ...(status && { status }),
      ...(isCommunity !== undefined && { isCommunity: isCommunity === "true" }),
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
    },
  });

  // 计算累计余额
  let balance = 0;
  const recordsWithBalance = records
    .reverse()
    .map((record) => {
      if (record.status === "approved") {
        if (record.type === "income") {
          balance += record.amount;
        } else {
          balance -= record.amount;
        }
      }
      return { ...record, balance };
    })
    .reverse();

  // 生成CSV内容
  const headers = [
    "流水号",
    "交易日期",
    "收入",
    "支出",
    "余额",
    "摘要",
    "对方户名",
    "对方账号",
    "对方开户行",
    "用途",
    "分类",
    "审核状态",
    "支付状态",
    "支付日期",
    "账期",
    "个税处理",
    "申请人",
    "申请人电话",
    "审核备注",
    "审核时间",
  ];

  const rows = recordsWithBalance.map((record) => [
    record.transactionNo || record.id,
    record.transactionDate
      ? new Date(record.transactionDate).toISOString().split("T")[0].replace(/-/g, "")
      : new Date(record.createdAt).toISOString().split("T")[0].replace(/-/g, ""),
    record.type === "income" && record.status === "approved" ? record.amount.toFixed(2) : "",
    record.type === "expense" && record.status === "approved" ? record.amount.toFixed(2) : "",
    record.status === "approved" ? record.balance.toFixed(2) : "",
    record.summary || record.description,
    record.recipientName || "",
    record.recipientAccount || "",
    record.recipientBank || "",
    record.purpose || record.relatedProject || "",
    record.category,
    record.status === "pending" ? "待审核" : record.status === "approved" ? "已通过" : "已拒绝",
    record.type === "expense" ? (record.paymentStatus === "paid" ? "已支付" : "未支付") : "-",
    record.paymentDate ? new Date(record.paymentDate).toISOString().split("T")[0] : "",
    record.accountPeriod || "",
    record.taxHandling === "withhold"
      ? "代扣代缴"
      : record.taxHandling === "self"
        ? "自行申报"
        : record.taxHandling === "none"
          ? "无需处理"
          : "",
    record.user.name,
    record.user.phoneNumber || "",
    record.reviewNote || "",
    record.reviewedAt ? new Date(record.reviewedAt).toLocaleString("zh-CN") : "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  // 添加BOM以支持Excel正确显示中文
  const bom = "\uFEFF";

  return new Response(bom + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance_records_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
});

export default app;
