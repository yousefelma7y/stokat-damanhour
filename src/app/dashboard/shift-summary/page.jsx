"use client";
import React, { useEffect, useState } from "react";
import Title from "../../../components/Title";
import Button from "../../../components/Button";
import ContentTable from "../../../components/contentTable";
import Message from "../../../components/Message";
import Modal from "../../../components/Modal";
import {
  PlusIcon,
  FileText,
  CheckCircle,
  StopCircle,
  User,
  CalendarClock,
  Wallet,
  Coins,
  Clock,
} from "lucide-react";
import axiosClient from "@/lib/axios-client";
import Cookies from "js-cookie";
import { NumericFormat } from "react-number-format";
import ShiftSummaryReportModal from "./ShiftSummaryReportModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import FiltersComponent from "@/components/FiltersCombonent";

export default function ShiftSummaryPage() {
  const [summaries, setSummaries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [role, setRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeShift, setActiveShift] = useState(null);
  const [filterId, setFilterId] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

  const [isMounted, setIsMounted] = useState(false);
  const [formUser, setFormUser] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [walletsInput, setWalletsInput] = useState({});

  useEffect(() => {
    setIsMounted(true);
    const r = Cookies.get("role");
    setRole(r);
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const u = JSON.parse(userCookie);
        setCurrentUser(u);
        if (r !== "admin") {
          setFormUser(u._id);
        }
      } catch (e) {
        console.error("Error parsing user cookie", e);
      }
    }
  }, []);

  useEffect(() => {
    if (role === "admin") {
      axiosClient
        .get("/users?role=cashier&limit=1000")
        .then((res) => setUsers(res.data.data || []));
    }
    axiosClient.get("/payment-methods?limit=1000").then((res) => {
      const pm = res.data.data || res.data || [];
      setPaymentMethods(pm);
      const initialWallets = {};
      pm.forEach((p) => {
        initialWallets[p._id] = "";
      });
      setWalletsInput(initialWallets);
    });
  }, [role]);

  const fetchSummaries = async () => {
    try {
      setIsLoading(true);
      const params = { page, limit: 15 };
      if (role && role !== "admin" && currentUser?._id) {
        params.user = currentUser._id;
      }
      if (filterId) params.search = filterId;
      if (filterStart) params.startDate = new Date(filterStart).toISOString();
      if (filterEnd) params.endDate = new Date(filterEnd).toISOString();

      const res = await axiosClient.get(`/shift-summaries`, { params });
      const loadedSummaries = res.data.data || [];

      // Fetch dynamic expected difference for each summary to match the popup logic exactly
      const enrichedSummaries = await Promise.all(
        loadedSummaries.map(async (s) => {
          try {
            const transRes = await axiosClient.get(`/transactions`, {
              params: {
                createdBy: s.userName || s.user?.userName,
                startDate: new Date(s.startTime).toISOString(),
                endDate: new Date(s.endTime).toISOString(),
                limit: 1000,
              },
            });
            const transactions = transRes.data.data || [];
            const expectedChange = transactions.reduce((sum, t) => {
              if (t.type === "income") return sum + t.amount;
              if (t.type === "payment") return sum - t.amount;
              return sum;
            }, 0);

            return {
              ...s,
              computedDifferenceFromExpected:
                s.totalDifference - expectedChange,
            };
          } catch (err) {
            console.error("Error fetching transactions for summary", err);
            return s;
          }
        }),
      );

      setSummaries(enrichedSummaries);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchSummaries();
    }
  }, [page, role, currentUser, isMounted, filterId, filterStart, filterEnd]);

  // When form user changes, check for active shift
  useEffect(() => {
    if (formUser) {
      axiosClient
        .get(`/shifts`, { params: { status: "active", user: formUser } })
        .then((res) => {
          const active = res.data.data?.find(
            (s) => String(s.user?._id || s.user) === String(formUser),
          );
          if (active) {
            setActiveShift(active);
            // Format specifically for datetime-local input (YYYY-MM-DDThh:mm)
            const start = new Date(active.startTime);
            start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
            setFromDate(start.toISOString().slice(0, 16));
          } else {
            setActiveShift(null);
            // Default to start of today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
            setFromDate(today.toISOString().slice(0, 16));
          }
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          setToDate(now.toISOString().slice(0, 16));
        })
        .catch((err) => console.error(err));
    }
  }, [formUser]);

  const handleWalletChange = (id, val) => {
    setWalletsInput((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formUser || !fromDate || !toDate) {
      return setMessage({
        type: "error",
        message: "يرجى تعبئة جميع الحقول المطلوبة",
      });
    }
    try {
      setIsSubmitting(true);

      // Calculate system amounts
      // 1. Get transactions in this period
      const selectedUserDetails =
        role === "admin"
          ? users.find((u) => String(u._id) === String(formUser))
          : currentUser;
      const userName = selectedUserDetails?.userName || "";

      const transRes = await axiosClient.get(`/transactions`, {
        params: {
          createdBy: userName,
          startDate: new Date(fromDate).toISOString(),
          endDate: new Date(toDate).toISOString(),
          limit: 1000,
        },
      });
      const transactions = transRes.data.data || [];

      // 2. Aggregate per payment method
      const startBalances = {};
      if (activeShift) {
        (activeShift.startWallets || []).forEach((sw) => {
          startBalances[sw.paymentMethodId] = sw.amount || 0;
        });
      }

      let totalActual = 0;
      let totalSystem = 0;

      const walletsData = paymentMethods.map((pm) => {
        const pId = String(pm._id);
        const startAmt = startBalances[pId] || 0;

        let incomes = 0;
        let expenses = 0;

        transactions.forEach((t) => {
          if (t.type === "transfer") {
            // If this wallet is the SOURCE of a transfer, it's money going out
            if (String(t.fromWallet) === String(pm._id)) {
              expenses += t.amount;
            }
            // If this wallet is the TARGET of a transfer, it's money coming in
            if (String(t.toWallet) === String(pm._id)) {
              incomes += t.amount;
            }
          } else {
            // Check if transaction belongs to this payment method
            const isMatch =
              String(t.paymentMethodId) === String(pm._id) ||
              t.paymentMethod === pm.name;

            if (isMatch) {
              if (t.type === "income" || t.category === "income")
                incomes += t.amount;
              else if (t.type === "payment" || t.category === "expense")
                expenses += t.amount;
            }
          }
        });

        const sysAmt = startAmt + incomes - expenses;
        const actAmt = Number(walletsInput[pId]) || 0;

        totalActual += actAmt;
        totalSystem += startAmt; // Now using startAmt as totalSystem to represent Opening Balance

        return {
          paymentMethodId: pm._id,
          name: pm.name,
          actualAmount: actAmt,
          systemAmount: startAmt, // Store start balance as system amount per user request
          expectedAmount: sysAmt, // Keep this for reference
          difference: actAmt - startAmt, // Net change in the wallet
          discrepancy: actAmt - sysAmt, // Actual - Expected
        };
      });

      const payload = {
        user: formUser,
        userName: userName,
        startTime: new Date(fromDate).toISOString(),
        endTime: new Date(toDate).toISOString(),
        wallets: walletsData,
        totalActual,
        totalSystem, // This is now Total Opening Balance
        totalDifference: totalActual - totalSystem, // Total change
        isActive: false,
      };

      // Create Shift Summary
      const summaryRes = await axiosClient.post("/shift-summaries", payload);

      // Close Active Shift if exists
      if (activeShift) {
        const closeWallets = walletsData.map((w) => ({
          paymentMethodId: String(w.paymentMethodId),
          name: w.name,
          amount: w.actualAmount,
        }));

        await axiosClient
          .put(`/shifts/${activeShift._id}`, {
            endTime: new Date(toDate).toISOString(),
            closingBalance: totalActual,
            closeWallets: closeWallets,
            status: "closed",
            notes: `تم الإغلاق عبر جرد الوردية الآلي - ${summaryRes.data.data.summaryNumber}`,
          })
          .catch((err) => console.error("Failed to close shift", err));
      }

      setMessage({
        type: "success",
        message: "تم إغلاق الوردية وإنشاء تقرير الجرد بنجاح",
      });
      setOpenModal(false);
      fetchSummaries();

      // If the current user is a cashier and they just closed their own shift, sign them out immediately
      if (role === "cashier" && String(formUser) === String(currentUser?._id)) {
        setTimeout(() => {
          window.location.href = "/signin"; // Direct redirect for cleaner exit
        }, 3000); // 3 seconds delay to allow them to see the success message
      }

      // Open the report
      setSelectedSummary(summaryRes.data.data);
      setReportModal(true);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        message: error?.response?.data?.message || "حدث خطأ",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const transformSummariesForTable = () => {
    return (summaries || []).map((s) => ({
      _id: s._id,
      // summaryNumber: s.summaryNumber,
      employee: s.user?.userName || s.userName,
      startTime: isMounted ? new Date(s.startTime).toLocaleString("ar-EG") : "",
      endTime: isMounted ? new Date(s.endTime).toLocaleString("ar-EG") : "",
      totalSystem: (
        <NumericFormat
          value={s.totalSystem}
          displayType="text"
          thousandSeparator
          suffix=" ج.م"
        />
      ),
      totalActual: (
        <NumericFormat
          value={s.totalActual}
          displayType="text"
          thousandSeparator
          suffix=" ج.م"
        />
      ),
      totalDifference: (
        <span
          className={`font-bold ${
            s.totalDifference < 0
              ? "text-red-600"
              : s.totalDifference > 0
                ? "text-amber-600"
                : "text-emerald-600"
          }`}
        >
          <NumericFormat
            value={s.totalDifference}
            displayType="text"
            thousandSeparator
            suffix=" ج.م"
            prefix={s.totalDifference > 0 ? "+" : ""}
          />
        </span>
      ),
      status: (() => {
        const differenceFromExpected =
          s.computedDifferenceFromExpected !== undefined
            ? s.computedDifferenceFromExpected
            : (s.wallets || []).reduce(
                (sum, w) => sum + (w.discrepancy || 0),
                0,
              );
        const loading = isLoading;
        return (
          !loading && (
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
          )
        );
      })(),
    }));
  };

  return (
    <div className="min-h-screen" dir="rtl">
      <Message message={message} setMessage={setMessage} />

      <div className="">
        <Title
          title="جرد الورديات"
          count={total}
          subTitle="إدارة ومتابعة تقارير جرد الكاشير وإغلاق الورديات اليومية"
          button={
            <Button
              Icon={StopCircle}
              rounded={"xl"}
              onClick={() => {
                const initialWallets = {};
                paymentMethods.forEach((p) => {
                  initialWallets[p._id] = "";
                });
                setWalletsInput(initialWallets);
                setOpenModal(true);
              }}
              label="إغلاق الوردية (بدء الجرد)"
              variant="filled"
              disabled={
                !activeShift ||
                (String(activeShift.user?._id || activeShift.user) !==
                  String(currentUser?._id) &&
                  role !== "admin")
              }
              className="bg-indigo-600 hover:bg-indigo-700 text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          }
        />
      </div>

      {/* Filters */}
      <FiltersComponent
        searchField={true}
        search={filterId}
        setSearch={(value) => {
          setFilterId(value);
          setPage(1);
        }}
        placeholder="بحث برقم الجرد..."
        dateRange={true}
        startDate={filterStart}
        endDate={filterEnd}
        setStartDate={(value) => {
          setFilterStart(value);
          setPage(1);
        }}
        setEndDate={(value) => {
          setFilterEnd(value);
          setPage(1);
        }}
        onClearDateRange={() => {
          setFilterStart("");
          setFilterEnd("");
          setPage(1);
        }}
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="">
          <ContentTable
            header={[
              "رقم الجرد",
              "الموظف",
              "وقت البداية",
              "وقت الإغلاق",
              " المبدئي",
              " النهائي",
              "الفرق",
              "الحالة",
            ]}
            data={transformSummariesForTable()}
            actions={[
              {
                label: "تفاصيل التقرير",
                Icon: FileText,
                action: (row) => {
                  const original = summaries.find((sym) => sym._id === row._id);
                  setSelectedSummary(original);
                  setReportModal(true);
                },
                props: {
                  color: "blue",
                  variant: "outlined",
                  rounded: "2xl",
                },
              },
            ]}
            setPage={setPage}
            page={page}
          />
        </div>
      )}

      {/* Close Shift / Create Summary Modal */}
      <Modal maxWidth="2xl" bgWhite open={openModal} setOpen={setOpenModal}>
        <div className="p-4 " dir="rtl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 shadow-sm">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                إغلاق وردية وجرد صندوق
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                تأكد من إدخال المبالغ الفعلية الموجودة في الصندوق بشكل دقيق.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 max-h-[75vh] overflow-y-auto md:max-h-[90vh] "
          >
            {/* User Selection */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                <User className="w-4 h-4 text-indigo-500" />
                الموظف (الكاشير)
              </label>
              {role === "admin" ? (
                <div className="relative">
                  <select
                    value={formUser}
                    onChange={(e) => setFormUser(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-gray-700 appearance-none scroll-pr-6"
                    required
                  >
                    <option value="">-- اختر الموظف --</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.userName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={currentUser?.userName || ""}
                    disabled
                    className="w-full border border-gray-200 bg-gray-100 rounded-xl p-3 text-gray-600 font-medium cursor-not-allowed"
                  />
                  <div className="absolute left-3 top-3.5">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              )}
            </div>

            {activeShift && (
              <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-xl flex items-start md:items-center gap-3 text-blue-800 shadow-sm">
                <div className="bg-blue-100 p-1.5 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium leading-relaxed">
                  يوجد وردية <span className="font-bold">نشطة</span> مفتوحة
                  حالياً. سيتم إغلاقها تلقائياً عند تأكيد عملية الجرد.
                </div>
              </div>
            )}

            {/* Date/Time Pickers */}
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-4">
                <CalendarClock className="w-4 h-4 text-indigo-500" />
                فترة الوردية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">
                    من (وقت بدء الوردية)
                  </label>
                  <input
                    disabled
                    type="datetime-local"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-700 font-medium font-sans"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 pl-1">
                    إلى (وقت إغلاق الوردية)
                  </label>
                  <input
                    disabled
                    type="datetime-local"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-700 font-medium font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Wallets Input */}
            <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-5">
                <h3 className="flex items-center gap-2 text-base font-bold text-indigo-900">
                  <Wallet className="w-5 h-5 text-indigo-600" />
                  المبالغ الفعلية (الجرد المادي)
                </h3>
                <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg">
                  الموجود بالدرج
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {paymentMethods.map((pm) => (
                  <div key={pm._id} className="relative group">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 transition-colors group-focus-within:text-indigo-600">
                      {pm.name}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute right-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                        <Coins className="w-5 h-5" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={walletsInput[pm._id] || ""}
                        onChange={(e) =>
                          handleWalletChange(pm._id, e.target.value)
                        }
                        className="w-full border border-gray-300 bg-white rounded-xl p-3 pr-10 pl-12 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-gray-800 font-bold placeholder-gray-300"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm bg-gray-100 px-2 py-0.5 rounded-md">
                        ج.م
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-6 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
              <Button
                large
                color="success"
                type="submit"
                disabled={
                  isSubmitting ||
                  paymentMethods.some((pm) => walletsInput[pm._id] === "")
                }
                label="إغلاق الوردية والتأكيد"
                variant="filled"
                rounded="xl"
              />
              <Button
                large
                color="danger"
                onClick={() => setOpenModal(false)}
                label="إلغاء"
                variant="filled"
                rounded="xl"
              />
            </div>
          </form>
        </div>
      </Modal>

      {/* Report Modal */}
      <ShiftSummaryReportModal
        open={reportModal}
        setOpen={setReportModal}
        summary={selectedSummary}
      />
    </div>
  );
}
