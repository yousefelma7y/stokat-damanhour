"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowDownToLine,
  PencilLine,
  RefreshCw,
  ShoppingBag,
  Truck,
  Warehouse,
} from "lucide-react";
import axiosClient from "@/lib/axios-client";
import WeightStockEditModal from "./WeightStockEditModal";
import WeightTransferModal from "./WeightTransferModal";
import { LoadingOverlay } from "../Skeleton";
import {
  MOVEMENT_META,
  formatDateTime,
  formatKg,
  formatMoney,
  signedKg,
} from "./movementMeta";

function MiniStat({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="rounded-xl bg-white/70 border border-slate-200/80 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className={`w-4 h-4 ${tone}`} />
        {label}
      </div>
      <p className="mt-1 font-bold text-slate-900 text-lg tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="mx-4 sm:mx-8 mt-4 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-12 w-48 rounded bg-slate-200" />
          <div className="h-10 w-full rounded bg-slate-200" />
        </div>
        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="h-20 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WeightStockPanel({ canManage = false, setMessage, refreshKey }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const fetchStock = useCallback(async () => {
    try {
      setLoadError(false);
      const { data: res } = await axiosClient.get("/weight-stock");
      setData(res.data);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock, refreshKey]);

  if (isLoading) return <PanelSkeleton />;

  if (loadError && !data) {
    return (
      <div className="mx-4 sm:mx-8 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700 text-sm">
        تعذر تحميل بيانات مخزن الوزن
        <button
          onClick={fetchStock}
          className="flex items-center gap-1 font-bold cursor-pointer hover:underline"
        >
          <RefreshCw className="w-4 h-4" /> إعادة المحاولة
        </button>
      </div>
    );
  }

  const stock = data?.stock || {};
  const current = Number(stock.currentWeight || 0);
  const threshold = Number(stock.lowStockThreshold || 0);
  const isEmpty = current <= 0;
  const isLow = !isEmpty && data?.isLow;
  const status = isEmpty
    ? { label: "المخزن فارغ", className: "bg-rose-100 text-rose-700" }
    : isLow
      ? { label: "مخزون منخفض", className: "bg-amber-100 text-amber-800" }
      : { label: "متوفر", className: "bg-emerald-100 text-emerald-700" };
  // Bar is scaled so the alert threshold sits at 25% of the track.
  const scale = Math.max(threshold * 4, current, 1);
  const fill = Math.min(100, (current / scale) * 100);
  const today = data?.today || {};
  const month = data?.month || {};
  const recent = data?.recentMovements || [];

  const handleSaved = () => {
    setIsRefreshing(true);
    fetchStock();
  };

  return (
    <section
      aria-labelledby="weight-stock-title"
      aria-busy={isRefreshing}
      className="relative mx-4 sm:mx-8 mt-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm overflow-hidden"
    >
      {isRefreshing && <LoadingOverlay label="جاري تحديث المخزن..." />}
      <div className="grid lg:grid-cols-5">
        {/* Balance */}
        <div className="lg:col-span-2 p-5 sm:p-6 border-b lg:border-b-0 lg:border-l border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <h2 id="weight-stock-title" className="flex items-center gap-2 font-bold text-slate-700">
              <Warehouse className="w-5 h-5 text-emerald-600" />
              مخزن الوزن
            </h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${status.className}`}>
              {status.label}
            </span>
          </div>

          <p className="mt-4 flex items-baseline gap-2">
            <span className="font-black text-slate-900 text-5xl tabular-nums tracking-tight">
              {formatKg(current, { withUnit: false })}
            </span>
            <span className="text-slate-500 font-bold text-lg">كجم</span>
          </p>

          <div className="mt-4">
            <div
              className="relative h-2.5 rounded-full bg-slate-200 overflow-hidden"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={scale}
              aria-valuenow={current}
              aria-label="مستوى المخزون"
            >
              <div
                className={`h-full rounded-full transition-all ${isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                style={{ width: `${fill}%` }}
              />
              {threshold > 0 && (
                <span
                  className="absolute inset-y-0 w-0.5 bg-slate-500/60"
                  style={{ right: `${(threshold / scale) * 100}%` }}
                  aria-hidden="true"
                />
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              حد التنبيه {formatKg(threshold)}
              {stock.updatedAt && <> · آخر تحديث {formatDateTime(stock.updatedAt)}</>}
            </p>
          </div>

          {isLow && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              المخزون أقل من حد التنبيه، أضف وارد جديد قريباً.
            </p>
          )}

          {canManage && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 font-bold text-white text-sm transition-colors cursor-pointer"
              >
                <PencilLine className="w-4 h-4" />
                تعديل المخزون
              </button>
              <button
                onClick={() => setTransferOpen(true)}
                disabled={isEmpty}
                title={isEmpty ? "لا يوجد وزن في المخزن للنقل" : undefined}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 px-4 py-2.5 font-bold text-white text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-600"
              >
                <Truck className="w-4 h-4" />
                نقل لمحل
              </button>
            </div>
          )}
        </div>

        {/* Stats + recent */}
        <div className="lg:col-span-3 p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MiniStat
              icon={ShoppingBag}
              tone="text-blue-600"
              label="مبيعات اليوم"
              value={formatKg(today.soldKg)}
            />
            <MiniStat
              icon={ShoppingBag}
              tone="text-blue-600"
              label="مبيعات الشهر"
              value={formatKg(month.soldKg)}
            />
            <MiniStat
              icon={Truck}
              tone="text-violet-600"
              label="منقول هذا الشهر"
              value={formatKg(month.transferredKg)}
              hint={
                month.transfersCount
                  ? `${month.transfersCount} عملية${month.transferValue ? ` · ${formatMoney(month.transferValue)}` : ""}`
                  : undefined
              }
            />
            <MiniStat
              icon={ArrowDownToLine}
              tone="text-emerald-600"
              label="وارد هذا الشهر"
              value={formatKg(month.addedKg)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-sm">آخر الحركات</h3>
              <Link
                href="/dashboard/accounting?tab=weight"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                كل الحركات
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="max-h-40 overflow-y-auto  ">
              {recent.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-sm text-slate-500">
                  لا توجد حركات بعد.{" "}
                  {canManage ? "ابدأ بإدخال رصيد المخزن الحالي من «تعديل المخزون»." : ""}
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {recent.map((movement) => {
                    const meta = MOVEMENT_META[movement.type] || MOVEMENT_META.adjust;
                    return (
                      <li key={movement._id} className="flex items-center gap-3 px-3 py-2.5">
                        <span className={`flex items-center justify-center size-8 rounded-lg ring-1 shrink-0 ${meta.tone}`}>
                          <meta.Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {meta.label}
                            {movement.shopName && ` · ${movement.shopName}`}
                            {movement.relatedOrderId && ` · طلب #${movement.relatedOrderId}`}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {formatDateTime(movement.createdAt)}
                            {movement.createdBy && ` · ${movement.createdBy}`}
                            {movement.status === "cancelled" && " · ملغاة"}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-bold tabular-nums whitespace-nowrap ${movement.status === "cancelled"
                              ? "text-slate-400 line-through"
                              : movement.direction === "in"
                                ? "text-emerald-600"
                                : "text-rose-600"
                            }`}
                        >
                          {signedKg(movement)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {canManage && (
        <>
          <WeightStockEditModal
            open={editOpen}
            setOpen={setEditOpen}
            stock={stock}
            onSaved={handleSaved}
            setMessage={setMessage}
          />
          <WeightTransferModal
            open={transferOpen}
            setOpen={setTransferOpen}
            stock={stock}
            onSaved={handleSaved}
            setMessage={setMessage}
          />
        </>
      )}
    </section>
  );
}
