"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  ChevronDown,
  CreditCard,
  Download,
  Loader,
  Lock,
  RotateCcw,
} from "lucide-react";
import Message from "@/components/Message";
import Title from "@/components/Title";
import {
  LoadingOverlay,
  Skeleton,
  Spinner,
  StatCardsSkeleton,
} from "@/components/Skeleton";
import ProtectedPage from "@/components/ProtectedPage";
import axiosClient from "@/lib/axios-client";
import CloseSeasonModal from "@/components/seasons/CloseSeasonModal";
import { SeasonBalances, SeasonTotals } from "@/components/seasons/SeasonSummary";
import { formatSeasonDate, seasonRangeLabel } from "@/components/seasons/SeasonSwitcher";
import { formatMoney } from "@/components/weight-stock/movementMeta";

const daysSince = (date) =>
  Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));

function SectionLabel({ children, hint }) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
      <h3 className="font-bold text-slate-800 text-sm">{children}</h3>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
  );
}

function SeasonsSkeleton() {
  return (
    <div role="status" aria-label="جاري تحميل المواسم" className="mx-4 sm:mx-8 space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-60 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-12 w-56 rounded-xl" />
        </div>
        <div className="space-y-6 p-5 sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <StatCardsSkeleton count={6} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <StatCardsSkeleton count={4} />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        {[0, 1].map((key) => (
          <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </div>
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ClosedSeasonCard({ season, canReopen, busy, onDownload, onReopen }) {
  const [open, setOpen] = useState(false);
  const totals = season.totals || {};
  const profit = Number(totals.netProfit || 0);

  return (
    <li className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5">
        <button
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-3 text-right cursor-pointer min-w-0"
        >
          <span className="flex items-center justify-center size-10 rounded-xl bg-slate-100 text-slate-600 shrink-0">
            <Lock className="w-4 h-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-slate-900 truncate">{season.name}</span>
            <span className="block text-xs text-slate-500">
              {seasonRangeLabel(season)}
              {season.closedBy && ` · أقفله ${season.closedBy}`}
            </span>
          </span>
          <span className="hidden sm:block text-left">
            <span className="block text-[11px] text-slate-500">صافي الربح</span>
            <span className={`block font-bold tabular-nums ${profit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {formatMoney(profit)}
            </span>
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/accounting?season=${season._id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <CreditCard className="w-3.5 h-3.5" />
            الحسابات
          </Link>
          <Link
            href={`/dashboard?season=${season._id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            التقارير
          </Link>
          <button
            onClick={() => onDownload(season)}
            disabled={busy === `download-${season._id}`}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-60"
          >
            {busy === `download-${season._id}` ? (
              <Loader className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            نسخة احتياطية
          </button>
          {/* {canReopen && (
            <button
              onClick={() => onReopen(season)}
              disabled={busy === `reopen-${season._id}`}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3 py-2 text-xs font-bold text-amber-800 cursor-pointer disabled:opacity-60"
            >
              {busy === `reopen-${season._id}` ? (
                <Spinner className="w-3.5 h-3.5" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              إعادة فتح
            </button>
          )} */}
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          <div>
            <SectionLabel>نشاط الموسم</SectionLabel>
            <SeasonTotals totals={totals} />
          </div>
          <div>
            <SectionLabel hint="رُحِّلت كأرصدة افتتاحية للموسم التالي">الأرصدة عند الإقفال</SectionLabel>
            <SeasonBalances balances={season.closing} />
          </div>
          {season.notes && (
            <p className="text-sm text-slate-600">
              <b>ملاحظات:</b> {season.notes}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function SeasonsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [busy, setBusy] = useState(null);
  const [justClosed, setJustClosed] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false); // reloading after close / reopen

  const fetchSeasons = useCallback(async ({ refresh = false } = {}) => {
    try {
      if (refresh) setIsRefreshing(true);
      const { data: res } = await axiosClient.get("/seasons");
      setData(res.data);
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل تحميل المواسم",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const handleDownload = async (season) => {
    try {
      setBusy(`download-${season._id}`);
      const response = await axiosClient.get(`/seasons/${season._id}/export`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `season-${season._id}-backup.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", message: "فشل تحميل النسخة الاحتياطية" });
    } finally {
      setBusy(null);
    }
  };

  const handleReopen = async (season) => {
    if (!window.confirm(`إعادة فتح «${season.name}»؟ سيُحذف الموسم الجديد الفارغ.`)) return;
    try {
      setBusy(`reopen-${season._id}`);
      await axiosClient.post(`/seasons/${season._id}/reopen`);
      setJustClosed(null);
      setMessage({ type: "success", message: `تم إعادة فتح ${season.name}` });
      await fetchSeasons({ refresh: true });
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل إعادة فتح الموسم",
      });
    } finally {
      setBusy(null);
    }
  };

  const current = data?.current;
  const season = current?.season;
  const closedSeasons = data?.closedSeasons || [];
  const blockers = data?.blockers || { canClose: true, pendingOrders: 0 };
  const reopen = data?.reopen || {};

  return (
    <ProtectedPage page="seasons">
      <div dir="rtl" className="pb-12">
        <Message message={message} setMessage={setMessage} />

        <Title
          withoutCount
          title="المواسم"
          subTitle="أقفل الموسم الحالي واحفظه، وابدأ موسماً جديداً بأرقام من صفر"
        />

        {isLoading ? (
          <SeasonsSkeleton />
        ) : !season ? (
          <p className="mx-4 sm:mx-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            تعذر تحميل بيانات المواسم.
          </p>
        ) : (
          <div className="relative mx-4 sm:mx-8 space-y-8" aria-busy={isRefreshing}>
            {isRefreshing && <LoadingOverlay label="جاري تحديث المواسم..." />}
            {justClosed && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900"
              >
                <span>
                  تم إقفال <b>{justClosed.closed.name}</b> وبدء <b>{justClosed.next.name}</b>. يُفضل
                  تحميل نسخة احتياطية من الموسم المغلق وحفظها خارج النظام.
                </span>
                <button
                  onClick={() => handleDownload(justClosed.closed)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  تحميل النسخة الاحتياطية
                </button>
              </div>
            )}

            {/* Current season */}
            <section
              aria-labelledby="current-season-title"
              className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center size-12 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <CalendarClock className="w-6 h-6" />
                  </span>
                  <div>
                    <h2 id="current-season-title" className="flex flex-wrap items-center gap-2 font-bold text-slate-900 text-xl">
                      {season.name}
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        الموسم الحالي
                      </span>
                    </h2>
                    <p className="text-sm text-slate-500">
                      بدأ في {formatSeasonDate(season.startDate)} · منذ {daysSince(season.startDate).toLocaleString("ar-EG")} يوم
                      {Number(season.opening?.systemBalance) > 0 &&
                        ` · رصيد افتتاحي ${formatMoney(season.opening.systemBalance)}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCloseOpen(true)}
                  disabled={!blockers.canClose}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-3 font-bold text-white text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
                >
                  <Lock className="w-4 h-4" />
                  إقفال الموسم وبدء موسم جديد
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                {!blockers.canClose && (
                  <p className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    يوجد {blockers.pendingOrders.toLocaleString("ar-EG")} طلب معلق. أكملها أو ألغها قبل إقفال الموسم.
                    <Link href="/dashboard/create-order" className="font-bold underline">
                      الطلبات المعلقة
                    </Link>
                  </p>
                )}
                <div>
                  <SectionLabel hint="تبدأ من صفر في الموسم الجديد">نشاط الموسم حتى الآن</SectionLabel>
                  <SeasonTotals totals={current.totals} />
                </div>
                <div>
                  <SectionLabel hint="تُرحَّل كما هي للموسم الجديد">الأرصدة الحالية</SectionLabel>
                  <SeasonBalances balances={current.balances} />
                </div>
              </div>
            </section>

            {/* Closed seasons */}
            <section aria-labelledby="closed-seasons-title">
              <h2 id="closed-seasons-title" className="mb-3 font-bold text-slate-900 text-lg">
                المواسم المغلقة
              </h2>
              {closedSeasons.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                  لا توجد مواسم مغلقة بعد. عند إقفال الموسم الحالي سيظهر هنا بكل بياناته.
                </p>
              ) : (
                <ul className="space-y-3">
                  {closedSeasons.map((item) => (
                    <ClosedSeasonCard
                      key={item._id}
                      season={item}
                      canReopen={reopen.canReopen && reopen.seasonId === item._id}
                      busy={busy}
                      onDownload={handleDownload}
                      onReopen={handleReopen}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <CloseSeasonModal
          open={closeOpen}
          setOpen={setCloseOpen}
          current={current}
          nextDefaultName={`الموسم ${closedSeasons.length + 2}`}
          onClosed={(result) => {
            setJustClosed(result);
            setMessage({ type: "success", message: "تم إقفال الموسم وبدء موسم جديد" });
            fetchSeasons({ refresh: true });
          }}
        />
      </div>
    </ProtectedPage>
  );
}
