"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Lock } from "lucide-react";
import axiosClient from "@/lib/axios-client";

export const formatSeasonDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

export const seasonRangeLabel = (season) =>
  season
    ? `${formatSeasonDate(season.startDate)} ← ${season.endDate ? formatSeasonDate(season.endDate) : "الآن"}`
    : "";

/**
 * Keeps the selected season in the URL (?season=ID) so links from the
 * seasons page open accounting / reports directly on an old season.
 * `seasonId` is null for the current (open) season.
 */
export function useSeasonParam() {
  const [seasonId, setSeasonIdState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const value = Number(new URLSearchParams(window.location.search).get("season"));
    if (Number.isFinite(value) && value > 0) setSeasonIdState(value);
    setReady(true);
  }, []);

  const setSeasonId = useCallback((id) => {
    setSeasonIdState(id || null);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("season", id);
    else url.searchParams.delete("season");
    window.history.replaceState(null, "", url);
  }, []);

  return { seasonId, setSeasonId, ready };
}

/** Dropdown to view the current season or any closed one. */
export default function SeasonSwitcher({ value, onChange, tone = "light", className = "" }) {
  const [seasons, setSeasons] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get("/seasons", { params: { lite: 1 } })
      .then(({ data }) => {
        setSeasons(data.data || []);
        setCurrentId(data.currentId);
      })
      .catch(() => setSeasons([]))
      .finally(() => setIsLoading(false));
  }, []);

  // A stale ?season= pointing at the open season is the same as "current".
  useEffect(() => {
    if (value && currentId && value === currentId) onChange?.(null);
  }, [value, currentId, onChange]);

  const dark = tone === "dark";

  if (isLoading) {
    return (
      <span
        role="status"
        aria-label="جاري تحميل المواسم"
        className={`block h-[38px] w-36 rounded-xl animate-pulse ${dark ? "bg-white/20" : "bg-slate-200"} ${className}`}
      />
    );
  }
  if (seasons.length === 0) return null;

  const viewingClosed = Boolean(value);

  return (
    <label
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold ${
        viewingClosed
          ? "border-amber-300 bg-amber-50 text-amber-900"
          : dark
            ? "border-white/20 bg-white/10 text-white"
            : "border-slate-200 bg-white text-slate-700"
      } ${className}`}
    >
      {viewingClosed ? (
        <Lock className="w-4 h-4 shrink-0" />
      ) : (
        <CalendarClock className="w-4 h-4 shrink-0" />
      )}
      <span className="sr-only">الموسم</span>
      <select
        value={value || currentId || ""}
        onChange={(e) => {
          const id = Number(e.target.value);
          onChange?.(id === currentId ? null : id);
        }}
        className={`bg-transparent outline-none cursor-pointer max-w-[190px] ${
          dark && !viewingClosed ? "[&>option]:text-slate-800" : ""
        }`}
      >
        {seasons.map((season) => (
          <option key={season._id} value={season._id}>
            {season.name}
            {season.status === "open" ? " (الحالي)" : " — مغلق"}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Shown above a page while an old, locked season is being viewed. */
export function ClosedSeasonBanner({ season, onBack }) {
  if (!season || season.isCurrent) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <span className="flex items-center gap-2">
        <Lock className="w-4 h-4 shrink-0" />
        <span>
          تعرض الآن بيانات <b>{season.name}</b> المغلق ({seasonRangeLabel(season)}) — للقراءة فقط.
        </span>
      </span>
      <button
        onClick={onBack}
        className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 font-bold text-white text-xs cursor-pointer"
      >
        العودة للموسم الحالي
      </button>
    </div>
  );
}
