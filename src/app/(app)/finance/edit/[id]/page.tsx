"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FINANCE_CATEGORIES, TYPE_LABELS, getCategoryLabel } from "@/lib/finance-config";

interface FinanceRecord {
  id: string;
  type: string;
  category: string;
  amount: number;
  relatedProject?: string;
  description: string;
  status: string;
  paymentStatus?: string;
  paymentDate?: string;
  createdAt: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
  recipientIdCard?: string;
  transactionNo?: string;
  transactionDate?: string;
  summary?: string;
  purpose?: string;
  accountPeriod?: string;
  taxHandling?: string;
  reviewNote?: string;
  reviewedAt?: string;
  attachments?: Array<{ key: string; url: string; name: string }>;
}

export default function EditRecordPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [record, setRecord] = useState<FinanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category: "",
    amount: "",
    relatedProject: "",
    description: "",
    recipientName: "",
    recipientAccount: "",
    recipientIdCard: "",
  });

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await fetch(`/api/finance/${id}`);
      const result = await res.json();
      if (result.success) {
        const data = result.data;
        setRecord(data);
        setFormData({
          type: data.type,
          category: data.category,
          amount: data.amount.toString(),
          relatedProject: data.relatedProject || "",
          description: data.description || "",
          recipientName: data.recipientName || "",
          recipientAccount: data.recipientAccount || "",
          recipientIdCard: data.recipientIdCard || "",
        });
      } else {
        alert(result.error || "加载失败");
        router.push("/finance/my-records");
      }
    } catch (error) {
      console.error(error);
      alert("加载失败");
      router.push("/finance/my-records");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = {
        type: formData.type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        relatedProject: formData.relatedProject || undefined,
        description: formData.description,
        recipientName: formData.recipientName || undefined,
        recipientAccount: formData.recipientAccount || undefined,
        recipientIdCard: formData.recipientIdCard || undefined,
      };

      const res = await fetch(`/api/finance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert("保存成功！");
        router.push("/finance/my-records");
      } else {
        alert(result.error || "保存失败");
      }
    } catch (error) {
      console.error(error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
        <p className="text-sm sm:text-base">加载中...</p>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  const canEdit = record.status === "pending";
  const categories = FINANCE_CATEGORIES[formData.type];

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
      <div className="mb-4 sm:mb-6">
        <Link
          href="/finance/my-records"
          className="text-blue-600 hover:underline mb-4 inline-block text-sm sm:text-base"
        >
          ← 返回我的记录
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {TYPE_LABELS[record.type]} - {getCategoryLabel(record.type, record.category)}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          提交时间：{new Date(record.createdAt).toLocaleString("zh-CN")}
        </p>
      </div>

      {!canEdit && (
        <div className="mb-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs sm:text-sm text-yellow-800">
            此记录已审核，无法修改。状态：{record.status === "approved" ? "已通过" : "已拒绝"}
          </p>
          {record.reviewNote && (
            <p className="text-xs sm:text-sm text-yellow-800 mt-2">
              <span className="font-medium">审核备注：</span>
              {record.reviewNote}
            </p>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6"
      >
        {/* 类型选择 */}
        <div>
          <label className="block text-sm font-medium mb-2">类型</label>
          <select
            disabled={!canEdit}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense", category: "" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
          >
            <option value="income">收入</option>
            <option value="expense">支出</option>
          </select>
        </div>

        {/* 类别选择 */}
        <div>
          <label className="block text-sm font-medium mb-2">类别</label>
          <select
            disabled={!canEdit}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
          >
            <option value="">请选择类别</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* 金额 */}
        <div>
          <label className="block text-sm font-medium mb-2">金额（元）</label>
          <input
            type="number"
            step="0.01"
            required
            disabled={!canEdit}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
          />
        </div>

        {/* 关联项目 */}
        <div>
          <label className="block text-sm font-medium mb-2">关联项目/活动名称</label>
          <input
            type="text"
            disabled={!canEdit}
            value={formData.relatedProject}
            onChange={(e) => setFormData({ ...formData, relatedProject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
          />
        </div>

        {/* 详细说明 */}
        <div>
          <label className="block text-sm font-medium mb-2">详细说明</label>
          <textarea
            required
            disabled={!canEdit}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
            rows={4}
          />
        </div>

        {/* 收款人信息（支出类型） */}
        {formData.type === "expense" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">收款人/供应商名称</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">收款账号</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.recipientAccount}
                onChange={(e) => setFormData({ ...formData, recipientAccount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
              />
            </div>

            {formData.category === "salary" && (
              <div>
                <label className="block text-sm font-medium mb-2">收款人身份证号</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={formData.recipientIdCard}
                  onChange={(e) => setFormData({ ...formData, recipientIdCard: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base"
                />
              </div>
            )}
          </>
        )}

        {/* 附件显示 */}
        {record.attachments && record.attachments.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">附件</label>
            <div className="space-y-2">
              {record.attachments.map((file: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    查看
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 支付状态显示 */}
        {record.type === "expense" && record.status === "approved" && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3 text-gray-700">支付信息</h3>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm">
                <span className="font-medium">支付状态：</span>
                <span className={record.paymentStatus === "paid" ? "text-green-600" : "text-gray-600"}>
                  {record.paymentStatus === "paid" ? "已支付" : "未支付"}
                </span>
              </p>
              {record.paymentDate && (
                <p className="text-sm mt-2">
                  <span className="font-medium">支付日期：</span>
                  {new Date(record.paymentDate).toLocaleDateString("zh-CN")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
          {canEdit ? (
            <>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-2.5 sm:py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base font-medium"
              >
                {saving ? "保存中..." : "保存修改"}
              </button>
              <Link
                href="/finance/my-records"
                className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-2 px-4 rounded-md hover:bg-gray-300 text-center text-sm sm:text-base font-medium"
              >
                取消
              </Link>
            </>
          ) : (
            <Link
              href="/finance/my-records"
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-2 px-4 rounded-md hover:bg-gray-300 text-center text-sm sm:text-base font-medium"
            >
              返回
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
