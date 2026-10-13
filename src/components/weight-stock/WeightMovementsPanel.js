"use client";

import { useCallback, useEffect, useState } from "react";
import { HandCoins, RotateCcw, Scale, ShoppingBag, Truck, Warehouse } from "lucide-react";
import { useDebounce } from "use-debounce";
import Cookies from "js-cookie";
import axiosClient from "@/lib/axios-client";
import FiltersCombonent from "../FiltersCombonent";
import Pagination from "../Pagination";
import Modal from "../Modal";
import Button from "../Button";
import { LoadingOverlay, RowsSkeleton, StatCardsSkeleton } from "../Skeleton";
import {
  MOVEMENT_FILTERS,
  MOVEMENT_META,
  formatDateTime,
  formatKg,
  formatMoney,
  signedKg,
} from "./movementMeta";

const EMPTY_STATS = {
  soldKg: 0,
  transferredKg: 0,
  transfersCount: 0,
  transferValue: 0,
  transferCollected: 0,
  addedKg: 0,
};

function SummaryCard({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className={`bg-white p-4 border border-slate-100 rounded-2xl shadow-sm border-r-4 ${accent.border}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl ${accent.bg}`}>
          <Icon className={`w-4 h-4 ${accent.icon}`} />
        </div>
        <span className="text-slate-500 text-xs font-bold">{label}</span>
      </div>
      <p className="text-xl font-black text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function CancelTransferModal({ movement, onClose, onConfirm, isLoading }) {
  const [reason, setReason] = useState("");

  useEffect(() => setReason(""), [movement]);

  return (
    <Modal bgWhite open={!!movement} setOpen={(value) => !value && onClose()}>
      {movement && (
        <div dir="rtl" className="space-y-4">
          <h2 className="font-bold text-gray-900 text-xl">إلغاء عملية النقل #{movement._id}</h2>
          <p className="text-sm text-gray-600">
            سيتم إرجاع <b>{formatKg(movement.weight)}</b> من «{movement.shopName}» إلى المخزن
            {movement.isCollected && movement.price > 0 && (
              <>
                {" "}وخصم <b>{formatMoney(movement.price)}</b> المحصلة من {movement.paymentMethod || "الخزينة"}
              </>
            )}
            .
          </p>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="سبب الإلغاء (اختياري)"
            aria-label="سبب الإلغاء"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-400"
          />
          <div dir="ltr" className="flex justify-between gap-4">
            <Button large onClick={onClose} label="رجوع" variant="outlined" rounded="xl" fixedPadding="3" color="info" />
            <Button
              large
              onClick={() => onConfirm(reason)}
              label="تأكيد الإلغاء"
              isLoading={isLoading}
              disabled={isLoading}
              variant="filled"
              rounded="xl"
              fixedPadding="3"
              color="danger"
            />
          </div>
        </div>
      )}
    </Modal>
  );
}

function MovementRow({ movement, canCancel, onCancel }) {
  const meta = MOVEMENT_META[movement.type] || MOVEMENT_META.adjust;
  const cancelled = movement.status === "cancelled";

  return (
    <div className={`px-4 sm:px-6 py-4 border-slate-200 border-b ${cancelled ? "bg-slate-50/70" : ""}`}>
      <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-3">
        <div className="flex flex-1 items-center gap-3 sm:gap-4 min-w-0">
          <span className={`flex items-center justify-center size-10 rounded-lg ring-1 shrink-0 ${meta.tone}`}>
            <meta.Icon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm sm:text-base truncate">
              {meta.label}
              {movement.shopName && <span className="text-violet-700"> · {movement.shopName}</span>}
              {movement.relatedOrderId && (
                <span className="text-blue-700"> · طلب #{movement.relatedOrderId}</span>
              )}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 text-[11px] sm:text-xs text-slate-500">
              <span>#{movement._id}</span>
              <span>{formatDateTime(movement.createdAt)}</span>
              {movement.createdBy && <span>{movement.createdBy}</span>}
              {movement.notes && <span className="truncate max-w-[260px]">«{movement.notes}»</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          {movement.type === "transfer" && movement.price > 0 && (
            <div className="text-left sm:text-right">
              <p className="font-bold text-slate-800 text-sm tabular-nums">{formatMoney(movement.price)}</p>
              <p className={`text-[11px] font-medium ${movement.isCollected ? "text-emerald-600" : "text-amber-600"}`}>
                {movement.isCollected ? `محصلة · ${movement.paymentMethod || ""}` : "غير محصلة"}
              </p>
            </div>
          )}
          <div className="text-left sm:text-right">
            <p
              className={`font-bold text-base sm:text-lg tabular-nums ${
                cancelled ? "text-slate-400 line-through" : movement.direction === "in" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {signedKg(movement)}
            </p>
            <p className="text-[11px] text-slate-500 tabular-nums">الرصيد بعدها {formatKg(movement.balanceAfter)}</p>
          </div>
          {cancelled ? (
            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">ملغاة</span>
          ) : (
            canCancel &&
            movement.type === "transfer" && (
              <button
                onClick={() => onCancel(movement)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                إلغاء
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function WeightMovementsPanel({ initialType = null, seasonId = null, onChanged }) {
  const [movements, setMovements] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [stock, setStock] = useState(null);
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 600);
  const [type, setType] = useState(initialType);
  const [shop, setShop] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false); // first response received
  const [error, setError] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(Cookies.get("role") === "admin");
    axiosClient
      .get("/shops")
      .then(({ data }) => setShops(data.data || []))
      .catch(() => setShops([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchValue, type, shop, startDate, endDate]);

  const fetchMovements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const params = { page, limit, season: seasonId || "current" };
      if (searchValue) params.search = searchValue;
      if (type) params.type = type;
      if (shop) params.shop = shop;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await axiosClient.get("/weight-stock/movements", { params });
      setMovements(data.data || []);
      setStats(data.stats || EMPTY_STATS);
      setStock(data.stock || null);
      setTotalPages(data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تحميل حركات المخزن");
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [page, limit, searchValue, type, shop, startDate, endDate, seasonId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const confirmCancel = async (reason) => {
    if (!cancelTarget) return;
    try {
      setIsCancelling(true);
      await axiosClient.post(`/weight-stock/movements/${cancelTarget._id}/cancel`, { reason });
      setCancelTarget(null);
      await fetchMovements();
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.message || "فشل إلغاء النقل");
      setCancelTarget(null);
    } finally {
      setIsCancelling(false);
    }
  };

  const isFiltered = Boolean(searchValue || type || shop || startDate || endDate);

  return (
    <div aria-busy={isLoading}>
      {!hasLoaded ? (
        <StatCardsSkeleton className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6" />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          icon={Warehouse}
          label="الرصيد الحالي في المخزن"
          value={formatKg(stock?.currentWeight)}
          hint={`حد التنبيه ${formatKg(stock?.lowStockThreshold)}`}
          accent={{ border: "border-r-emerald-500", bg: "bg-emerald-50", icon: "text-emerald-600" }}
        />
        <SummaryCard
          icon={ShoppingBag}
          label={isFiltered ? "صافي المبيعات (حسب الفلتر)" : "صافي المبيعات"}
          value={formatKg(stats.soldKg)}
          accent={{ border: "border-r-blue-500", bg: "bg-blue-50", icon: "text-blue-600" }}
        />
        <SummaryCard
          icon={Truck}
          label={isFiltered ? "المنقول للمحلات (حسب الفلتر)" : "المنقول للمحلات"}
          value={formatKg(stats.transferredKg)}
          hint={`${stats.transfersCount || 0} عملية نقل`}
          accent={{ border: "border-r-violet-500", bg: "bg-violet-50", icon: "text-violet-600" }}
        />
        <SummaryCard
          icon={HandCoins}
          label="قيمة النقل"
          value={formatMoney(stats.transferValue)}
          hint={`المحصل ${formatMoney(stats.transferCollected)}`}
          accent={{ border: "border-r-amber-500", bg: "bg-amber-50", icon: "text-amber-600" }}
        />
      </div>
      )}

      <FiltersCombonent
        searchField
        search={search}
        setSearch={setSearch}
        placeholder="بحث بالملاحظات، المحل، رقم الطلب..."
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
            placeholder: "نوع الحركة",
            value: type,
            onChange: setType,
            items: MOVEMENT_FILTERS,
            byId: true,
          },
          {
            placeholder: "المحل",
            value: shop,
            onChange: setShop,
            items: shops,
            byId: true,
          },
        ]}
      />

      {error && (
        <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading && hasLoaded && movements.length > 0 && <LoadingOverlay />}

        {isLoading && movements.length === 0 ? (
          <RowsSkeleton count={6} />
        ) : movements.length > 0 ? (
          movements.map((movement) => (
            <MovementRow
              key={movement._id}
              movement={movement}
              canCancel={isAdmin && !seasonId}
              onCancel={setCancelTarget}
            />
          ))
        ) : (
          !isLoading && (
            <div className="px-6 py-12 text-center">
              <Scale className="mx-auto mb-3 w-12 h-12 text-slate-300" />
              <p className="text-slate-600">
                {isFiltered ? "لا توجد حركات مطابقة للفلتر" : "لا توجد حركات على مخزن الوزن بعد"}
              </p>
            </div>
          )
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

      <CancelTransferModal
        movement={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
        isLoading={isCancelling}
      />
    </div>
  );
}
