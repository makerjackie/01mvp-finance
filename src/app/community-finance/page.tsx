"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CommunityStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function CommunityFinancePage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/finance/public/stats");
      const result = await res.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <p className="text-lg text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* 头部 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">社区财务公开</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            透明公开的社区财务数据，让每一笔收支都清晰可见
          </p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
            {/* 总收入 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-t-4 border-green-500 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl sm:text-4xl">💰</div>
                <div className="text-xs sm:text-sm font-medium text-gray-500 bg-green-50 px-3 py-1 rounded-full">
                  收入
                </div>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600 mb-2">
                ¥{stats.totalIncome.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">社区总收入</p>
            </div>

            {/* 总支出 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-t-4 border-red-500 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl sm:text-4xl">💸</div>
                <div className="text-xs sm:text-sm font-medium text-gray-500 bg-red-50 px-3 py-1 rounded-full">
                  支出
                </div>
              </div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-red-600 mb-2">
                ¥{stats.totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">社区总支出</p>
            </div>

            {/* 当前余额 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-t-4 border-blue-500 transform hover:scale-105 transition-transform sm:col-span-1 col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl sm:text-4xl">💵</div>
                <div className="text-xs sm:text-sm font-medium text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                  余额
                </div>
              </div>
              <div
                className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ${
                  stats.balance >= 0 ? "text-blue-600" : "text-orange-600"
                }`}
              >
                ¥{stats.balance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">当前余额</p>
            </div>
          </div>
        )}

        {/* 说明卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">关于社区财务</h2>
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600">
            <div className="flex items-start gap-3">
              <div className="text-xl sm:text-2xl mt-1">✅</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">透明公开</h3>
                <p>所有社区财务数据实时更新，确保每一笔收支都公开透明</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl sm:text-2xl mt-1">🔒</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">审核机制</h3>
                <p>所有财务申请都需要经过管理员审核，确保资金使用合理</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-xl sm:text-2xl mt-1">📊</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">实时统计</h3>
                <p>数据实时更新，展示的是已审核通过的社区账目统计</p>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/finance"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            进入财务系统
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            返回首页
          </Link>
        </div>

        {/* 页脚 */}
        <div className="text-center mt-8 sm:mt-12 text-xs sm:text-sm text-gray-500">
          <p>数据更新时间：{new Date().toLocaleString("zh-CN")}</p>
          <p className="mt-2">仅展示已审核通过的社区账目数据</p>
        </div>
      </div>
    </div>
  );
}
