"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FINANCE_CATEGORIES, TYPE_LABELS } from "@/lib/finance-config";

export default function SubmitFinanceRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "income") as "income" | "expense";
  const typeLabel = TYPE_LABELS[type];
  const categories = FINANCE_CATEGORIES[type];

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ key: string; url: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    relatedProject: "",
    description: "",
    recipientName: "",
    recipientAccount: "",
    recipientBank: "",
    recipientIdCard: "",
    transactionNo: "",
    transactionDate: "",
    summary: "",
    purpose: "",
    accountPeriod: "",
    taxHandling: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        type,
        category: formData.category,
        amount: parseFloat(formData.amount),
        relatedProject: formData.relatedProject || undefined,
        description: formData.description,
        recipientName: formData.recipientName || undefined,
        recipientAccount: formData.recipientAccount || undefined,
        recipientBank: formData.recipientBank || undefined,
        recipientIdCard: formData.recipientIdCard || undefined,
        transactionNo: formData.transactionNo || undefined,
        transactionDate: formData.transactionDate || undefined,
        summary: formData.summary || undefined,
        purpose: formData.purpose || undefined,
        accountPeriod: formData.accountPeriod || undefined,
        taxHandling: formData.taxHandling || undefined,
        attachments: uploadedFiles.map((f) => ({ key: f.key, url: f.url, name: f.name })),
      };

      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        alert("提交成功！");
        router.push("/finance/my-records");
      } else {
        alert(result.error || "提交失败");
      }
    } catch (error) {
      console.error(error);
      alert("提交失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();

        if (result.success) {
          setUploadedFiles((prev) => [...prev, result.data]);
        } else {
          alert(`上传失败: ${result.error}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (key: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.key !== key));
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
      <div className="mb-4 sm:mb-6">
        <Link href="/finance" className="text-blue-600 hover:underline mb-4 inline-block text-sm sm:text-base">
          ← 返回首页
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {type === "income" ? "💰" : "💸"} {typeLabel}登记
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6"
      >
        {/* 类别选择 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {typeLabel}类别<span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
          <label className="block text-sm font-medium mb-2">
            金额（元）<span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="请输入金额"
          />
        </div>

        {/* 关联项目 */}
        <div>
          <label className="block text-sm font-medium mb-2">关联项目/活动名称</label>
          <input
            type="text"
            value={formData.relatedProject}
            onChange={(e) => setFormData({ ...formData, relatedProject: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            placeholder="例：2024年度年会"
          />
        </div>

        {/* 详细说明 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            详细说明<span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            rows={4}
            placeholder="请详细描述事由"
          />
        </div>

        {/* 收款人信息（支出类型需要） */}
        {type === "expense" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">收款人/供应商名称</label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="请输入收款人或供应商名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">收款账号</label>
              <input
                type="text"
                value={formData.recipientAccount}
                onChange={(e) => setFormData({ ...formData, recipientAccount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="银行卡号或支付宝账号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">收款人开户行</label>
              <input
                type="text"
                value={formData.recipientBank}
                onChange={(e) => setFormData({ ...formData, recipientBank: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="例：招商银行股份有限公司"
              />
            </div>

            {/* 工资类需要身份证 */}
            {formData.category === "salary" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  收款人身份证号<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientIdCard}
                  onChange={(e) => setFormData({ ...formData, recipientIdCard: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  placeholder="请输入身份证号"
                />
              </div>
            )}
          </>
        )}

        {/* 银行流水信息（可选） */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3 text-gray-700">银行流水信息（可选）</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">流水号</label>
              <input
                type="text"
                value={formData.transactionNo}
                onChange={(e) => setFormData({ ...formData, transactionNo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="银行流水号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">交易日期</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">摘要</label>
              <input
                type="text"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="例：跨行转账"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">用途</label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="例：往来款"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">账期</label>
              <input
                type="month"
                value={formData.accountPeriod}
                onChange={(e) => setFormData({ ...formData, accountPeriod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>

            {type === "expense" && formData.category === "salary" && (
              <div>
                <label className="block text-sm font-medium mb-2">个人所得税处理</label>
                <select
                  value={formData.taxHandling}
                  onChange={(e) => setFormData({ ...formData, taxHandling: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value="">请选择</option>
                  <option value="withhold">代扣代缴</option>
                  <option value="self">自行申报</option>
                  <option value="none">无需处理</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* 附件上传 */}
        <div>
          <label className="block text-sm font-medium mb-2">附件上传</label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-sm"
            />
            <p className="text-xs text-gray-500 mt-2">支持图片、PDF、Word、Excel文件，单个文件最大10MB</p>

            {uploading && <p className="text-sm text-blue-600 mt-2">上传中...</p>}

            {uploadedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {uploadedFiles.map((file) => (
                  <div key={file.key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.key)}
                      className="ml-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2.5 sm:py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
          >
            {loading ? "提交中..." : "提交申请"}
          </button>
          <Link
            href="/finance"
            className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-2 px-4 rounded-md hover:bg-gray-300 text-center text-sm sm:text-base font-medium"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
