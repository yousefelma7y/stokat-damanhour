"use client";

import { useEffect, useState } from "react";
import { Eye, QrCode, XCircleIcon } from "lucide-react";
import { PlusIcon } from "@heroicons/react/24/outline";
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
import { Edit } from "lucide-react";
import EditOrderModal from "@/components/Order/EditOrderModal";

const statuses = [
  { _id: "completed", name: "ناجح" },
  { _id: "pending", name: "معلق" },
  { _id: "cancelled", name: "ملغي" },
];

const orderTypes = [
  { _id: "regular", name: "منتجات" },
  { _id: "weight", name: "وزن" },
];

const PAYMENT_METHOD_LABELS = {
  cash: "كاش",
  bank: "فيزا",
  card: "بطاقة",
  transfer: "تحويل",
  wallet: "محفظة",
  mixed: "مختلط",
};

const kgToGrams = (kg) => Number((Number(kg || 0) * 1000).toFixed(2));
const formatGrams = (grams) =>
  Number(grams || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 });
const formatMoney = (amount) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))} EGP`;

const formatDatePart = (date) =>
  new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

const formatTimePart = (date) =>
  new Intl.DateTimeFormat("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));

const getDiscountAmount = (order) => {
  const storedDiscount = Number(order?.discount?.amount || 0);
  if (storedDiscount > 0) return storedDiscount;

  const discountValue = Number(order?.discount?.value || 0);
  if (discountValue <= 0) return 0;

  return order?.discount?.type === "percentage"
    ? (Number(order?.subtotal || 0) * discountValue) / 100
    : discountValue;
};

const OrderTotalCell = ({ order }) => {
  const discountAmount = getDiscountAmount(order);
  const total = Number(order?.total || 0);
  const hasDiscount = discountAmount > 0;
  const totalBeforeDiscount = hasDiscount ? total + discountAmount : total;

  if (!hasDiscount) {
    return <span className="font-bold text-gray-900">{formatMoney(total)}</span>;
  }

  return (
    <span className="inline-flex flex-col items-center gap-1" dir="ltr">
      <span className="text-[11px] font-medium text-slate-400 line-through">
        {formatMoney(totalBeforeDiscount)}
      </span>
      <span className="font-bold text-emerald-700">{formatMoney(total)}</span>
      <span className="text-[10px] font-semibold text-rose-500" dir="rtl">
        بعد خصم {formatMoney(discountAmount)}
      </span>
    </span>
  );
};

const OrderDateTimeCell = ({ date }) => (
  <span className="inline-flex flex-col items-center gap-1">
    <span className="font-medium text-gray-800">{formatDatePart(date)}</span>
    <span className="text-xs text-slate-500">{formatTimePart(date)}</span>
  </span>
);

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
  const [paymentMethod, setPaymentMethod] = useState(null);
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [weightProducts, setWeightProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [scraps, setScraps] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState([]);

  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit, search: searchValue };
      if (status) params.status = status;
      if (orderType) params.orderType = orderType;
      if (paymentMethod) params.paymentMethodId = paymentMethod;
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

  const fetchCatalogData = async () => {
    try {
      const [productsRes, weightProductsRes, suppliersRes, scrapsRes, servicesRes, pmRes] = await Promise.all([
        axiosClient.get("/products", { params: { limit: 1000 } }),
        axiosClient.get("/weight-products", { params: { limit: 1000 } }),
        axiosClient.get("/suppliers", { params: { limit: 1000 } }),
        axiosClient.get("/scraps", { params: { limit: 1000 } }),
        axiosClient.get("/services", { params: { limit: 1000 } }),
        axiosClient.get("/payment-methods"),
      ]);

      setProducts(productsRes.data.data || []);
      setWeightProducts(weightProductsRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setScraps(scrapsRes.data.data || []);
      setServicesList(servicesRes.data.data || []);
      setPaymentMethodsList(pmRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch catalog data:", error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data } = await axiosClient.get("/payment-methods");
      setPaymentMethodsList(data.data || []);
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  };

  useEffect(() => {
    if (userRole === "admin") {
      fetchCatalogData();
    } else if (userRole) {
      fetchPaymentMethods();
    }
  }, [userRole]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, status, orderType, paymentMethod, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [page, limit, searchValue, status, orderType, paymentMethod, startDate, endDate, refetch]);

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

  const handleEdit = async (orderId) => {
    try {
      setIsEditLoading(true);
      const { data } = await axiosClient.get(`/orders/${orderId}`);
      setEditingOrder(data.data);
      setShowEditModal(true);
    } catch (error) {
      setMessage({
        type: "error",
        message: "حدث خطأ أثناء تحميل بيانات الطلب",
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleEditSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoadingBtn(true);
      const isWeightOrder = values.order_type === "weight";
      const orderData = {
        order_type: values.order_type,
        items: isWeightOrder
          ? []
          : values.items.map((item) => ({
            product: Number(item.product),
            size: item.size,
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        weightItems: isWeightOrder
          ? values.weightItems.map((item) => ({
            weightProduct: Number(item.weightProduct),
            weight: Number(item.weight) / 1000,
            pricePerKg: Number(item.pricePerKg),
          }))
          : [],
        scrapItems: values.scrapItems.map((item) => ({
          product: item.product,
          size: item.size,
          quantity: Number(item.quantity),
          price: Number(item.price),
          refModel: item.refModel
        })),
        services: values.services.map((item) => ({
          service: item.service,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
        discount: {
          value: Number(values.discount),
          type: values.discountType,
        },
        shipping: Number(values.shipping),
        priceDiff: Number(values.priceDiff || 0),
        status: values.status,
        paymentMethodId: values.paymentMethodId ? Number(values.paymentMethodId) : null,
        paidAmount: Number(values.paidAmount || 0),
        supplier: values.supplier || null,
      };

      const { data } = await axiosClient.put(`/orders/${editingOrder._id}`, orderData);

      if (!data.success) {
        throw new Error(data.message || "فشل تحديث الطلب");
      }

      setMessage({ type: "success", message: data.message || "تم تحديث الطلب بنجاح" });
      setShowEditModal(false);
      setEditingOrder(null);
      setRefetch(!refetch);
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || error.message || "حدث خطأ أثناء تحديث الطلب",
      });
    } finally {
      setLoadingBtn(false);
      setSubmitting(false);
    }
  };

  const rows = orders.map((order) => {
    const regularItemsQty = (order.items || []).reduce(
      (sum, item) => sum + (item.quantity || 0),
      0,
    );
    const weightItemsGrams = (order.weightItems || []).reduce(
      (sum, item) => sum + kgToGrams(item.weight || 0),
      0,
    );

    return {
      _id: order._id,
      name: order.customer?.name || "عميل نقدي",
      itemsQty:
        order.order_type === "weight"
          ? `${formatGrams(weightItemsGrams)} جم`
          : regularItemsQty,
      total: <OrderTotalCell order={order} />,
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
      paymentMethod: PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod || "كاش",
      date: <OrderDateTimeCell date={order.createdAt} />,
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
          {
            placeholder: "وسيلة الدفع",
            value: paymentMethod,
            onChange: setPaymentMethod,
            items: paymentMethodsList,
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
          actionsLoading={isEditLoading || loadingBtn}
          actions={[
            {
              label: null,
              Icon: Eye,
              action: (order) => setOrderDetailsId(order._id),
              props: { color: "green", variant: "filled", rounded: "2xl" },
            },
            userRole === "admin" && {
              label: null,
              Icon: Edit,
              action: (order) => handleEdit(order._id),
              props: { color: "babyBlue", variant: "filled", rounded: "2xl" },
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
            "السعر",
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

      <EditOrderModal
        loadingBtn={loadingBtn}
        showModal={showEditModal}
        setShowModal={setShowEditModal}
        editingOrder={editingOrder}
        handleSubmit={handleEditSubmit}
        setEditingOrder={setEditingOrder}
        products={products}
        weightProducts={weightProducts}
        paymentMethods={paymentMethodsList}
        suppliers={suppliers}
        scraps={scraps}
        servicesList={servicesList}
      />
    </div>
  );
}
