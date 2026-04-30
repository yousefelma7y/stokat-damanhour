"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, HandCoins, User } from "lucide-react";
import { useDebounce } from "use-debounce";
import Button from "@/components/Button";
import ContentTable from "@/components/contentTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import Message from "@/components/Message";
import Modal from "@/components/Modal";
import PaymentMethodSelect from "@/components/PaymentMethodSelect";
import SearchInput from "@/components/SearchInput";
import Title from "@/components/Title";
import axiosClient from "@/lib/axios-client";

const formatMoney = (amount) =>
  `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0))} EGP`;

const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const DebtStat = ({ label, value, icon: Icon, tone }) => (
  <div className={`rounded-xl border p-4 ${tone}`}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-bold opacity-70">{label}</p>
        <p className="mt-1 text-xl font-black">{value}</p>
      </div>
      <Icon className="h-6 w-6 opacity-80" />
    </div>
  </div>
);

const SettlementModal = ({ customer, isOpen, onClose, onSubmit, loading }) => {
  const [amount, setAmount] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setPaymentMethodId(null);
      setNotes("");
    }
  }, [isOpen]);

  if (!isOpen || !customer) return null;

  const maxAmount = Number(customer.debtBalance || 0);
  const parsedAmount = Number(amount || 0);
  const isInvalid = parsedAmount <= 0 || parsedAmount > maxAmount || !paymentMethodId;

  return (
    <Modal
      bgWhite
      open={isOpen}
      setOpen={(value) => {
        if (!value) onClose();
      }}
      maxWidth="lg"
    >
      <div dir="rtl">
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-900">تسوية مديونية</h3>
          <p className="text-sm font-semibold text-slate-500">{customer.name}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-amber-800">المديونية الحالية</span>
              <span className="font-black text-amber-900">{formatMoney(maxAmount)}</span>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">مبلغ التسوية</label>
            <input
              type="number"
              min="0.01"
              max={maxAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold outline-none focus:border-emerald-500"
              placeholder="0.00"
            />
          </div>

          <PaymentMethodSelect
            value={paymentMethodId}
            onChange={(id) => setPaymentMethodId(id)}
            label="وسيلة التحصيل"
            required
          />

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-700">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
              placeholder="ملاحظات التسوية"
            />
          </div>

          {parsedAmount > maxAmount && (
            <p className="text-sm font-bold text-red-600">
              مبلغ التسوية أكبر من المديونية الحالية.
            </p>
          )}

          <div dir="ltr" className="grid grid-cols-2 gap-3 pt-2">
            <Button
              large
              onClick={onClose}
              label="إلغاء"
              variant="filled"
              color="info"
              rounded="xl"
            />
            <Button
              large
              disabled={isInvalid}
              isLoading={loading}
              onClick={() =>
                onSubmit({
                  customerId: customer._id,
                  amount: parsedAmount,
                  paymentMethodId,
                  notes,
                })
              }
              label="تسوية"
              variant="filled"
              rounded="xl"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default function DebtsPage() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    customersWithDebt: 0,
    totalDebt: 0,
    lifetimeDebt: 0,
    totalSettled: 0,
  });
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 600);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [settlingCustomer, setSettlingCustomer] = useState(null);
  const [isSettling, setIsSettling] = useState(false);
  const [message, setMessage] = useState(false);

  const fetchDebts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosClient.get("/debts", {
        params: { page, limit, search: searchValue },
      });
      setCustomers(data.data || []);
      setStats(data.stats || {});
      setTotalPages(data.pages || 1);
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل تحميل المديونيات",
      });
    } finally {
      setIsLoading(false);
    }
  }, [limit, page, searchValue]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, limit]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleSettle = async (payload) => {
    try {
      setIsSettling(true);
      const { data } = await axiosClient.post("/debts/settle", payload);
      setMessage({ type: "success", message: data.message });
      setSettlingCustomer(null);
      fetchDebts();
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل تسجيل التسوية",
      });
    } finally {
      setIsSettling(false);
    }
  };

  const rows = customers.map((customer) => ({
    _id: customer._id,
    name: customer.name,
    phone: <span dir="ltr">{customer.phone}</span>,
    debtBalance: (
      <span className="font-black text-amber-700">
        {formatMoney(customer.debtBalance)}
      </span>
    ),
    debtOrdersCount: customer.debtOrdersCount || 0,
    oldestDebtAt: formatDate(customer.oldestDebtAt),
    customerRef: customer,
  }));

  return (
    <div dir="rtl" className="min-h-screen ">
      <Message message={message} setMessage={setMessage} />
      <Title
        title="المديونية"
        subTitle="متابعة العملاء أصحاب المبالغ المتبقية"
        count={stats.customersWithDebt || 0}
      />

      <div className="px-4 pb-8">
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <DebtStat
            label="إجمالي المديونية"
            value={formatMoney(stats.totalDebt)}
            icon={HandCoins}
            tone="border-amber-200 bg-amber-50 text-amber-900"
          />
          <DebtStat
            label="عملاء عليهم مديونية"
            value={Number(stats.customersWithDebt || 0).toLocaleString("ar-EG")}
            icon={User}
            tone="border-blue-200 bg-blue-50 text-blue-900"
          />
          <DebtStat
            label="إجمالي المسدد"
            value={formatMoney(stats.totalSettled)}
            icon={CalendarClock}
            tone="border-emerald-200 bg-emerald-50 text-emerald-900"
          />
        </div>

        <div className="mb-4 px-1">
          <SearchInput
            search={search}
            setSearch={setSearch}
            placeholder="ابحث باسم العميل أو رقم الهاتف"
          />
        </div>

        {isLoading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <ContentTable
            data={rows}
            nodata="مديونيات"
            ignore={["customerRef"]}
            actionsLoading={isSettling}
            actions={[
              {
                label: "تسوية",
                Icon: HandCoins,
                action: (row) => setSettlingCustomer(row.customerRef),
                props: {
                  color: "Postage",
                  variant: "filled",
                  rounded: "xl",
                },
              },
            ]}
            header={[
              "رقم العميل",
              "العميل",
              "الهاتف",
              "المبلغ المتبقي",
              "طلبات المديونية",
              "أقدم مديونية",
            ]}
            totalPages={totalPages}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
          />
        )}
      </div>

      <SettlementModal
        isOpen={!!settlingCustomer}
        customer={settlingCustomer}
        onClose={() => setSettlingCustomer(null)}
        onSubmit={handleSettle}
        loading={isSettling}
      />
    </div>
  );
}
