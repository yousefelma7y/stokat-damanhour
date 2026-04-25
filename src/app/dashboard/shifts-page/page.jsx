"use client";
import { useEffect, useState } from "react";
import {
  Wallet,
  Clock,
  User,
  Calendar,
  CheckCircle,
  PlayCircle,
  StopCircle,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import * as Yup from "yup";
import { PlusIcon } from "@heroicons/react/24/outline";
import Button from "../../../components/Button";
import ContentTable from "../../../components/contentTable";
import Modal from "../../../components/Modal";
import ShiftModal from "./ShiftModal";
import DeleteModal from "../../../components/DeleteModal";
import Title from "../../../components/Title";
import Message from "../../../components/Message";
import LoadingSpinner from "../../../components/LoadingSpinner";
import FiltersCombonent from "../../../components/FiltersCombonent";
import { useDebounce } from "use-debounce";
import { NumericFormat } from "react-number-format";
import axiosClient from "@/lib/axios-client";
import Cookies from "js-cookie";

const shiftStatuses = [
  { _id: "active", name: "نشطة" },
  { _id: "closed", name: "مغلقة" },
];

const openShiftSchema = Yup.object().shape({
  user: Yup.string().required("يجب اختيار الموظف"),
  notes: Yup.string(),
});

const closeShiftSchema = Yup.object().shape({
  notes: Yup.string(),
});

// ─── Safe initial values helpers ──────────────────────────────────────────────
// `amount` is ALWAYS a string here so Formik inputs are always controlled
// (value never transitions from undefined → string).

const buildOpenInitialValues = (paymentMethods) => ({
  user: "",
  notes: "",
  startWallets: paymentMethods.map((pm) => ({
    paymentMethodId: String(pm._id),
    amount: "", // always a string, never undefined
  })),
});

const buildCloseInitialValues = (paymentMethods, selectedShift) => ({
  notes: selectedShift?.notes ?? "",
  closeWallets: paymentMethods.map((pm) => {
    const pre = (selectedShift?.startWallets ?? []).find(
      (s) => String(s.paymentMethodId) === String(pm._id),
    );
    // coerce to string — null / undefined both become ""
    const amt =
      pre?.amount !== undefined && pre?.amount !== null
        ? String(pre.amount)
        : "";
    return {
      paymentMethodId: String(pm._id),
      amount: amt,
    };
  }),
});

export default function ShiftsPage() {
  const [role, setRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const r = Cookies.get("role");
    setRole(r);
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        setCurrentUser(JSON.parse(userCookie));
      } catch (e) {}
    }
  }, []);

  const [openShiftModal, setOpenShiftModal] = useState(false);
  const [closeShiftModal, setCloseShiftModal] = useState(false);
  const [walletsModal, setWalletsModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [activeShift, setActiveShift] = useState(null);

  // Filters
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [status, setStatus] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [refetch, setRefetch] = useState(true);
  const [message, setMessage] = useState(false);

  const [stats, setStats] = useState({
    totalShifts: 0,
    activeShifts: 0,
    closedShifts: 0,
    totalSales: 0,
  });

  // ── Fetch Users ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axiosClient.get(`/users`, {
          params: { role: "cashier", limit: 1000 },
        });
        setUsers(data.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setMessage({ type: "error", message: "فشل تحميل بيانات الموظفين" });
      }
    };
    fetchUsers();
  }, []);

  // ── Fetch Payment Methods ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const { data } = await axiosClient.get(`/payment-methods`, {
          params: { limit: 1000 },
        });
        setPaymentMethods(data.data || data || []);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        setMessage({ type: "error", message: "فشل تحميل وسائل الدفع" });
      }
    };
    fetchPaymentMethods();
  }, []);

  // ── Fetch Shifts ─────────────────────────────────────────────────────────────
  const fetchShifts = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit, search: searchValue };
      if (status) params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await axiosClient.get(`/shifts`, { params });

      setShifts(data.data || []);
      setTotalPages(data?.pages || 1);
      setTotal(data?.total || 0);

      const active = (data.data || []).find((s) => s.status === "active");
      setActiveShift(active || null);

      const allShiftsData = data.data || [];
      setStats({
        totalShifts: data?.total || 0,
        activeShifts: allShiftsData.filter((s) => s.status === "active").length,
        closedShifts: allShiftsData.filter((s) => s.status === "closed").length,
        totalSales: allShiftsData
          .filter((s) => s.status === "closed")
          .reduce(
            (acc, shift) =>
              acc + (shift.closingBalance - shift.startingBalance || 0),
            0,
          ),
      });
    } catch (error) {
      console.error("Error fetching shifts:", error);
      setMessage({ type: "error", message: "فشل تحميل بيانات الورديات" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [page, limit, searchValue, status, startDate, endDate, refetch]);

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [limit, searchValue, status, startDate, endDate]);

  const handleClearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const generateShiftNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `SH-${timestamp}-${random}`;
  };

  // ── Open Shift ───────────────────────────────────────────────────────────────
  const handleOpenShift = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoadingBtn(true);

      if (activeShift) {
        setMessage({
          type: "error",
          message: "يوجد وردية نشطة بالفعل. يجب إغلاق الوردية الحالية أولاً",
        });
        return;
      }

      const startWallets = (values.startWallets || []).map((s) => {
        const pm = paymentMethods.find(
          (p) => String(p._id) === String(s.paymentMethodId),
        );
        return {
          paymentMethodId: String(s.paymentMethodId),
          name: pm?.name ?? "",
          amount: Number(s.amount) || 0,
        };
      });

      const startingBalance = startWallets.reduce(
        (acc, cur) => acc + cur.amount,
        0,
      );

      await axiosClient.post("/shifts", {
        shiftNumber: generateShiftNumber(),
        user: values.user,
        startingBalance,
        startWallets,
        notes: values.notes ?? "",
        status: "active",
      });

      setMessage({ type: "success", message: "تم فتح الوردية بنجاح" });
      resetForm();
      setOpenShiftModal(false);
      setRefetch((r) => !r);
    } catch (error) {
      console.error("Error opening shift:", error);
      setMessage({
        type: "error",
        message: error.response?.data?.message ?? "حدث خطأ أثناء فتح الوردية",
      });
    } finally {
      setLoadingBtn(false);
      setSubmitting(false);
    }
  };

  // ── Close Shift ──────────────────────────────────────────────────────────────
  const handleCloseShift = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoadingBtn(true);

      const closeWallets = (values.closeWallets || []).map((s) => {
        const pm = paymentMethods.find(
          (p) => String(p._id) === String(s.paymentMethodId),
        );
        return {
          paymentMethodId: String(s.paymentMethodId),
          name: pm?.name ?? "",
          amount: Number(s.amount) || 0,
        };
      });

      const closingBalance = closeWallets.reduce(
        (acc, cur) => acc + cur.amount,
        0,
      );

      await axiosClient.put(`/shifts/${selectedShift._id}`, {
        endTime: new Date().toISOString(),
        closingBalance,
        closeWallets,
        status: "closed",
        notes: values.notes ?? selectedShift.notes ?? "",
      });

      setMessage({ type: "success", message: "تم إغلاق الوردية بنجاح" });
      resetForm();
      setCloseShiftModal(false);
      setSelectedShift(null);
      setRefetch((r) => !r);
    } catch (error) {
      console.error("Error closing shift:", error);
      setMessage({
        type: "error",
        message: error.response?.data?.message ?? "حدث خطأ أثناء إغلاق الوردية",
      });
    } finally {
      setLoadingBtn(false);
      setSubmitting(false);
    }
  };

  // ── Delete Shift ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      await axiosClient.delete(`/shifts/${deleteModal}`);
      setMessage({ type: "success", message: "تم حذف الوردية بنجاح" });
    } catch (error) {
      console.error("Error deleting shift:", error);
      setMessage({
        type: "error",
        message: error.response?.data?.message ?? "حدث خطأ أثناء حذف الوردية",
      });
    } finally {
      setDeleteModal(false);
      setRefetch((r) => !r);
      setLoadingBtn(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const calculateDuration = (start, end) => {
    if (!end) return "جارية...";
    const diff = new Date(end) - new Date(start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}س ${minutes}د`;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getUserName = (userId) => {
    if (typeof userId === "object" && userId?.userName) return userId.userName;
    return users.find((u) => u._id === userId)?.userName ?? "غير معروف";
  };

  const getUserLocation = (userId) => {
    if (typeof userId === "object" && userId?.location) return userId.location;
    return users.find((u) => u._id === userId)?.location ?? "-";
  };

  // Merge paymentMethods list with shift's startWallets / closeWallets
  const buildWalletRows = (shift) => {
    if (!shift) return [];
    return paymentMethods.map((pm) => {
      const startEntry = (shift.startWallets ?? []).find(
        (s) => String(s.paymentMethodId) === String(pm._id),
      );
      const closeEntry = (shift.closeWallets ?? []).find(
        (s) => String(s.paymentMethodId) === String(pm._id),
      );
      const startAmt = startEntry?.amount ?? null;
      const closeAmt = closeEntry?.amount ?? null;
      const diff =
        startAmt !== null && closeAmt !== null ? closeAmt - startAmt : null;
      return { pm, startAmt, closeAmt, diff };
    });
  };

  // ── Key props force ShiftModal to fully remount when deps change ──────────────
  // This guarantees Formik never picks up stale initialValues that contained
  // undefined amounts, which is what causes the uncontrolled→controlled warning.
  const openModalKey = `open-modal-pms-${paymentMethods.length}`;
  const closeModalKey = `close-modal-pms-${paymentMethods.length}-shift-${selectedShift?._id ?? "none"}`;

  return (
    <div className="min-h-screen" dir="rtl">
      <Message message={message} setMessage={setMessage} />

      {/* ── Open Shift Modal ─────────────────────────────────────────────────── */}
      <ShiftModal
        key={openModalKey}
        mode="open"
        open={openShiftModal}
        setOpen={setOpenShiftModal}
        users={users}
        paymentMethods={paymentMethods}
        initialValues={buildOpenInitialValues(paymentMethods)}
        validationSchema={openShiftSchema}
        onSubmit={handleOpenShift}
        loadingBtn={loadingBtn}
      />

      {/* ── Close Shift Modal ────────────────────────────────────────────────── */}
      <ShiftModal
        key={closeModalKey}
        mode="close"
        open={closeShiftModal}
        setOpen={setCloseShiftModal}
        paymentMethods={paymentMethods}
        selectedShift={selectedShift}
        initialValues={buildCloseInitialValues(paymentMethods, selectedShift)}
        validationSchema={closeShiftSchema}
        onSubmit={handleCloseShift}
        loadingBtn={loadingBtn}
      />

      {/* Delete Modal */}
      <DeleteModal
        deleteReqModal={deleteModal}
        setDeleteReqModal={setDeleteModal}
        name="الوردية"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* ── Wallets Modal ────────────────────────────────────────────────────── */}
      <Modal bgWhite open={walletsModal} setOpen={setWalletsModal}>
        <div className="p-4 md:p-6 w-full max-w-2xl" dir="rtl">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2.5 rounded-xl">
                <Wallet className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">سجل المحافظ</h2>
                {selectedShift && (
                  <p className="mt-0.5 text-gray-500 text-xs">
                    وردية {selectedShift.shiftNumber ?? selectedShift._id}
                  </p>
                )}
              </div>
            </div>
            {selectedShift && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedShift.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {selectedShift.status === "active" ? (
                  <PlayCircle className="w-3 h-3" />
                ) : (
                  <CheckCircle className="w-3 h-3" />
                )}
                {selectedShift.status === "active" ? "نشطة" : "مغلقة"}
              </span>
            )}
          </div>

          {selectedShift ? (
            <>
              {/* ─ Totals row ─ */}
              <div className="gap-3 grid grid-cols-3 mb-5">
                {/* Opening Balance */}
                <div className="bg-blue-50 p-3 border border-blue-100 rounded-xl text-center">
                  <ArrowUpCircle className="mx-auto mb-1 w-4 h-4 text-blue-500" />
                  <p className="mb-1 font-medium text-blue-600 text-xs">
                    رصيد الفتح
                  </p>
                  <p className="font-bold text-blue-700 text-sm">
                    <NumericFormat
                      value={selectedShift.startingBalance ?? 0}
                      displayType="text"
                      thousandSeparator
                      suffix=" EGP"
                    />
                  </p>
                </div>

                {/* Closing Balance */}
                <div
                  className={`rounded-xl p-3 text-center border ${
                    selectedShift.status === "closed"
                      ? "bg-green-50 border-green-100"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <ArrowDownCircle
                    className={`w-4 h-4 mx-auto mb-1 ${
                      selectedShift.status === "closed"
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-xs font-medium mb-1 ${
                      selectedShift.status === "closed"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    رصيد الإغلاق
                  </p>
                  <p
                    className={`font-bold text-sm ${
                      selectedShift.status === "closed"
                        ? "text-green-700"
                        : "text-gray-400"
                    }`}
                  >
                    {selectedShift.status === "closed" ? (
                      <NumericFormat
                        value={selectedShift.closingBalance ?? 0}
                        displayType="text"
                        thousandSeparator
                        suffix=" EGP"
                      />
                    ) : (
                      "—"
                    )}
                  </p>
                </div>

                {/* Net Difference */}
                {(() => {
                  const diff =
                    selectedShift.status === "closed" &&
                    selectedShift.closingBalance != null &&
                    selectedShift.startingBalance != null
                      ? selectedShift.closingBalance -
                        selectedShift.startingBalance
                      : null;
                  const positive = diff !== null && diff >= 0;
                  return (
                    <div
                      className={`rounded-xl p-3 text-center border ${
                        diff === null
                          ? "bg-gray-50 border-gray-100"
                          : positive
                            ? "bg-emerald-50 border-emerald-100"
                            : "bg-red-50 border-red-100"
                      }`}
                    >
                      <TrendingUp
                        className={`w-4 h-4 mx-auto mb-1 ${
                          diff === null
                            ? "text-gray-400"
                            : positive
                              ? "text-emerald-500"
                              : "text-red-500"
                        }`}
                      />
                      <p
                        className={`text-xs font-medium mb-1 ${
                          diff === null
                            ? "text-gray-500"
                            : positive
                              ? "text-emerald-600"
                              : "text-red-600"
                        }`}
                      >
                        صافي الفرق
                      </p>
                      <p
                        className={`font-bold text-sm ${
                          diff === null
                            ? "text-gray-400"
                            : positive
                              ? "text-emerald-700"
                              : "text-red-700"
                        }`}
                      >
                        {diff === null ? (
                          "—"
                        ) : (
                          <NumericFormat
                            value={diff}
                            displayType="text"
                            thousandSeparator
                            prefix={positive ? "+" : ""}
                            suffix=" EGP"
                          />
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* ─ Per-wallet breakdown table ─ */}
              <div className="mb-5">
                <p className="mb-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  تفاصيل المحافظ
                </p>

                {/* Table header */}
                <div className="gap-2 grid grid-cols-4 bg-gray-50 mb-2 px-3 py-2 rounded-lg">
                  <p className="font-semibold text-gray-500 text-xs">
                    وسيلة الدفع
                  </p>
                  <p className="font-semibold text-blue-600 text-xs text-center">
                    رصيد الفتح
                  </p>
                  <p className="font-semibold text-green-600 text-xs text-center">
                    رصيد الإغلاق
                  </p>
                  <p className="font-semibold text-gray-600 text-xs text-center">
                    الفرق
                  </p>
                </div>

                {/* Rows */}
                <div className="space-y-2">
                  {buildWalletRows(selectedShift).map(
                    ({ pm, startAmt, closeAmt, diff }) => (
                      <div
                        key={String(pm._id)}
                        className="items-center gap-2 grid grid-cols-4 hover:bg-gray-50 px-3 py-3 border border-gray-100 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 bg-indigo-400 rounded-full w-2 h-2" />
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {pm.name}
                          </p>
                        </div>

                        <p className="font-semibold text-blue-600 text-sm text-center">
                          {startAmt !== null ? (
                            <NumericFormat
                              value={startAmt}
                              displayType="text"
                              thousandSeparator
                              suffix=" EGP"
                            />
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </p>

                        <p
                          className={`text-sm font-semibold text-center ${
                            closeAmt !== null
                              ? "text-green-600"
                              : "text-gray-300"
                          }`}
                        >
                          {closeAmt !== null ? (
                            <NumericFormat
                              value={closeAmt}
                              displayType="text"
                              thousandSeparator
                              suffix=" EGP"
                            />
                          ) : (
                            "—"
                          )}
                        </p>

                        <p
                          className={`text-sm font-bold text-center ${
                            diff === null
                              ? "text-gray-300"
                              : diff >= 0
                                ? "text-emerald-600"
                                : "text-red-500"
                          }`}
                        >
                          {diff === null ? (
                            "—"
                          ) : (
                            <NumericFormat
                              value={diff}
                              displayType="text"
                              thousandSeparator
                              prefix={diff >= 0 ? "+" : ""}
                              suffix=" EGP"
                            />
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* ─ Notes ─ */}
              {selectedShift.notes && (
                <div className="bg-amber-50 mb-5 p-3 border border-amber-100 rounded-xl">
                  <p className="mb-1 font-semibold text-amber-700 text-xs">
                    ملاحظات
                  </p>
                  <p className="text-amber-800 text-sm">
                    {selectedShift.notes}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="py-8 text-gray-500 text-center">
              اختر وردية لعرض أرصدة المحافظ
            </p>
          )}
        </div>
      </Modal>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto px-3 md:px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <Title
            title="إدارة الورديات"
            count={total}
            subTitle="متابعة وإدارة ورديات الموظفين والرصيد النقدي"
            button={
              <Button
                Icon={PlusIcon}
                onClick={() => setOpenShiftModal(true)}
                label="فتح وردية جديدة"
                variant="filled"
                rounded="xl"
                fixedPadding="3"
                disabled={!!activeShift || role !== "admin"}
                className="text-xs md:text-base"
              />
            }
          />
        </div>

        {/* Active Shift Alert */}
        {activeShift && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl mb-4 md:mb-6 p-4 md:p-6 rounded-xl md:rounded-2xl text-white">
            <div className="flex md:flex-row flex-col justify-between items-start gap-4">
              <div className="flex flex-1 items-start gap-3 md:gap-4 w-full">
                <div className="flex-shrink-0 bg-white/20 backdrop-blur p-2 md:p-3 rounded-xl">
                  <Clock className="w-5 md:w-7 h-5 md:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <h3 className="font-bold text-lg md:text-xl">
                      وردية نشطة حالياً
                    </h3>
                    <span className="bg-white/20 backdrop-blur px-2 md:px-3 py-0.5 md:py-1 rounded-full font-medium text-xs md:text-sm whitespace-nowrap">
                      جارية
                    </span>
                  </div>
                  <div className="gap-2 md:gap-4 grid grid-cols-2 md:grid-cols-4 mt-3 md:mt-4">
                    <div className="bg-white/10 backdrop-blur p-2 md:p-3 rounded-lg md:rounded-xl">
                      <p className="mb-1 text-white/80 text-xs">الموظف</p>
                      <p className="font-bold text-sm md:text-lg truncate">
                        {getUserName(activeShift.user)}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur p-2 md:p-3 rounded-lg md:rounded-xl">
                      <p className="mb-1 text-white/80 text-xs">بدأت الساعة</p>
                      <p className="font-bold text-sm md:text-lg">
                        {formatTime(activeShift.startTime)}
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur p-2 md:p-3 rounded-lg md:rounded-xl">
                      <p className="mb-1 text-white/80 text-xs">
                        الرصيد الإفتتاحي
                      </p>
                      <p className="font-bold text-sm md:text-lg">
                        <NumericFormat
                          value={activeShift.startingBalance}
                          displayType="text"
                          thousandSeparator
                          suffix=" EGP"
                        />
                      </p>
                    </div>
                    <div className="bg-white/10 backdrop-blur p-2 md:p-3 rounded-lg md:rounded-xl">
                      <p className="mb-1 text-white/80 text-xs">
                        المبيعات الحالية
                      </p>
                      <p className="font-bold text-sm md:text-lg">
                        <NumericFormat
                          value={activeShift.totalSales ?? 0}
                          displayType="text"
                          thousandSeparator
                          suffix=" EGP"
                        />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                Icon={StopCircle}
                onClick={() => {
                  setSelectedShift(activeShift);
                  setCloseShiftModal(true);
                }}
                label="إغلاق الوردية"
                variant="filled"
                color="white"
                rounded="xl"
                fixedPadding="3"
                disabled={
                  String(activeShift.user?._id || activeShift.user) !==
                  String(currentUser?._id)
                }
                className="bg-white hover:bg-gray-100 w-full md:w-auto text-green-600 text-sm md:text-base"
              />
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="gap-3 md:gap-6 grid grid-cols-2 md:grid-cols-3 mb-4 md:mb-8">
          <div className="bg-white shadow-lg hover:shadow-xl p-4 md:p-6 border border-gray-100 rounded-xl md:rounded-2xl transition-shadow">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl">
                <Calendar className="w-4 md:w-6 h-4 md:h-6 text-blue-600" />
              </div>
              <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-gray-400" />
            </div>
            <p className="mb-1 text-gray-600 text-xs md:text-sm">
              إجمالي الورديات
            </p>
            <p className="font-bold text-gray-900 text-2xl md:text-3xl">
              {stats.totalShifts}
            </p>
          </div>

          <div className="bg-white shadow-lg hover:shadow-xl p-4 md:p-6 border border-gray-100 rounded-xl md:rounded-2xl transition-shadow">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <div className="bg-green-100 p-2 md:p-3 rounded-lg md:rounded-xl">
                <PlayCircle className="w-4 md:w-6 h-4 md:h-6 text-green-600" />
              </div>
              <Clock className="w-4 md:w-5 h-4 md:h-5 text-gray-400" />
            </div>
            <p className="mb-1 text-gray-600 text-xs md:text-sm">
              الورديات النشطة
            </p>
            <p className="font-bold text-green-600 text-2xl md:text-3xl">
              {stats.activeShifts}
            </p>
          </div>

          <div className="bg-white shadow-lg hover:shadow-xl p-4 md:p-6 border border-gray-100 rounded-xl md:rounded-2xl transition-shadow">
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <div className="bg-gray-100 p-2 md:p-3 rounded-lg md:rounded-xl">
                <CheckCircle className="w-4 md:w-6 h-4 md:h-6 text-gray-600" />
              </div>
              <StopCircle className="w-4 md:w-5 h-4 md:h-5 text-gray-400" />
            </div>
            <p className="mb-1 text-gray-600 text-xs md:text-sm">
              الورديات المغلقة
            </p>
            <p className="font-bold text-gray-900 text-2xl md:text-3xl">
              {stats.closedShifts}
            </p>
          </div>
        </div>

        {/* Filters */}
        <FiltersCombonent
          placeholder="ابحث برقم الوردية أو اسم الموظف..."
          searchField
          search={search}
          setSearch={setSearch}
          dateRange
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onClearDateRange={handleClearDateRange}
          comboBoxes={[
            {
              placeholder: "حالة الوردية",
              value: status,
              onChange: (e) => setStatus(e),
              items: shiftStatuses,
              byId: true,
            },
          ]}
        />

        {/* Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-hidden">
            <ContentTable
              data={shifts.map((shift) => ({
                _id: shift._id,
                shiftId: shift.shiftNumber ?? shift._id,
                user: (
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {getUserName(shift.user)}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {getUserLocation(shift.user)}
                      </p>
                    </div>
                  </div>
                ),
                username: getUserName(shift.user),
                location: getUserLocation(shift.user),
                startTime: (
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatDate(shift.startTime)}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {formatTime(shift.startTime)}
                    </p>
                  </div>
                ),
                startDate: formatDate(shift.startTime),
                startTimeText: formatTime(shift.startTime),
                duration: (
                  <span className="font-medium text-gray-700">
                    {calculateDuration(shift.startTime, shift.endTime)}
                  </span>
                ),
                durationText: calculateDuration(shift.startTime, shift.endTime),
                status: (
                  <span
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium ${
                      shift.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {shift.status === "active" ? (
                      <PlayCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {shift.status === "active" ? "نشطة" : "مغلقة"}
                  </span>
                ),
              }))}
              nodata="ورديات"
              actions={[
                {
                  label: "المحافظ",
                  Icon: Wallet,
                  action: (shift) => {
                    // Always use the full shift from state so wallet arrays are present
                    const fullShift = shifts.find((s) => s._id === shift._id);
                    setSelectedShift(fullShift ?? shift);
                    setWalletsModal(true);
                  },
                  props: { variant: "filled", rounded: "2xl" },
                },
                // {
                //   label: "إغلاق",
                //   Icon: StopCircle,
                //   action: (shift) => {
                //     const fullShift = shifts.find((s) => s._id === shift._id);
                //     if (fullShift?.status === "active") {
                //       setSelectedShift(fullShift);
                //       setCloseShiftModal(true);
                //     }
                //   },
                //   color: "danger",
                //   props: { variant: "filled", rounded: "2xl" },
                //   disabled: (shiftId) =>
                //     shifts.find((s) => s._id === shiftId)?.status !== "active",
                // },
              ]}
              ignore={["_id", "user", "startTime", "duration", "totalSales"]}
              header={[
                "رقم الوردية",
                "الموظف",
                "الموقع",
                "تاريخ البداية",
                "الوقت",
                "المدة",
                "الحالة",
              ]}
              totalPages={totalPages}
              page={page}
              setPage={setPage}
              setLimit={setLimit}
              limit={limit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
