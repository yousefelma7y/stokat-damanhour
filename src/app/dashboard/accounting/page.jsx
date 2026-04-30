"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  TrendingUp,
  TrendingDown,
  Eye,
  Download,
  Filter,
  Search,
  Plus,
  MoreVertical,
  Check,
  X,
  Clock,
  DollarSign,
  Users,
  Building2,
  Wallet,
  Activity,
  ChevronDown,
  Calendar,
  SeparatorVertical,
  ArrowLeftRight,
} from "lucide-react";
import Pagination from "../../../components/Pagination";
import PaymentMethodSelect from "../../../components/PaymentMethodSelect";
import axiosClient from "@/lib/axios-client";
import { useDebounce } from "use-debounce";
import FiltersCombonent from "../../../components/FiltersCombonent";

// ============ SKELETON COMPONENTS ============

const StatCardSkeleton = () => (
  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 border border-slate-200 rounded-xl animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="bg-slate-200 rounded-lg w-10 h-10"></div>
      <div className="bg-slate-200 rounded w-16 h-5"></div>
    </div>
    <div className="space-y-2">
      <div className="bg-slate-200 rounded w-24 h-4"></div>
      <div className="bg-slate-200 rounded w-32 h-8"></div>
    </div>
  </div>
);

const TransactionRowSkeleton = () => (
  <div className="px-4 sm:px-6 py-4 border-slate-200 border-b animate-pulse">
    <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4">
      <div className="flex flex-1 items-center gap-3 sm:gap-4">
        <div className="bg-slate-200 rounded-lg w-10 h-10 shrink-0"></div>
        <div className="flex-1 space-y-2 min-w-0">
          <div className="bg-slate-200 rounded w-48 h-4"></div>
          <div className="bg-slate-200 rounded w-32 h-3"></div>
        </div>
      </div>

      <div className="flex justify-between sm:justify-end items-center gap-4 sm:gap-6">
        <div className="space-y-2">
          <div className="bg-slate-200 rounded w-24 h-6"></div>
          <div className="bg-slate-200 rounded w-20 h-3"></div>
        </div>
        <div className="bg-slate-200 rounded-full w-20 h-6"></div>
      </div>
    </div>
  </div>
);

const LoadingOverlay = () => (
  <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm rounded-xl">
    <div className="flex flex-col items-center gap-3">
      <div className="border-blue-600 border-b-2 rounded-full w-8 h-8 animate-spin"></div>
      <p className="font-medium text-slate-600 text-sm">جاري التحميل...</p>
    </div>
  </div>
);

// ============ COMPONENTS ============

const StatCard = ({ icon: Icon, label, value, change, trend }) => (
  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 border border-slate-200 hover:border-slate-300 rounded-xl transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className="bg-white p-2.5 rounded-lg">
        <Icon className={`w-5 h-5 text-blue-600`} />
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            trend === "up" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          {change}%
        </div>
      )}
    </div>
    <p className="mb-1 text-slate-600 text-sm">{label}</p>
    <p className="font-bold text-slate-900 text-2xl">{value}</p>
  </div>
);

const TransactionRow = ({ transaction, onViewDetails }) => {
  const getStatusColor = (status) => {
    const colors = {
      completed: "bg-emerald-100 text-emerald-800",
      pending: "bg-amber-100 text-amber-800",
      failed: "bg-red-100 text-red-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-slate-100 text-slate-800";
  };

  // Determine visual direction
  const isTransfer = transaction.type === "transfer";
  const isOutgoing = transaction.type === "payment";
  const isCancelledOrder = transaction.category === "cancelled_order";
  const isDebtSettlementRefund =
    transaction.category === "debt_settlement_refund";
  const transactionLabel = isTransfer
    ? "تحويل"
    : isDebtSettlementRefund
      ? "رد تسوية"
    : isCancelledOrder
      ? "إلغاء طلب"
      : isOutgoing
        ? "صرف"
        : "تحصيل";

  return (
    <div
      className="hover:bg-slate-50 px-4 sm:px-6 py-4 border-slate-200 border-b transition-colors cursor-pointer"
      onClick={() => onViewDetails(transaction)}
    >
      <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-3 sm:gap-4">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              isTransfer
                ? "bg-blue-100"
                : isOutgoing
                  ? "bg-red-100"
                  : "bg-emerald-100"
            }`}
          >
            {isTransfer ? (
              <ArrowLeftRight className="w-4 h-4 text-blue-500" />
            ) : isOutgoing ? (
              <ArrowDownLeft className="w-4 h-4 text-red-500" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="mb-0.5 sm:mb-1 font-semibold text-slate-900 text-sm sm:text-base truncate">
              {transaction.description || "معاملة مالية"}
            </p>
            <p className="flex flex-wrap items-center gap-1 sm:gap-2 text-[10px] text-slate-500 sm:text-xs">
              <span className="max-w-[80px] sm:max-w-none truncate">
                {transaction.from || "غير معروف"}
              </span>
              <span>→</span>
              <span className="max-w-[80px] sm:max-w-none truncate">
                {transaction.to || "غير معروف"}
              </span>
              {transaction.paymentMethod && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="text-indigo-500 font-medium">
                    {transaction.paymentMethod}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-between sm:justify-end items-center gap-4 sm:gap-6">
          <div className="text-left sm:text-right">
            <p
              className={`font-bold text-base sm:text-lg ${
                isTransfer
                  ? "text-blue-600"
                  : isOutgoing
                    ? "text-red-600"
                    : "text-emerald-600"
              }`}
            >
              {isTransfer ? "" : isOutgoing ? "-" : "+"}
              {transaction.amount.toLocaleString()} EGP
            </p>
            <p className="mt-0.5 sm:mt-1 text-[10px] text-slate-500 sm:text-xs">
              {transactionLabel}
            </p>
          </div>

          <div
            className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${getStatusColor(
              transaction.status,
            )}`}
          >
            {transaction.status === "completed" && (
              <Check className="inline mr-1 w-3 h-3" />
            )}
            {transaction.status === "pending" && (
              <Clock className="inline mr-1 w-3 h-3" />
            )}
            {transaction.status === "cancelled" && (
              <X className="inline mr-1 w-3 h-3" />
            )}
            {transaction.status === "completed"
              ? "مكتملة"
              : transaction.status === "pending"
                ? "معلقة"
                : transaction.status === "cancelled"
                  ? "طلب ملغي"
                  : "فشلت"}
          </div>
        </div>
      </div>
    </div>
  );
};

const ManualTransactionModal = ({ isOpen, onClose, mode, onSubmit }) => {
  const [type, setType] = useState(mode?.type || "get");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode?.type) setType(mode.type);
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit && amount) {
      setIsLoading(true);
      await onSubmit({
        type,
        amount: parseFloat(amount),
        description,
        category,
        paymentMethodId,
      });
      setIsLoading(false);
      setAmount("");
      setDescription("");
      setCategory("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-end sm:items-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white sm:rounded-xl rounded-t-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="top-0 sticky flex justify-between items-center bg-white px-6 py-4 border-slate-200 border-b">
          <h3 className="font-bold text-slate-900 text-lg">
            تسجيل معاملة يدوية
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block mb-1 font-medium text-sm">
              نوع المعاملة
            </label>
            <div className="gap-2 grid grid-cols-2">
              <button
                type="button"
                onClick={() => setType("get")}
                className={`py-2 cursor-pointer rounded-lg border font-medium transition-colors ${type === "get" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"}`}
              >
                <div className="flex justify-center items-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>تحصيل (+)</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType("pay")}
                className={`py-2 cursor-pointer rounded-lg border font-medium transition-colors ${type === "pay" ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-slate-200 hover:border-red-300"}`}
              >
                <div className="flex justify-center items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>صرف (-)</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              المبلغ (EGP)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="0.00"
            />
          </div>

          {/* Payment Method Selector */}
          <PaymentMethodSelect
            value={paymentMethodId}
            onChange={(id) => setPaymentMethodId(id)}
            label="وسيلة الدفع (المحفظة)"
            required
          />

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              التصنيف (اختياري)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="مثلاً: رواتب، إيجار، مشتريات..."
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              البيان / الوصف
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              rows="3"
              placeholder="اكتب وصفاً للمعاملة..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium text-slate-900 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-2 cursor-pointer text-white font-medium rounded-lg transition-colors ${
                type === "get"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "جاري الحفظ..." : "تأكيد العملية"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ========== TRANSFER MODAL ==========
const TransferModal = ({ isOpen, onClose, onSubmit }) => {
  const [amount, setAmount] = useState("");
  const [fromWallet, setFromWallet] = useState(null);
  const [toWallet, setToWallet] = useState(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromWallet || !toWallet || !amount) return;
    setIsLoading(true);
    await onSubmit({
      fromWallet,
      toWallet,
      amount: parseFloat(amount),
      description,
    });
    setIsLoading(false);
    setAmount("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-end sm:items-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white sm:rounded-xl rounded-t-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="top-0 sticky flex justify-between items-center bg-white px-6 py-4 border-slate-200 border-b">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            تحويل بين المحافظ
          </h3>
          <button
            onClick={onClose}
            className="hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <PaymentMethodSelect
            value={fromWallet}
            onChange={(id) => setFromWallet(id)}
            label="من محفظة (المصدر)"
            excludeId={toWallet}
            required
          />

          <div className="flex justify-center">
            <div className="p-2 bg-blue-50 rounded-full border-2 border-blue-200">
              <ArrowDownLeft className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <PaymentMethodSelect
            value={toWallet}
            onChange={(id) => setToWallet(id)}
            label="إلى محفظة (الهدف)"
            excludeId={fromWallet}
            required
          />

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              المبلغ (EGP)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="px-4 py-3 border border-slate-200 focus:border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 w-full text-lg font-bold"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
              rows="2"
              placeholder="سبب التحويل..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg font-medium text-slate-900 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading || !fromWallet || !toWallet || !amount}
              className={`flex-1 px-4 py-2 cursor-pointer text-white font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 ${
                isLoading || !fromWallet || !toWallet || !amount
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isLoading ? "جاري التحويل..." : "تأكيد التحويل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DetailsModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const isOutgoing = transaction.type === "payment";
  const isTransfer = transaction.type === "transfer";
  const isCancelledOrder = transaction.category === "cancelled_order";
  const isDebtSettlementRefund =
    transaction.category === "debt_settlement_refund";
  const transactionLabel = isTransfer
    ? "تحويل"
    : isDebtSettlementRefund
      ? "رد تسوية"
    : isCancelledOrder
      ? "إلغاء طلب"
      : isOutgoing
        ? "صرف"
        : "تحصيل";
  const categoryLabels = {
    cancelled_order: "إلغاء طلب",
    debt_settlement_refund: "رد تسوية مديونية",
    adjustment: "تعديل",
    debt_settlement: "تسوية مديونية",
    sales: "مبيعات",
    income: "تحصيل",
    expense: "صرف",
    transfer: "تحويل",
  };
  const statusLabels = {
    completed: "مكتملة",
    pending: "معلقة",
    failed: "فشلت",
    cancelled: "طلب ملغي",
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-end sm:items-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white sm:rounded-xl rounded-t-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="top-0 sticky flex justify-between items-center bg-white px-6 py-4 border-slate-200 border-b">
          <h3 className="font-bold text-slate-900 text-lg">تفاصيل العملية</h3>
          <button
            onClick={onClose}
            className="hover:bg-slate-100 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Header Info */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border border-blue-200 rounded-lg">
            <p className="mb-1 text-blue-600 text-sm">رقم العملية</p>
            <p className="font-bold text-blue-900 text-2xl">
              {transaction.transactionId || transaction._id}
            </p>
          </div>

          {/* Amount */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-600 text-sm">المبلغ</span>
              <span
                className={`text-3xl font-bold ${
                  isTransfer
                    ? "text-blue-600"
                    : isOutgoing
                      ? "text-red-600"
                      : "text-emerald-600"
                }`}
              >
                {isTransfer ? "" : isOutgoing ? "-" : "+"}
                {transaction.amount.toLocaleString()} EGP
              </span>
            </div>
          </div>

          {/* From / To */}
          <div className="gap-4 grid grid-cols-2">
            <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
              <p className="mb-2 text-red-600 text-xs">من</p>
              <p className="font-semibold text-slate-900">
                {transaction.from || "غير معروف"}
              </p>
            </div>

            <div className="bg-emerald-50 p-4 border border-emerald-200 rounded-lg">
              <p className="mb-2 text-emerald-600 text-xs">إلى</p>
              <p className="font-semibold text-slate-900">
                {transaction.to || "غير معروف"}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="gap-4 grid grid-cols-2">
            <div>
              <p className="mb-1 text-slate-600 text-xs">النوع</p>
              <p className="font-semibold text-slate-900">
                {transactionLabel}
              </p>
            </div>
            <div>
              <p className="mb-1 text-slate-600 text-xs">الفئة</p>
              <p className="font-semibold text-slate-900 capitalize">
                {categoryLabels[transaction.category] || transaction.category || "-"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-slate-600 text-xs">وسيلة الدفع</p>
              <p className="font-semibold text-indigo-600">
                {transaction.paymentMethod || "نقداً"}
              </p>
            </div>
            <div>
              <p className="mb-1 text-slate-600 text-xs">الحالة</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  transaction.status === "completed"
                    ? "bg-emerald-100 text-emerald-800"
                    : transaction.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {statusLabels[transaction.status] || transaction.status}
              </span>
            </div>
          </div>

          {/* Description */}
          {transaction.description && (
            <div>
              <p className="mb-2 font-semibold text-slate-900 text-sm">
                البيان
              </p>
              <p className="bg-slate-50 p-3 rounded-lg text-slate-600">
                {transaction.description}
              </p>
            </div>
          )}

          {/* Balance After */}
          {transaction.balanceAfter !== undefined && (
            <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
              <p className="mb-1 text-blue-600 text-sm">الرصيد بعد العملية</p>
              <p className="font-bold text-blue-900 text-xl">
                {transaction.balanceAfter.toLocaleString()} EGP
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <p className="font-semibold text-slate-900 text-sm">
              المسار الزمني
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-slate-300 rounded-full w-2 h-2"></div>
                <span className="text-slate-600">تم الإنشاء:</span>
                <span className="font-medium text-slate-900">
                  {new Date(transaction.createdAt).toLocaleString("ar-EG")}
                </span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg w-full font-medium text-white transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

const FilteredStatsSection = ({ stats, visible }) => {
  if (!visible) return null;

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
        <h2 className="font-bold text-slate-900 text-lg">تحليل النتائج المصفاة</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all border-r-4 border-r-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-slate-500 text-xs font-bold">عدد العمليات</span>
          </div>
          <p className="text-xl font-black text-slate-900">{stats.totalCount}</p>
        </div>
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all border-r-4 border-r-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-slate-500 text-xs font-bold">إجمالي التحصيل</span>
          </div>
          <p className="text-xl font-black text-emerald-600">{stats.totalIncome.toLocaleString()} EGP</p>
        </div>
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all border-r-4 border-r-red-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-xl">
              <TrendingDown className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-slate-500 text-xs font-bold">إجمالي الصرف</span>
          </div>
          <p className="text-xl font-black text-red-600">{stats.totalExpenses.toLocaleString()} EGP</p>
        </div>
        <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all border-r-4 border-r-indigo-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-slate-500 text-xs font-bold">صافي التقفيل</span>
          </div>
          <p className={`text-xl font-black ${stats.netChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {stats.netChange.toLocaleString()} EGP
          </p>
        </div>
      </div>
    </div>
  );
};

// ============ CONSTANTS ============
const transactionTypes = [
  { _id: "income", name: "تحصيل" },
  { _id: "payment", name: "صرف" },
];

const transactionStatuses = [
  { _id: "completed", name: "مكتملة" },
  { _id: "pending", name: "معلقة" },
  { _id: "failed", name: "فشلت" },
  { _id: "cancelled", name: "طلب ملغي" },
];

// ============ MAIN COMPONENT ============

export default function AccountingSystem() {
  const [transactions, setTransactions] = useState([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchValue] = useDebounce(searchTerm, 1000);
  const [filterStatus, setFilterStatus] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [type, setType] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    systemBalance: 0,
  });

  const [filteredStats, setFilteredStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalTransfers: 0,
    netChange: 0,
    totalCount: 0,
  });

  const fetchData = async (isFilterChange = false) => {
    if (isFilterChange) {
      setIsFilterLoading(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = {
        page,
        limit,
        search: searchValue,
      };

      if (filterStatus) params.status = filterStatus;
      if (paymentMethodId) params.paymentMethodId = paymentMethodId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (type) params.type = type;

      const [txnRes, statsRes, pmRes] = await Promise.all([
        axiosClient.get("/transactions", { params }),
        axiosClient.get("/dashboard-stats"),
        axiosClient.get("/payment-methods"),
      ]);

      setTransactions(txnRes.data.data);
      setTotalPages(txnRes.data.pages || 1);
      setTotal(txnRes.data.total || 0);
      setFilteredStats(
        txnRes.data.stats || {
          totalIncome: 0,
          totalExpenses: 0,
          totalTransfers: 0,
          netChange: 0,
          totalCount: 0,
        },
      );
      setSummary(statsRes.data.data.summary);
      setPaymentMethods(pmRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch accounting data:", error);
    } finally {
      if (isFilterChange) {
        setIsFilterLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchValue, filterStatus, paymentMethodId, startDate, endDate, type]);

  useEffect(() => {
    if (isLoading) {
      fetchData(false);
    } else {
      fetchData(true);
    }
  }, [
    page,
    limit,
    searchValue,
    filterStatus,
    paymentMethodId,
    startDate,
    endDate,
    type,
  ]);

  const handleTransferSubmit = async (transferData) => {
    try {
      await axiosClient.post("/transactions", {
        type: transferData.type,
        amount: transferData.amount,
        description: transferData.description,
        category: transferData.category,
        paymentMethodId: transferData.paymentMethodId,
        status: "completed",
      });

      await fetchData(true);
      setTransferOpen(false);
    } catch (error) {
      console.error("Failed to submit transaction:", error);
      alert(error?.response?.data?.message || "فشل تسجيل المعاملة");
    }
  };

  const handleWalletTransfer = async (data) => {
    try {
      await axiosClient.post("/transactions", {
        type: "transfer",
        amount: data.amount,
        fromWallet: data.fromWallet,
        toWallet: data.toWallet,
        description: data.description,
      });

      await fetchData(true);
      setTransferModalOpen(false);
    } catch (error) {
      console.error("Failed to transfer:", error);
      alert(error?.response?.data?.message || "فشل التحويل");
    }
  };

  // No longer needed to filter in memory
  const filteredTransactions = transactions;

  if (isLoading) {
    return (
      <div className="min-h-screen" dir="rtl">
        <div className="px-6 py-6 border-slate-200 border-b">
          <div className="mx-auto">
            <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
              <div className="space-y-2">
                <div className="bg-slate-200 rounded w-32 h-8 animate-pulse"></div>
                <div className="bg-slate-200 rounded w-48 h-4 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="bg-slate-200 rounded-lg w-32 h-10 animate-pulse"></div>
                <div className="bg-slate-200 rounded-lg w-32 h-10 animate-pulse"></div>
              </div>
            </div>

            <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
          </div>
        </div>

        <div className="mx-auto px-6 py-8">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="bg-slate-200 rounded w-40 h-6 animate-pulse"></div>
              <div className="flex gap-3">
                <div className="bg-slate-200 rounded-lg w-64 h-10 animate-pulse"></div>
                <div className="bg-slate-200 rounded-lg w-32 h-10 animate-pulse"></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
              <TransactionRowSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
      <div className="px-6 py-6 border-slate-200 border-b">
        <div className="mx-auto">
          <div className="flex sm:flex-row flex-col justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="font-bold text-slate-900 text-2xl sm:text-3xl">
                الحسابات
              </h1>
              <p className="mt-1 text-slate-600">
                إدارة جميع المعاملات المالية
              </p>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              {/* <button
                disabled={paymentMethods?.length === 0}
                onClick={() => setTransferModalOpen(true)}
                className="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 px-4 sm:px-6 py-2 rounded-lg font-medium text-white text-sm sm:text-base transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeftRight className="w-4 h-4" />
                تحويل بين المحافظ
              </button> */}
              <button
                disabled={paymentMethods?.length === 0}
                onClick={() => {
                  setSelectedAccount({
                    entity_name: "مدفوعات يدوية",
                    account_type: "manual_pay",
                    type: "pay",
                  });
                  setTransferOpen(true);
                }}
                className="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 px-4 sm:px-6 py-2 rounded-lg font-medium text-white text-sm sm:text-base transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowDownLeft className="w-4 h-4" />
                صرف مبلغ
              </button>
              <button
                disabled={paymentMethods?.length === 0}
                onClick={() => {
                  setSelectedAccount({
                    entity_name: "إيرادات يدوية",
                    account_type: "manual_get",
                    type: "get",
                  });
                  setTransferOpen(true);
                }}
                className="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 px-4 sm:px-6 py-2 rounded-lg font-medium text-white text-sm sm:text-base transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="w-4 h-4" />
                تحصيل مبلغ
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={DollarSign}
              label="الرصيد في الخزينة"
              value={`${summary.systemBalance.toLocaleString()} EGP`}
              change={0}
              trend="up"
            />
            <StatCard
              icon={ArrowDownLeft}
              label="إجمالي الدخل"
              value={`${summary.totalIncome.toLocaleString()} EGP`}
              change={0}
              trend="up"
            />
            <StatCard
              icon={ArrowUpRight}
              label="إجمالي المصاريف"
              value={`${summary.totalExpenses.toLocaleString()} EGP`}
              change={0}
              trend="down"
            />
            <StatCard
              icon={TrendingUp}
              label="صافي الأرباح"
              value={`${summary.netProfit.toLocaleString()} EGP`}
              change={0}
              trend="up"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-6 py-8">
        <FilteredStatsSection
          stats={filteredStats}
          visible={
            !!(
              searchTerm ||
              filterStatus ||
              paymentMethodId ||
              startDate ||
              endDate ||
              type
            )
          }
        />

        {/* Transactions Section */}
        <div>
          <div className="mb-2">
            <h2 className="font-bold text-slate-900 text-xl p-4">
              سجل العمليات المالية
            </h2>
            <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <FiltersCombonent
                searchField={true}
                search={searchTerm}
                setSearch={setSearchTerm}
                placeholder="بحث في المعاملات..."
                dateRange={true}
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                onClearDateRange={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                comboBoxes={[
                  {
                    placeholder: "طريقة الدفع",
                    value: paymentMethodId,
                    onChange: setPaymentMethodId,
                    items: paymentMethods,
                    byId: true,
                  },
                  {
                    placeholder: "النوع",
                    value: type,
                    onChange: setType,
                    items: transactionTypes,
                    byId: true,
                  },
                  {
                    placeholder: "الحالة",
                    value: filterStatus,
                    onChange: setFilterStatus,
                    items: transactionStatuses,
                    byId: true,
                  },
                ]}
              />
            </div>
          </div>

          <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden">
            {isFilterLoading && <LoadingOverlay />}

            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                  onViewDetails={(txn) => {
                    setSelectedTransaction(txn);
                    setDetailsOpen(true);
                  }}
                />
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <Activity className="mx-auto mb-3 w-12 h-12 text-slate-300" />
                <p className="text-slate-600">لا توجد معاملات</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                limit={limit}
                onLimitChange={setLimit}
              />
            </div>
          )}
        </div>
      </div>

      <ManualTransactionModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        mode={selectedAccount}
        onSubmit={handleTransferSubmit}
      />

      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSubmit={handleWalletTransfer}
      />

      <DetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
