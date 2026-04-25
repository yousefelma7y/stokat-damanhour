"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Package,
  Phone,
  Wallet,
  Calendar,
  ArrowRight,
  User,
  ArrowLeft,
  Eye,
} from "lucide-react";
import Button from "../../../../components/Button";
import ContentTable from "../../../../components/contentTable";
import Title from "../../../../components/Title";
import Message from "../../../../components/Message";
import axiosClient from "../../../../lib/axios-client";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { NumericFormat } from "react-number-format";
import { ArrowDownLeft, ArrowUpRight, X, Edit } from "lucide-react";
import OrderDetailsModal from "../../../../components/Order/OrderDetailsModal";
import PaymentMethodSelect from "../../../../components/PaymentMethodSelect";

const EditSupplierModal = ({ isOpen, onClose, supplier, onSubmit }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name || "");
      setPhone(supplier.phone || "");
      setNote(supplier.note || "");
    }
  }, [supplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({ name, phone, note });
    setIsLoading(false);
    onClose();
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-slate-100 border-b">
          <h3 className="font-bold text-slate-900 text-lg">
            تعديل بيانات التاجر
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
              اسم التاجر
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="اسم التاجر"
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
              ملاحظات
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="3"
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="ملاحظات إضافية..."
            ></textarea>
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

const TransactionModal = ({
  isOpen,
  onClose,
  type,
  supplierName,
  onSubmit,
}) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSubmit({ amount, description, paymentMethodId });
    setIsLoading(false);
    onClose();
    setAmount("");
    setDescription("");
  };

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-slate-100 border-b">
          <h3 className="font-bold text-slate-900 text-lg">
            {type === "income" ? "تحصيل مبلغ من" : "صرف مبلغ لـ"} {supplierName}
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
              المبلغ
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="0.00"
              />
              <span className="top-2.5 left-4 absolute text-slate-400 text-sm">
                EGP
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <PaymentMethodSelect
            value={paymentMethodId}
            onChange={(id) => setPaymentMethodId(id)}
            label="وسيلة الدفع"
          />

          <div>
            <label className="block mb-1 font-medium text-slate-700 text-sm">
              ملاحظات
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              placeholder="وصف العملية..."
            ></textarea>
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
              className={`flex-1 px-4 py-2 cursor-pointer text-white font-medium rounded-xl transition-colors ${
                type === "income"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isLoading ? "جاري الحفظ..." : "تأكيد العملية"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function SupplierDetails() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("income"); // "income" or "payment"
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(false);
  const [orderDetailsId, setOrderDetailsId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data } = await axiosClient.get(`/suppliers/${id}`, {
          params: { page, limit },
        });
        setSupplier(data.data.supplier);
        setOrders(data.data.orders);
        setTransactions(data.data.transactions || []);
        console.log(data.data.transactions);
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (error) {
        console.error("Error fetching supplier details:", error);
        setMessage({
          type: "error",
          message: "فشل تحميل بيانات التاجر",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, page, limit]);

  const handleTransactionSubmit = async ({
    amount,
    description,
    paymentMethodId,
  }) => {
    try {
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        setMessage({ type: "error", message: "يرجى إدخال مبلغ صحيح" });
        return;
      }

      const isPayment = modalType === "payment";
      const numAmount = Number(amount);

      const payload = {
        amount: numAmount,
        type: modalType,
        accountingAmount: isPayment ? -numAmount : numAmount,
        transactionDirection: isPayment ? "out" : "in",
        isExpense: isPayment,
        category: isPayment ? "expense" : "income",
        description:
          description ||
          (modalType === "income" ? "تحصيل من مورد" : "صرف لمورد"),
        relatedModel: "Supplier",
        relatedId: supplier._id,
        paymentMethodId: paymentMethodId || null, // Added paymentMethodId to payload
        paymentMethod: "cash",
      };

      const { data } = await axiosClient.post("/transactions", payload);
      setMessage({ type: "success", message: "تم تسجيل المعاملة بنجاح" });

      // Refresh data
      const { data: newData } = await axiosClient.get(`/suppliers/${id}`, {
        params: { page, limit },
      });
      setSupplier(newData.data.supplier);
      setTransactions(newData.data.transactions || []);
    } catch (error) {
      console.error("Error creating transaction:", error);
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل تسجيل المعاملة",
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!supplier)
    return <div className="p-10 font-bold text-center">التاجر غير موجود</div>;

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <Message message={message} setMessage={setMessage} />

      <div className="flex justify-between items-center gap-2 md:gap-4 mb-4">
        <Title
          withoutCount
          title={`تفاصيل التاجر: ${supplier.name}`}
          subTitle="عرض بيانات التاجر وسجل المعاملات"
        />
        <Button
          Icon={ArrowLeft}
          onClick={() => window.history.back()}
          variant="filled"
          rounded="full"
          fixedPadding="2"
        />
      </div>

      {/* Supplier Info Cards */}
      <div className="gap-6 grid md:grid-cols-3">
        <div className="flex items-center gap-4 bg-white shadow-sm p-6 border border-gray-100 rounded-2xl">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <User size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">اسم التاجر</p>
            <p className="font-bold text-gray-900 text-xl">{supplier.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white shadow-sm p-6 border border-gray-100 rounded-2xl">
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <Phone size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">رقم الهاتف</p>
            <p className="font-bold text-gray-900 text-xl">{supplier.phone}</p>
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 ${supplier.wallet < 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
        >
          <div
            className={
              supplier.wallet < 0
                ? "bg-red-100 p-3 rounded-xl text-red-600"
                : "bg-green-100 p-3 rounded-xl text-green-600"
            }
          >
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm">رصيد المحفظة</p>
            <p
              className={`text-2xl font-black ${supplier.wallet < 0 ? "text-red-700" : "text-green-700"}`}
            >
              <NumericFormat
                value={supplier.wallet}
                displayType="text"
                thousandSeparator={true}
                suffix=" EGP"
              />
            </p>
            <p className="mt-1 text-gray-500 text-xs">
              {supplier.wallet > 0 ? "(مستحق علينا)" : "(دائن لنا)"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => {
            setModalType("income");
            setIsModalOpen(true);
          }}
          className="flex flex-1 justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-sm py-3 rounded-xl font-bold text-white transition-colors cursor-pointer"
        >
          <ArrowDownLeft className="w-5 h-5" />
          تحصيل مبلغ (إيداع)
        </button>
        <button
          onClick={() => {
            setModalType("payment");
            setIsModalOpen(true);
          }}
          className="flex flex-1 justify-center items-center gap-2 bg-red-600 hover:bg-red-700 shadow-sm py-3 rounded-xl font-bold text-white transition-colors cursor-pointer"
        >
          <ArrowUpRight className="w-5 h-5" />
          صرف مبلغ (سحب)
        </button>
      </div>

      {/* Transactions History */}
      <div className="bg-white shadow-sm mb-6 p-4 md:p-6 border border-gray-100 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 md:mb-6">
          <Wallet className="text-purple-600" size={24} />
          <h3 className="font-bold text-gray-900 text-lg">
            سجل المعاملات المالية
          </h3>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-3 rounded-r-xl">رقم المعاملة</th>
                  <th className="px-4 py-3">النوع</th>
                  <th className="px-4 py-3">الوصف</th>
                  <th className="px-4 py-3">المبلغ</th>
                  <th className="px-4 py-3 rounded-l-xl">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => (
                  <tr
                    key={txn._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {txn._id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          txn.type === "income"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {txn.type === "income" ? "تحصيل" : "صرف"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {txn.description || "-"}
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        txn.type === "income"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {txn.type === "income" ? "+" : "-"}
                      {txn.amount.toLocaleString()} EGP
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(txn.createdAt).toLocaleDateString("ar-EG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-50 py-8 border border-slate-200 border-dashed rounded-xl text-slate-500 text-center">
            لا توجد معاملات سابقة
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white shadow-sm p-4 md:p-6 border border-gray-100 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 md:mb-6">
          <Package className="text-blue-600" size={24} />
          <h3 className="font-bold text-gray-900 text-lg">
            سجل الطلبيات الآجلة
          </h3>
        </div>

        <ContentTable
          data={orders.map((order) => ({
            _id: order._id,
            date: new Date(order.createdAt).toLocaleDateString("ar-EG"),
            items: order.items.length,
            total: (
              <span className="font-bold text-gray-900">
                {order.total.toFixed(2)} EGP
              </span>
            ),
            paid: (
              <span className="font-bold text-green-600">
                {order.paidAmount?.toFixed(2) || "0.00"} EGP
              </span>
            ),
            remaining: (
              <span className="font-bold text-red-600">
                {order.remainingAmount?.toFixed(2) || "0.00"} EGP
              </span>
            ),
            status: (
              <span
                className={`md:text-white md:p-2 md:px-4 rounded-xl ${
                  order?.status == "completed"
                    ? "md:bg-green-600 text-green-500"
                    : order?.status == "pending"
                      ? "md:bg-yellow-500 text-yellow-500"
                      : "md:bg-red-500 text-red-500"
                }`}
              >
                {order?.status == "completed"
                  ? "ناجح"
                  : order?.status == "pending"
                    ? "معلق"
                    : order?.status == "cancelled"
                      ? "ملغي"
                      : "-"}
              </span>
            ),
          }))}
          header={[
            "id",
            "التاريخ",
            "عدد المنتجات",
            "الإجمالي",
            "المدفوع",
            "المتبقي",
            "الحالة",
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
          nodata="طلبيات"
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          setLimit={setLimit}
          limit={limit}
        />
      </div>
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        supplierName={supplier.name}
        onSubmit={handleTransactionSubmit}
      />
      <OrderDetailsModal
        isOpen={!!orderDetailsId}
        onClose={() => setOrderDetailsId(null)}
        orderId={orderDetailsId}
      />
    </div>
  );
}
