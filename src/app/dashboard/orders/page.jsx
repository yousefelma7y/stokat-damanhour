"use client";

import { useEffect, useState } from "react";
import { Eye, QrCode, XCircleIcon } from "lucide-react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { NumericFormat } from "react-number-format";
import Cookies from "js-cookie";
import Button from "../../../components/Button";
import ContentTable from "../../../components/contentTable";
import DeleteModal from "../../../components/DeleteModal";
import Title from "../../../components/Title";
import LoadingSpinner from "../../../components/LoadingSpinner";
import Message from "../../../components/Message";
import { useDebounce } from "use-debounce";
import FiltersCombonent from "../../../components/FiltersCombonent";
import OrderReceiptDialog from "@/components/Order/OrderReceiptDialog";
import OrderDetailsModal from "../../../components/Order/OrderDetailsModal";
import axiosClient from "@/lib/axios-client";

const statuses = [
  { _id: "completed", name: "ناجح" },
  { _id: "pending", name: "معلق" },
  { _id: "cancelled", name: "ملغي" },
];

const orderTypes = [
  { _id: "regular", name: "منتجات" },
  { _id: "weight", name: "وزن" },
];

export default function OrdersPage() {
  const [userRole, setUserRole] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [orderDetailsId, setOrderDetailsId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [status, setStatus] = useState(null);
  const [orderType, setOrderType] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [refetch, setRefetch] = useState(true);
  const [message, setMessage] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
  });

  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit, search: searchValue };
      if (status) params.status = status;
      if (orderType) params.orderType = orderType;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await axiosClient.get("/orders", { params });
      setOrders(data.data || []);
      setTotalPages(data.pages || 1);
      setTotal(data.total || 0);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      setMessage({
        type: "error",
        message: "فشل تحميل بيانات الطلبات",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, limit, searchValue, status, orderType, startDate, endDate, refetch]);

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      await axiosClient.put(`/orders/${deleteModal}`, { status: "cancelled" });
      setMessage({ type: "success", message: "تم إلغاء الطلب بنجاح" });
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "حدث خطأ أثناء إلغاء الطلب",
      });
    } finally {
      setDeleteModal(false);
      setRefetch(!refetch);
      setLoadingBtn(false);
    }
  };

  const handleShowReceipt = async (order) => {
    try {
      const { data } = await axiosClient.get(`/orders/${order._id}`);
      setSelectedOrder(data.data);
      setShowReceiptDialog(true);
    } catch {
      setMessage({
        type: "error",
        message: "حدث خطأ أثناء تحميل تفاصيل الطلب",
      });
    }
  };

  const rows = orders.map((order) => {
    const itemsQty =
      (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0) +
      (order.weightItems || []).reduce((sum, item) => sum + (item.weight || 0), 0);

    return {
      _id: order._id,
      name: order.customer?.name || "عميل نقدي",
      itemsQty:
        order.order_type === "weight"
          ? `${itemsQty.toFixed ? itemsQty.toFixed(2) : itemsQty} كجم`
          : itemsQty,
      total: (
        <NumericFormat
          value={order.total || 0}
          displayType="text"
          thousandSeparator
          suffix=" EGP"
        />
      ),
      orderType: (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            order.order_type === "weight"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {order.order_type === "weight" ? "وزن" : "منتجات"}
        </span>
      ),
      status: (
        <span
          className={`md:text-white md:p-2 md:px-4 rounded-xl ${
            order.status === "completed"
              ? "md:bg-green-600 text-green-500"
              : order.status === "pending"
                ? "md:bg-yellow-500 text-yellow-500"
                : "md:bg-red-500 text-red-500"
          }`}
        >
          {order.status === "completed"
            ? "ناجح"
            : order.status === "pending"
              ? "معلق"
              : "ملغي"}
        </span>
      ),
      paymentMethod: "كاش",
      date: new Date(order.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    };
  });

  return (
    <div dir="rtl">
      <Message message={message} setMessage={setMessage} />

      <OrderReceiptDialog
        isOpen={showReceiptDialog}
        onClose={() => {
          setShowReceiptDialog(false);
          setSelectedOrder(null);
        }}
        orderData={selectedOrder}
      />

      <DeleteModal
        deleteReqModal={deleteModal}
        setDeleteReqModal={setDeleteModal}
        name="الطلب"
        deleteHandler={handleDelete}
        OrdersPage
        isLoading={loadingBtn}
      />

      <div className="mb-6">
        <Title
          title="الطلبات"
          count={total}
          subTitle="إدارة جميع طلبات المتجر"
          button={
            (userRole === "admin" || userRole === "cashier") && (
              <Button
                Icon={PlusIcon}
                onClick={() => {
                  window.location.href = "/dashboard/create-order";
                }}
                label="إضافة طلب"
                variant="filled"
                type="submit"
                rounded="xl"
                fixedPadding="3"
              />
            )
          }
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 px-4">
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <p className="text-gray-600 text-xs md:text-sm mb-1">إجمالي الطلبات</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <p className="text-gray-600 text-xs md:text-sm mb-1">الطلبات الناجحة</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.completedOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <p className="text-gray-600 text-xs md:text-sm mb-1">الطلبات المعلقة</p>
          <p className="text-2xl md:text-3xl font-bold text-yellow-600">{stats.pendingOrders || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
          <p className="text-gray-600 text-xs md:text-sm mb-1">الطلبات الملغاة</p>
          <p className="text-2xl md:text-3xl font-bold text-red-600">{stats.cancelledOrders || 0}</p>
        </div>
      </div>

      <FiltersCombonent
        placeholder="ابحث برقم الطلب..."
        searchField
        search={search}
        setSearch={setSearch}
        dateRange
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
            placeholder: "حالة الطلب",
            value: status,
            onChange: setStatus,
            items: statuses,
            byId: true,
          },
          {
            placeholder: "نوع الطلب",
            value: orderType,
            onChange: setOrderType,
            items: orderTypes,
            byId: true,
          },
        ]}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ContentTable
          data={rows}
          nodata="طلبات"
          actions={[
            {
              label: null,
              Icon: Eye,
              action: (order) => setOrderDetailsId(order._id),
              props: { color: "green", variant: "filled", rounded: "2xl" },
            },
            {
              label: null,
              Icon: QrCode,
              action: (order) => handleShowReceipt(order),
              props: { color: "black", variant: "filled", rounded: "2xl" },
            },
            {
              label: null,
              Icon: XCircleIcon,
              action: (order) => setDeleteModal(order._id),
              props: { color: "danger", variant: "filled", rounded: "2xl" },
            },
          ]}
          header={[
            "رقم الطلب",
            "اسم العميل",
            "عدد العناصر",
            "الإجمالي",
            "نوع الطلب",
            "الحالة",
            "وسيلة الدفع",
            "تاريخ الطلب",
          ]}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          setLimit={setLimit}
          limit={limit}
        />
      )}

      <OrderDetailsModal
        isOpen={!!orderDetailsId}
        onClose={() => setOrderDetailsId(null)}
        orderId={orderDetailsId}
      />
    </div>
  );
}
