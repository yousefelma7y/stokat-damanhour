"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Package,
  Phone,
  Calendar,
  ArrowLeft,
  User,
  MapPin,
  ShoppingBag,
  Eye,
  CreditCard,
  Edit,
  X,
  HandCoins,
} from "lucide-react";
import Button from "../../../../components/Button";
import ContentTable from "../../../../components/contentTable";
import Title from "../../../../components/Title";
import Message from "../../../../components/Message";
import axiosClient from "../../../../lib/axios-client";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { NumericFormat } from "react-number-format";
import OrderDetailsModal from "../../../../components/Order/OrderDetailsModal";
import ProtectedPage from "../../../../components/ProtectedPage";
import Cookies from "js-cookie";

const EditCustomerModal = ({ isOpen, onClose, customer, onSubmit }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setLocation(customer.location || "");
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({ name, phone, location });
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-slate-100 border-b">
          <h3 className="font-bold text-slate-900 text-lg">
            تعديل بيانات العميل
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
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              اسم العميل
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="اسم العميل"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              رقم الهاتف
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-left"
              placeholder="رقم الهاتف"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              العنوان
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="عنوان العميل"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl font-medium text-slate-900 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-medium text-white transition-colors cursor-pointer"
            >
              {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function CustomerDetails() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [orderDetailsId, setOrderDetailsId] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosClient.get(`/customers/${id}`, {
        params: { page, limit },
      });
      setCustomer(data.data.customer);
      setOrders(data.data.orders);
      setTransactions(data.data.transactions || []);
      setStats(data.data.stats);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      setMessage({
        type: "error",
        message: "فشل تحميل بيانات العميل",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, page, limit]);

  const handleEditSubmit = async (values) => {
    try {
      await axiosClient.put(`/customers/${id}`, values);
      setMessage({ type: "success", message: "تم تحديث بيانات العميل بنجاح" });
      fetchData();
    } catch (error) {
      console.error("Error updating customer:", error);
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل تحديث بيانات العميل",
      });
    }
  };

  const ORDER_TYPE_LABELS = {
    regular: "عادي",
    exchange: "تبديل",
    replacement: "استبدال",
    delayed: "آجل",
    service: "خدمة",
  };

  const STATUS_LABELS = {
    completed: { label: "مكتمل", class: "bg-emerald-100 text-emerald-800" },
    pending: { label: "معلق", class: "bg-yellow-100 text-yellow-800" },
    cancelled: { label: "ملغي", class: "bg-red-100 text-red-800" },
  };

  const TRANSACTION_STATUS_LABELS = {
    completed: { label: "مكتملة", class: "bg-emerald-100 text-emerald-800" },
    pending: { label: "معلقة", class: "bg-yellow-100 text-yellow-800" },
    failed: { label: "فشلت", class: "bg-red-100 text-red-800" },
    cancelled: { label: "طلب ملغي", class: "bg-red-100 text-red-800" },
  };

  const TRANSACTION_TYPE_LABELS = {
    income: "تحصيل",
    payment: "صرف",
    transfer: "تحويل",
  };

  const TRANSACTION_CATEGORY_LABELS = {
    debt_settlement: "تسوية مديونية",
    debt_settlement_refund: "رد تسوية مديونية",
    sales: "بيع",
    adjustment: "تعديل",
    cancelled_order: "إلغاء طلب",
    income: "تحصيل",
    expense: "صرف",
  };

  const formatTransactionAmount = (transaction) => {
    const amount = Number(transaction.amount || 0);
    const signedAmount = transaction.type === "payment" ? -amount : amount;
    const sign = signedAmount > 0 ? "+" : signedAmount < 0 ? "-" : "";

    return (
      <span
        className={`font-bold ${
          signedAmount < 0 ? "text-red-600" : "text-emerald-700"
        }`}
      >
        {sign}
        <NumericFormat
          value={Math.abs(signedAmount)}
          displayType="text"
          thousandSeparator={true}
          decimalScale={2}
          fixedDecimalScale
          suffix=" EGP"
        />
      </span>
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (!customer)
    return <div className="p-10 font-bold text-center">العميل غير موجود</div>;

  return (
    <ProtectedPage page={`customers/${id}`}>
      <div className="space-y-6 p-4" dir="rtl">
        <Message message={message} setMessage={setMessage} />

        <div className="flex justify-between items-center gap-2 md:gap-4 mb-4">
          <Title
            withoutCount
            title={`تفاصيل العميل: ${customer.name}`}
            subTitle="عرض بيانات العميل وسجل الطلبات"
          />
          <div className="flex items-center gap-2">
            {(userRole === "admin" || userRole === "cashier") && (
              <Button
                Icon={Edit}
                onClick={() => setIsEditModalOpen(true)}
                variant="filled"
                color="babyBlue"
                rounded="full"
                fixedPadding="2"
              />
            )}
            <Button
              Icon={ArrowLeft}
              onClick={() => window.history.back()}
              variant="filled"
              rounded="full"
              fixedPadding="2"
            />
          </div>
        </div>

        {/* Customer Info Cards */}
        <div className="gap-6 grid md:grid-cols-2 xl:grid-cols-5">
          <div className="flex items-center gap-4 bg-white shadow-sm p-6 border border-gray-100 rounded-2xl">
            <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
              <User size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">اسم العميل</p>
              <p className="font-bold text-gray-900 text-xl">{customer.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white shadow-sm p-6 border border-gray-100 rounded-2xl">
            <div className="bg-green-100 p-3 rounded-xl text-green-600">
              <Phone size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">رقم الهاتف</p>
              <p className="font-bold text-gray-900 text-xl" dir="ltr">
                {customer.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white shadow-sm p-6 border border-gray-100 rounded-2xl">
            <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">عدد الطلبات المكتملة</p>
              <p className="font-bold text-gray-900 text-2xl">
                {stats?.completedOrders || 0}
                <span className="text-gray-400 text-sm font-normal mr-1">
                  / {stats?.totalOrders || 0}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-emerald-50 shadow-sm p-6 border border-emerald-100 rounded-2xl">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">إجمالي المدفوعات</p>
              <p className="font-black text-emerald-700 text-2xl">
                <NumericFormat
                  value={stats?.totalSpent || 0}
                  displayType="text"
                  thousandSeparator={true}
                  suffix=" EGP"
                />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-amber-50 shadow-sm p-6 border border-amber-100 rounded-2xl">
            <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
              <HandCoins size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">المديونية الحالية</p>
              <p className="font-black text-amber-700 text-2xl">
                <NumericFormat
                  value={stats?.debtBalance ?? customer.debtBalance ?? 0}
                  displayType="text"
                  thousandSeparator={true}
                  suffix=" EGP"
                />
              </p>
            </div>
          </div>
        </div>

        {/* Location card */}
        {customer.location && (
          <div className="flex items-center gap-3 bg-white shadow-sm p-4 border border-gray-100 rounded-2xl">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-xs">العنوان</p>
              <p className="font-medium text-gray-900">{customer.location}</p>
            </div>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-center gap-3 bg-white shadow-sm px-4 py-3 border border-gray-100 rounded-2xl w-fit">
          <Calendar size={16} className="text-gray-400" />
          <p className="text-gray-500 text-sm">
            عميل منذ:{" "}
            <span className="font-medium text-gray-700">
              {new Date(customer.createdAt).toLocaleDateString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow-sm p-4 md:p-6 border border-gray-100 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 md:mb-6">
            <Package className="text-blue-600" size={24} />
            <h3 className="font-bold text-gray-900 text-lg">
              سجل الطلبات ({total})
            </h3>
          </div>

          <ContentTable
            data={orders.map((order) => {
              const remainingAmount = Number(order.remainingAmount || 0);
              const debtAmount = Number(order.debtAmount || 0);
              const hasDebtHistory =
                remainingAmount > 0 ||
                debtAmount > 0 ||
                order.isDebt ||
                ["open", "partial", "settled"].includes(order.debtStatus);
              const paidAmount = Number(order.paidAmount || 0);
              const displayPaidAmount =
                paidAmount > 0 || hasDebtHistory
                  ? paidAmount
                  : Number(order.total || 0);

              return {
                _id: order._id,
                date: new Date(order.createdAt).toLocaleDateString("ar-EG"),
                type: (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {ORDER_TYPE_LABELS[order.order_type] || "عادي"}
                  </span>
                ),
                status: (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[order.status]?.class || ""}`}
                  >
                    {STATUS_LABELS[order.status]?.label || order.status}
                  </span>
                ),
                items: order.items.length,
                total: (
                  <span className="font-bold text-gray-900">
                    {order.total?.toFixed(2)} EGP
                  </span>
                ),
                paid: (
                  <span className="font-bold text-green-600">
                    {displayPaidAmount.toFixed(2)} EGP
                  </span>
                ),
                remaining: hasDebtHistory ? (
                  <span className="font-bold text-red-600">
                    {remainingAmount.toFixed(2)} EGP
                  </span>
                ) : (
                  <span className="font-bold text-gray-400">-</span>
                ),
              };
            })}
            header={[
              "id",
              "التاريخ",
              "النوع",
              "الحالة",
              "عدد المنتجات",
              "الإجمالي",
              "المدفوع",
              "المتبقي",
            ]}
            actions={[
              {
                label: null,
                Icon: Eye,
                action: (order) => setOrderDetailsId(order._id),
                props: {
                  color: "green",
                  variant: "filled",
                  rounded: "2xl",
                },
              },
            ]}
            nodata="طلبات"
            totalPages={totalPages}
            page={page}
            setPage={setPage}
            setLimit={setLimit}
            limit={limit}
          />
        </div>

        {/* Customer Transactions Table */}
        <div className="bg-white shadow-sm p-4 md:p-6 border border-gray-100 rounded-2xl">
          <div className="flex items-center gap-2 mb-2 md:mb-6">
            <CreditCard className="text-emerald-600" size={24} />
            <h3 className="font-bold text-gray-900 text-lg">
              سجل المعاملات والتسويات
            </h3>
          </div>

          <ContentTable
            smallSection
            data={transactions.map((transaction) => ({
              _id: transaction._id,
              date: new Date(transaction.createdAt).toLocaleDateString("ar-EG"),
              type: (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                  {TRANSACTION_CATEGORY_LABELS[transaction.category] ||
                    TRANSACTION_TYPE_LABELS[transaction.type] ||
                    transaction.type}
                </span>
              ),
              description: transaction.description || "-",
              amount: formatTransactionAmount(transaction),
              paymentMethod: transaction.paymentMethod || "-",
              status: (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    TRANSACTION_STATUS_LABELS[transaction.status]?.class || ""
                  }`}
                >
                  {TRANSACTION_STATUS_LABELS[transaction.status]?.label ||
                    transaction.status}
                </span>
              ),
            }))}
            header={[
              "رقم العملية",
              "التاريخ",
              "النوع",
              "البيان",
              "المبلغ",
              "وسيلة الدفع",
              "الحالة",
            ]}
            nodata="معاملات"
          />
        </div>

        <EditCustomerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          customer={customer}
          onSubmit={handleEditSubmit}
        />
        <OrderDetailsModal
          isOpen={!!orderDetailsId}
          onClose={() => setOrderDetailsId(null)}
          orderId={orderDetailsId}
        />
      </div>
    </ProtectedPage>
  );
}
