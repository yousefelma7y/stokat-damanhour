"use client";
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Send,
  Zap,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  MoreVertical,
  Settings,
  Bell,
  BarChart3,
  Target,
  CreditCard,
  Activity,
  PieChart as PieChartIcon,
  Package,
  ShoppingCart,
  Calendar,
  Filter,
  TrendingUpIcon,
  X,
  Scale,
  Truck,
  Warehouse,
  HandCoins,
} from "lucide-react";
import axiosClient from "@/lib/axios-client";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { RowsSkeleton, Skeleton, Spinner } from "@/components/Skeleton";
import SeasonSwitcher, {
  ClosedSeasonBanner,
  useSeasonParam,
} from "@/components/seasons/SeasonSwitcher";

const lastThirtyDays = () => ({
  startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
  endDate: format(new Date(), "yyyy-MM-dd"),
});

// ============ COMPONENTS ============

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  comparison,
  loading = false,
}) => (
  <div
    aria-busy={loading}
    className="bg-white hover:shadow-xl shadow-sm p-6 border border-slate-200 rounded-xl transition-all duration-300 hover:border-slate-300 group"
  >
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className="text-slate-600 text-sm font-medium mb-1">{title}</p>
        {loading ? (
          <div className="space-y-2 py-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <>
            <h3 className="text-slate-900 text-2xl font-bold mb-1">{value}</h3>
            {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
          </>
        )}
        {trend !== undefined && (
          <div
            className={`flex items-center mt-2 text-xs font-semibold ${
              trend >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 mr-1" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div
        className={`p-3 rounded-lg text-white group-hover:scale-110 transition-transform ${loading ? "bg-slate-300" : color}`}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const ChartCard = ({
  title,
  children,
  subtitle,
  icon: Icon,
  action,
  loading = false,
  skeleton,
}) => (
  <div aria-busy={loading} className="bg-white shadow-sm p-6 border border-slate-200 rounded-xl">
    <div className="md:flex space-y-2 md:space-y-0 items-center justify-between mb-6">
      <div className="flex items-center gap-3 ">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <div>
          <h3 className="font-bold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-slate-600 text-xs mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {action && action}
    </div>
    <div className="">
      {loading ? skeleton || <Skeleton className="h-[280px] w-full rounded-xl" /> : children}
    </div>
  </div>
);

const TransactionRow = ({ transaction }) => {
  const getTypeIcon = (type) => {
    const icons = {
      payment: <ArrowDownLeft className="w-4 h-4" />,
      transfer: <Send className="w-4 h-4" />,
      service: <Zap className="w-4 h-4" />,
      payroll: <Users className="w-4 h-4" />,
      refund: <ArrowUpRight className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    return status === "completed"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-amber-100 text-amber-800";
  };

  const getArabicType = (type, category) => {
    if (type === "income" && category === "weight_transfer") return "نقل وزن لمحل";
    if (type === "income") return "إيراد مبيعات";
    if (type === "expense") return "مصروفات عامة";
    if (type === "payment") {
      if (category === "adjustment") return "تسوية مالية";
      return "صرف للمورد";
    }
    if (type === "get") return "تحصيل نقدي";
    if (type === "pay") return "دفع نقدي";
    return type;
  };

  const isIncome =
    ["income", "payment", "get"].includes(transaction.type) &&
    transaction.category !== "adjustment";
  // Adjust logic for income: if payment category adjustment, it was a discount/revert (reduction)
  const displayAsIncome = ["income", "get"].includes(transaction.type);

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 border-b border-slate-200 transition-colors last:border-b-0">
      <div
        className={`p-2 rounded-lg ${
          displayAsIncome ? "bg-emerald-100" : "bg-red-100"
        }`}
      >
        <div className={displayAsIncome ? "text-emerald-600" : "text-red-600"}>
          {getTypeIcon(transaction.type)}
        </div>
      </div>

      <div className="flex-1">
        <p className="font-semibold text-slate-900 text-sm">
          {transaction.description}
        </p>
        <p className="text-slate-600 text-xs mt-1">
          <span className="font-bold text-blue-600">
            {getArabicType(transaction.type, transaction.category)}
          </span>{" "}
          • {new Date(transaction.createdAt).toLocaleDateString("ar-EG")}
        </p>
      </div>

      <div className="text-end">
        <p
          className={`font-bold text-sm ${displayAsIncome ? "text-emerald-600" : "text-red-600"}`}
        >
          {displayAsIncome ? "+" : "-"}
          {transaction.amount.toLocaleString()} EGP
        </p>
        <span
          className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(
            transaction.status,
          )}`}
        >
          {transaction.status === "completed" ? "مكتملة" : "قيد الانتظار"}
        </span>
      </div>
    </div>
  );
};

const HealthMetricBar = ({ metric, value, status, color = "bg-blue-500" }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-900">{metric}</span>
        <span className="text-sm font-bold text-slate-700">{value}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const formatKg = (value) =>
  `${Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 3 })} كجم`;

// ============ MAIN COMPONENT ============

export default function ProfessionalFinancialDashboard() {
  const [dateRange, setDateRange] = useState(lastThirtyDays);
  // null = current (open) season; an id = viewing a closed season read-only
  const { seasonId, setSeasonId, ready: seasonReady } = useSeasonParam();
  const [rangeReady, setRangeReady] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      systemBalance: 0,
      totalOrders: 0,
      ordersValue: 0,
      completedOrders: 0,
      inventoryValue: 0,
      retailValue: 0,
      lowStockCount: 0,
    },
    dailyStats: [],
    recentTransactions: [],
  });

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get("/dashboard-stats", {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          season: seasonId || undefined,
        },
      });
      setStats(res.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // A closed season opens on its whole date range; the current one on the last 30 days.
  useEffect(() => {
    if (!seasonReady) return;
    setDateRange(seasonId ? { startDate: "", endDate: "" } : lastThirtyDays());
    setRangeReady(true);
  }, [seasonId, seasonReady]);

  useEffect(() => {
    if (rangeReady) fetchStats();
  }, [dateRange, rangeReady]);

  const exportToCSV = () => {
    if (!stats.dailyStats || stats.dailyStats.length === 0) return;

    const headers = [
      "Date",
      "Income",
      "Expenses",
      "Orders",
      "Orders Value",
      "Profit",
      "Weight Sold (kg)",
      "Weight Transferred (kg)",
    ];
    const rows = stats.dailyStats.map((item) => [
      item.date,
      item.income,
      item.expenses,
      item.orders,
      item.ordersValue,
      item.gain,
      item.weightSold || 0,
      item.weightTransferred || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...rows].map((row) => row.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `system_stats_${dateRange.startDate}_to_${dateRange.endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
// Filter transactions based on selected type
  const filteredTransactions =
    filterType === "all"
      ? stats.recentTransactions
      : stats.recentTransactions.filter((t) => {
          if (filterType === "income")
            return ["income", "get"].includes(t.type);
          if (filterType === "payment")
            return ["payment", "refund"].includes(t.type);
          return t.type === filterType;
        });

  // Data is "loading" from first paint until the first response, and on every refetch.
  const loading = isLoading;
  const weightStock = stats.weightStock || {};

  return (
    <div className="min-h-screen  pb-12" dir="rtl">
      {/* Header */}
      <div className="bg-blue-600 sticky top-0 z-20 shadow-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-8">
            {/* Title Section */}
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-red-400 group-hover:rotate-12 transition-transform" />
                لوحة التحكم الإحصائية
              </h1>
              <p
                className="text-blue-100 text-xs md:text-sm mt-0.5 opacity-90 flex items-center gap-2"
                aria-live="polite"
              >
                {loading ? (
                  <>
                    <Spinner className="w-3.5 h-3.5" />
                    جاري تحميل البيانات...
                  </>
                ) : (
                  "تحليل شامل للأداء المالي والعمليات"
                )}
              </p>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:flex-none">
              <SeasonSwitcher value={seasonId} onChange={setSeasonId} tone="dark" />
              {/* Date Pickers Container */}
              <div className="flex items-center bg-white/10 md:bg-white rounded-xl border border-white/20 md:border-slate-200  p-1.5 shadow-inner flex-1 sm:flex-none">
                <div className="flex items-center gap-2 md:px-2 flex-1">
                  <span className="text-blue-100 md:text-slate-500 text-xs font-bold whitespace-nowrap">
                    من:
                  </span>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="bg-transparent border-none text-sm focus:ring-0 text-white md:text-slate-700 w-full cursor-pointer p-0"
                  />
                </div>

                <div className="h-4 w-px bg-white/20 md:bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-2 px-2 flex-1">
                  <span className="text-blue-100 md:text-slate-500 text-xs font-bold whitespace-nowrap">
                    إلى:
                  </span>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="bg-transparent border-none text-sm focus:ring-0 text-white md:text-slate-700 w-full cursor-pointer p-0"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={exportToCSV}
                  disabled={loading}
                  className="flex flex-1 sm:flex-none cursor-pointer items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  title="تصدير بيانات CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير CSV</span>
                </button>

                <button
                  onClick={() => setDateRange({ startDate: "", endDate: "" })}
                  className="p-2.5 rounded-xl cursor-pointer transition-all bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 active:scale-95"
                  title="مسح الفلاتر"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {!loading && (
          <ClosedSeasonBanner season={stats.season} onBack={() => setSeasonId(null)} />
        )}

        {/* Section: Overview Metrics */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            ملخص الأداء المالي
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              loading={loading}
              title="إجمالي الدخل"
              value={`${stats.summary.totalIncome.toLocaleString()} ج.م`}
              icon={ArrowDownLeft}
              color="bg-emerald-500"
              subtitle="خلال الفترة المختارة"
            />
            <StatCard
              loading={loading}
              title="إجمالي النفقات"
              value={`${stats.summary.totalExpenses.toLocaleString()} ج.م`}
              icon={ArrowUpRight}
              color="bg-red-500"
              subtitle="خلال الفترة المختارة"
            />
            <StatCard
              loading={loading}
              title="صافي الأرباح"
              value={`${stats.summary.netProfit.toLocaleString()} ج.م`}
              icon={TrendingUp}
              color="bg-blue-500"
              subtitle="الأرباح المحققة فعلياً"
            />
            <StatCard
              loading={loading}
              title="الرصيد الكلي"
              value={`${stats.summary.systemBalance.toLocaleString()} ج.م`}
              icon={Wallet}
              color="bg-purple-500"
              subtitle={
                stats.season && !stats.season.isCurrent
                  ? "الرصيد عند إقفال الموسم"
                  : stats.season?.opening?.systemBalance
                    ? `منها ${Number(stats.season.opening.systemBalance).toLocaleString()} ج.م رصيد افتتاحي للموسم`
                    : "رصيد النظام الحالي"
              }
            />
          </div>
        </div>

        {/* Section: Operational Metrics */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            إحصائيات المبيعات والمخزن
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              loading={loading}
              title="عدد الطلبات"
              value={stats.summary.totalOrders}
              icon={ShoppingCart}
              color="bg-orange-500"
              subtitle={`${stats.summary.completedOrders} طلب مكتمل`}
            />
            <StatCard
              loading={loading}
              title="قيمة المبيعات"
              value={`${stats.summary.ordersValue.toLocaleString()} ج.م`}
              icon={CreditCard}
              color="bg-amber-500"
              subtitle="إجمالي قيمة الفواتير"
            />
            <StatCard
              loading={loading}
              title="قيمة المخزون (تكلُفة)"
              value={`${stats.summary.inventoryValue.toLocaleString()} ج.م`}
              icon={Package}
              color="bg-indigo-500"
              subtitle="حسب أسعار الجملة"
            />
            <StatCard
              loading={loading}
              title="تنبيهات النواقص"
              value={stats.summary.lowStockCount}
              icon={Zap}
              color={
                stats.summary.lowStockCount > 0 ? "bg-rose-600" : "bg-slate-400"
              }
              subtitle="منتجات وصلت للحد الأدنى"
            />
          </div>
        </div>

        {/* Section: Weight Storage */}
        {(loading || stats.weightStock) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                مخزن الوزن
              </h2>
              <button
                onClick={() => (window.location.href = "/dashboard/accounting?tab=weight")}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                سجل الحركات
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
              loading={loading}
                title="الرصيد الحالي"
                value={formatKg(weightStock.currentWeight)}
                icon={Warehouse}
                color={
                  Number(weightStock.currentWeight || 0) <= 0
                    ? "bg-rose-600"
                    : weightStock.isLow
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }
                subtitle={
                  weightStock.isLow
                    ? `أقل من حد التنبيه (${formatKg(weightStock.lowStockThreshold)})`
                    : `حد التنبيه ${formatKg(weightStock.lowStockThreshold)}`
                }
              />
              <StatCard
              loading={loading}
                title="المباع بالوزن"
                value={formatKg(weightStock.soldKg)}
                icon={ShoppingCart}
                color="bg-blue-500"
                subtitle="صافي خلال الفترة المختارة"
              />
              <StatCard
              loading={loading}
                title="المنقول للمحلات"
                value={formatKg(weightStock.transferredKg)}
                icon={Truck}
                color="bg-violet-500"
                subtitle={`${weightStock.transfersCount || 0} عملية نقل خلال الفترة`}
              />
              <StatCard
              loading={loading}
                title="قيمة النقل"
                value={`${Number(weightStock.transferValue || 0).toLocaleString()} ج.م`}
                icon={HandCoins}
                color="bg-amber-500"
                subtitle={`المحصل ${Number(weightStock.transferCollected || 0).toLocaleString()} ج.م`}
              />
            </div>

            <ChartCard
            loading={loading}
              title="حركة مخزن الوزن"
              subtitle="الكيلوجرامات المباعة والمنقولة يومياً"
              icon={Scale}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#94a3b8"
                    style={{ fontSize: "10px" }}
                    tickFormatter={(date) => format(new Date(date), "MM/dd")}
                  />
                  <YAxis stroke="#94a3b8" width={40} style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value, name) => [formatKg(value), name]}
                  />
                  <Legend />
                  <Bar dataKey="weightSold" fill="#3b82f6" name="مباع" radius={[4, 4, 0, 0]} />
                  <Bar
                    dataKey="weightTransferred"
                    fill="#8b5cf6"
                    name="منقول للمحلات"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses Chart */}
          <ChartCard
            loading={loading}
            title="تحليل التدفق النقدي"
            subtitle="مقارنة الدخل والمصاريف يومياً"
            icon={TrendingUpIcon}
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.dailyStats}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  style={{ width: "100%" }}
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  style={{ fontSize: "10px" }}
                  tickFormatter={(date) => format(new Date(date), "MM/dd")}
                />
                <YAxis
                  stroke="#94a3b8"
                  width={10}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => `${value.toLocaleString()} ج.م`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                  name="الدخل"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                  name="المصاريف"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Orders Volume Chart */}
          <ChartCard
            loading={loading}
            title="حجم الطلبات"
            subtitle="عدد الطلبات اليومية المحققة"
            icon={ShoppingCart}
          >
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  style={{ fontSize: "10px" }}
                  tickFormatter={(date) => format(new Date(date), "MM/dd")}
                />
                <YAxis
                  stroke="#94a3b8"
                  width={10}
                  style={{ fontSize: "12px" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [`${value} طلب`, "العدد"]}
                />
                <Bar
                  dataKey="orders"
                  fill="#3b82f6"
                  name="الطلبات"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Lower Grid: System Health and Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            loading={loading}
            skeleton={<RowsSkeleton count={4} />}
            title="حالة مخزون المنتجات"
            subtitle="متابعة كميات المنتجات المتوفرة والنواقص"
            icon={Package}
          >
            <div className="space-y-4">
              {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {stats.lowStockProducts.map((product) => (
                    <div key={product._id} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {product.model} - {product.size}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            product.stock <= 0
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {product.stock} قطع
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            product.stock <= 0 ? "bg-red-500" : "bg-amber-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (product.stock / (product.minStock || 10)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <button
                      onClick={() =>
                        (window.location.href = "/dashboard/products")
                      }
                      className="w-full py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                    >
                      عرض كافة تفاصيل المخزن
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center bg-emerald-50 rounded-xl border border-emerald-100">
                  <Zap className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-emerald-800 text-sm font-bold">
                    المخزون مكتمل
                  </p>
                  <p className="text-emerald-700 text-xs mt-1">
                    لا توجد منتجات تحت حد النواقص حالياً
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-600 font-medium">
                    إجمالي عدد الأصناف:
                  </span>
                  <span className="font-bold text-slate-900">
                    {stats.summary.totalProductsCount} صنف
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">
                    أصناف تحت حد النواقص:
                  </span>
                  <span
                    className={`font-bold ${stats.summary.lowStockCount > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {stats.summary.lowStockCount} صنف
                  </span>
                </div>
              </div>
            </div>
          </ChartCard>

          <div className="lg:col-span-2">
            <ChartCard
              loading={loading}
              skeleton={<RowsSkeleton count={5} />}
              title="سجل المعاملات النقدية"
              subtitle="آخر العمليات المالية المسجلة في الخزينة"
              icon={Activity}
              action={
                <div className="flex justify-between gap-1 bg-slate-100 p-1 rounded-lg">
                  {["all", "income", "payment"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-3 py-1 w-1/3 rounded-md text-xs font-bold transition-all ${
                        filterType === type
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {type === "all" && "الكل"}
                      {type === "income" && "الإيرادات"}
                      {type === "payment" && "المصروفات"}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="border border-slate-100 rounded-lg overflow-hidden mt-2">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TransactionRow
                      key={transaction._id}
                      transaction={transaction}
                    />
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    لا توجد معاملات متاحة لهذه الفترة
                  </div>
                )}
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  );
}
