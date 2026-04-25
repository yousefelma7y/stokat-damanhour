import React, { useEffect, useState } from "react";
import Modal from "../../../components/Modal";
import {
  FileText,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import { NumericFormat } from "react-number-format";
import axiosClient from "@/lib/axios-client";

export default function ShiftSummaryReportModal({ open, setOpen, summary }) {
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && summary) {
      setLoading(true);
      // Fetch Orders and Transactions for the user in that time range
      Promise.all([
        axiosClient.get(`/orders`, {
          params: {
            createdBy: summary.userName,
            startDate: new Date(summary.startTime).toISOString(),
            endDate: new Date(summary.endTime).toISOString(),
            limit: 1000, // get all for the report
          },
        }),
        axiosClient.get(`/transactions`, {
          params: {
            createdBy: summary.userName,
            startDate: new Date(summary.startTime).toISOString(),
            endDate: new Date(summary.endTime).toISOString(),
            limit: 1000,
          },
        }),
      ])
        .then(([ordersRes, transRes]) => {
          setOrders(ordersRes.data.data || []);
          setTransactions(transRes.data.data || []);
        })
        .catch((err) => {
          console.error("Error fetching report details", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, summary]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!summary) return null;
  const expectedChange = transactions.reduce((sum, t) => {
    if (t.type === "income") return sum + t.amount;
    if (t.type === "payment") return sum - t.amount;
    return sum;
  }, 0);

  const differenceFromExpected = summary.totalDifference - expectedChange;

  return (
    <Modal maxWidth="4xl" bgWhite open={open} setOpen={setOpen}>
      <div className="p-4 w-full max-h-[90vh] overflow-y-auto" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
          <div className="md:flex items-start gap-3">
            <div className="bg-fuchsia-100 p-3 rounded-xl w-1/5 md:w-1/10">
              <FileText className="w-6 h-6 text-fuchsia-600" />
            </div>
            <div className="w-full">
              <h2 className="font-bold text-gray-900 text-md md:text-lg">
                تقرير جرد الوردية
              </h2>
              <div className="md:flex justify-start items-center space-x-4">
                <p className="mt-1 text-gray-500 text-sm">
                  الموظف:{" "}
                  <span className="font-bold text-green-800 ">
                    {summary.user?.userName || summary.userName}
                  </span>
                </p>
                <p className="mt-0.5 text-gray-500 text-xs">
                  من: {formatDate(summary.startTime)} — إلى:{" "}
                  {formatDate(summary.endTime)}
                </p>
              </div>
            </div>
          </div>
          {!loading && (
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                differenceFromExpected < 0
                  ? "bg-red-100 text-red-700"
                  : differenceFromExpected > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {differenceFromExpected < 0
                ? "عجز"
                : differenceFromExpected > 0
                  ? "زيادة"
                  : "مطابق"}
            </span>
          )}
        </div>

        {/* Totals Summary */}
        <div className="gap-3 grid grid-cols-1 sm:grid-cols-3 mb-6">
          <div className="bg-gray-50 p-3 sm:p-4 border border-gray-100 rounded-xl text-center">
            <p className="mb-1 font-medium text-gray-600 text-xs sm:text-sm">
              بداية الوردية
            </p>
            <p className="font-bold text-gray-900 text-base sm:text-lg">
              <NumericFormat
                value={summary.totalSystem}
                displayType="text"
                thousandSeparator
                suffix=" ج.م"
              />
            </p>
          </div>
          <div className="bg-blue-50 p-3 sm:p-4 border border-blue-100 rounded-xl text-center">
            <p className="mb-1 font-medium text-blue-600 text-xs sm:text-sm">
              نهاية الوردية
            </p>
            <p className="font-bold text-blue-800 text-base sm:text-lg">
              <NumericFormat
                value={summary.totalActual}
                displayType="text"
                thousandSeparator
                suffix=" ج.م"
              />
            </p>
          </div>
          <div
            className={`p-3 sm:p-4 rounded-xl border text-center ${
              differenceFromExpected < 0
                ? "bg-red-50 border-red-100"
                : differenceFromExpected > 0
                  ? "bg-amber-50 border-amber-100"
                  : "bg-emerald-50 border-emerald-100"
            }`}
          >
            <p
              className={`mb-1 font-medium text-sm ${
                differenceFromExpected < 0
                  ? "text-red-600"
                  : differenceFromExpected > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              الفرق عن المتوقع
            </p>
            <p
              className={`font-bold text-lg flex items-center justify-center gap-1 ${
                differenceFromExpected < 0
                  ? "text-red-700"
                  : differenceFromExpected > 0
                    ? "text-amber-700"
                    : "text-emerald-700"
              }`}
            >
              <NumericFormat
                value={summary.totalDifference}
                displayType="text"
                thousandSeparator
                suffix=" ج.م"
                prefix={summary.totalDifference > 0 ? "+" : ""}
              />
            </p>
          </div>
        </div>

        {/* Wallets Breakdown */}
        <div className="mb-8">
          <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-800 uppercase">
            <Wallet className="w-4 h-4 text-indigo-500" />
            مقارنة المحافظ
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">المحفظة</th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                    بداية الوردية
                  </th>
                  <th className="px-4 py-3 font-semibold text-center whitespace-nowrap">
                    نهاية الوردية
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">
                    صافي الحركة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.wallets.map((w, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {w.name}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">
                      <NumericFormat
                        value={w.systemAmount}
                        displayType="text"
                        thousandSeparator
                        suffix=" ج.م"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600 font-bold">
                      <NumericFormat
                        value={w.actualAmount}
                        displayType="text"
                        thousandSeparator
                        suffix=" ج.م"
                      />
                    </td>
                    <td
                      className={`px-4 py-3 text-center font-bold ${
                        w.difference < 0
                          ? "text-red-500"
                          : w.difference > 0
                            ? "text-emerald-500"
                            : "text-gray-400"
                      }`}
                    >
                      <NumericFormat
                        value={w.difference}
                        displayType="text"
                        thousandSeparator
                        suffix=" ج.م"
                        prefix={w.difference > 0 ? "+" : ""}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500 text-sm animate-pulse">
            جاري تحميل حركات الوردية...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Orders */}
            <div>
              <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-800">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                الطلبات المنفذة ({orders.length})
              </h3>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-1 max-h-64 overflow-y-auto">
                {!orders || orders.length === 0 ? (
                  <p className="text-gray-400 text-xs p-3 text-center">
                    لا توجد طلبات في هذه الوردية
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {(orders || []).map((o) => (
                      <li
                        key={o._id}
                        className="bg-white p-3 rounded-lg border border-gray-100 text-xs flex justify-between items-center shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {o.orderNumber}
                          </p>
                          <p className="text-gray-500 mt-0.5">
                            {o.order_type === "regular" ? "بيع" : o.order_type}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-green-600">
                            <NumericFormat
                              value={o.total}
                              displayType="text"
                              thousandSeparator
                              suffix=" ج.م"
                            />
                          </p>
                          <p className="text-gray-400 mt-0.5">
                            {o.paymentMethodId?.name || o.paymentMethod}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Transactions */}
            <div>
              <h3 className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-800">
                <Receipt className="w-4 h-4 text-emerald-500" />
                الحركات المالية ({(transactions || []).length})
              </h3>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-1 max-h-64 overflow-y-auto">
                {!transactions || transactions.length === 0 ? (
                  <p className="text-gray-400 text-xs p-3 text-center">
                    لا توجد حركات مالية في هذه الوردية
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {transactions.map((t) => (
                      <li
                        key={t._id}
                        className="bg-white p-3 rounded-lg border border-gray-100 text-xs flex justify-between items-center shadow-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {t.type === "transfer"
                              ? "تحويل محافظ"
                              : t.category === "income"
                                ? "تحصيل/إيداع"
                                : t.category === "expense"
                                  ? "صرف/سحب"
                                  : "أخرى"}
                          </p>
                          <p
                            className="text-gray-500 mt-0.5 truncate max-w-[120px]"
                            title={t.description}
                          >
                            {t.description || "بدون ملاحظات"}
                          </p>
                        </div>
                        <div className="text-left">
                          <p
                            className={`font-bold ${
                              t.type === "transfer"
                                ? "text-blue-600"
                                : t.type === "income"
                                  ? "text-emerald-600"
                                  : "text-red-600"
                            }`}
                          >
                            {t.type === "transfer"
                              ? "⇄ "
                              : t.type === "income"
                                ? "+ "
                                : "- "}
                            <NumericFormat
                              value={t.amount}
                              displayType="text"
                              thousandSeparator
                              suffix=" ج.م"
                            />
                          </p>
                          <p className="text-gray-400 mt-0.5">
                            {t.paymentMethod}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Simplified Collection Section */}
        {!loading && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="bg-fuchsia-100/50 p-5 rounded-2xl border border-fuchsia-200 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-fuchsia-600 p-2 rounded-lg text-white shadow-md">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-fuchsia-900 uppercase">
                    تحصيل جميع العمليات
                  </h3>
                  <p className="text-[10px] text-fuchsia-600 mt-1 font-medium">
                    إجمالي صافي الحركات المالية المباشرة (إيداع - صرف)
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-fuchsia-700">
                  <NumericFormat
                    value={transactions.reduce((sum, t) => {
                      if (t.type === "income") return sum + t.amount;
                      if (t.type === "payment") return sum - t.amount;
                      return sum;
                    }, 0)}
                    displayType="text"
                    thousandSeparator
                    suffix=" ج.م"
                  />
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t flex justify-center">
          <button
            onClick={() => setOpen(false)}
            className="px-6 py-2 w-1/2 bg-gray-100 cursor-pointer text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </Modal>
  );
}
