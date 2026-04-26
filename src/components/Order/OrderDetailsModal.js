"use client";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Package,
  Scale,
  ShoppingBag,
  Tag,
  User,
  X,
  XCircle,
} from "lucide-react";
import axiosClient from "../../lib/axios-client";

const ORDER_TYPE_MAP = {
  regular: { label: "طلب منتجات", color: "bg-blue-100 text-blue-800" },
  weight: { label: "طلب وزن", color: "bg-emerald-100 text-emerald-800" },
};

const STATUS_MAP = {
  completed: { label: "مكتمل", color: "bg-emerald-100 text-emerald-800", Icon: CheckCircle },
  pending: { label: "معلق", color: "bg-yellow-100 text-yellow-800", Icon: Clock },
  cancelled: { label: "ملغي", color: "bg-red-100 text-red-800", Icon: XCircle },
};

const formatWeightGrams = (weightKg) =>
  Number(Number(weightKg || 0) * 1000).toLocaleString("ar-EG", {
    maximumFractionDigits: 2,
  });

const OrderDetailsModal = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      axiosClient
        .get(`/orders/${orderId}`)
        .then((res) => setOrder(res.data.data))
        .catch(() => setError("فشل تحميل بيانات الطلب"))
        .finally(() => setLoading(false));
    }

    if (!isOpen) {
      setOrder(null);
      setError(null);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const orderType = ORDER_TYPE_MAP[order?.order_type] || ORDER_TYPE_MAP.regular;
  const status = STATUS_MAP[order?.status] || STATUS_MAP.pending;
  const StatusIcon = status.Icon;
  const discountAmount = Number(order?.discount?.amount || 0);

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">تفاصيل الطلب</h3>
              {order && <p className="text-slate-500 text-sm">طلب رقم #{order._id}</p>}
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-slate-100 p-2 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {loading && (
            <div className="flex flex-col justify-center items-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm">جاري تحميل البيانات...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {order && !loading && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.color}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${orderType.color}`}>
                  <Tag className="w-3.5 h-3.5" />
                  {orderType.label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {order.customer && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                  <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    بيانات العميل
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">الاسم:</span>
                      <span className="font-medium text-slate-900">{order.customer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">الهاتف:</span>
                      <span className="font-medium text-slate-900" dir="ltr">{order.customer.phone}</span>
                    </div>
                  </div>
                </div>
              )}

              {order.items?.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
                    <Package className="w-4 h-4 text-slate-600" />
                    <h4 className="font-bold text-slate-800 text-sm">المنتجات ({order.items.length})</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2.5 text-right font-medium">المنتج</th>
                          <th className="px-4 py-2.5 text-center font-medium">الكمية</th>
                          <th className="px-4 py-2.5 text-center font-medium">السعر</th>
                          <th className="px-4 py-2.5 text-center font-medium">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.product?.name || `منتج #${item.product}`}</td>
                            <td className="px-4 py-3 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-center">{(item.price || 0).toLocaleString()} EGP</td>
                            <td className="px-4 py-3 text-center font-bold">{(item.total || 0).toLocaleString()} EGP</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {order.weightItems?.length > 0 && (
                <div className="border border-emerald-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 flex items-center gap-2 border-b border-emerald-200">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-emerald-800 text-sm">أصناف الوزن ({order.weightItems.length})</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-emerald-50/50 text-emerald-700">
                        <tr>
                          <th className="px-4 py-2.5 text-right font-medium">الصنف</th>
                          <th className="px-4 py-2.5 text-center font-medium">الوزن بالجرام</th>
                          <th className="px-4 py-2.5 text-center font-medium">سعر الكيلو</th>
                          <th className="px-4 py-2.5 text-center font-medium">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100">
                        {order.weightItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.weightProduct?.name || `صنف #${item.weightProduct}`}</td>
                            <td className="px-4 py-3 text-center">{formatWeightGrams(item.weight)} جم</td>
                            <td className="px-4 py-3 text-center">{(item.pricePerKg || 0).toLocaleString()} EGP</td>
                            <td className="px-4 py-3 text-center font-bold">{(item.total || 0).toLocaleString()} EGP</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-bl from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-600" />
                  الملخص المالي
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">المجموع الفرعي:</span>
                    <span className="font-medium text-slate-800">{(order.subtotal || 0).toLocaleString()} EGP</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">الخصم:</span>
                      <span className="font-medium text-rose-600">
                        -{discountAmount.toLocaleString()} EGP
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">الدفع:</span>
                    <span className="font-medium text-slate-800">{order.paymentMethod || "كاش"}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-300">
                    <span className="font-bold text-slate-900">الإجمالي:</span>
                    <span className="font-black text-lg text-emerald-700">{(order.total || 0).toLocaleString()} EGP</span>
                  </div>
                </div>
              </div>

              {order.notes && (
                <div className="bg-yellow-50/60 border border-yellow-200 rounded-xl p-4">
                  <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-yellow-600" />
                    ملاحظات
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{order.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-xl transition-colors">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
