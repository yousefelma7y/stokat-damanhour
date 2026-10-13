"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, BellRing, ClipboardCheck } from "lucide-react";
import Modal from "../Modal";
import Button from "../Button";
import axiosClient from "@/lib/axios-client";
import { formatKg, roundKg } from "./movementMeta";

const MODES = [
  {
    id: "add",
    label: "إضافة وارد",
    hint: "وزن جديد دخل المخزن",
    Icon: ArrowDownToLine,
    active: "border-emerald-500 bg-emerald-50 text-emerald-800",
  },
  {
    id: "deduct",
    label: "خصم",
    hint: "تالف، فاقد أو استخدام داخلي",
    Icon: ArrowUpFromLine,
    active: "border-rose-500 bg-rose-50 text-rose-800",
  },
  {
    id: "set",
    label: "ضبط الرصيد",
    hint: "إدخال الرصيد الفعلي بعد الجرد",
    Icon: ClipboardCheck,
    active: "border-blue-500 bg-blue-50 text-blue-800",
  },
];

export default function WeightStockEditModal({ open, setOpen, stock, onSaved, setMessage }) {
  const currentWeight = Number(stock?.currentWeight || 0);
  const [mode, setMode] = useState("add");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [threshold, setThreshold] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(currentWeight > 0 ? "add" : "set");
    setWeight("");
    setNotes("");
    setError("");
    setThreshold(String(stock?.lowStockThreshold ?? ""));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = Number(weight);
  const hasWeight = weight !== "" && Number.isFinite(parsed) && parsed >= 0;

  const nextBalance = useMemo(() => {
    if (!hasWeight) return null;
    if (mode === "add") return roundKg(currentWeight + parsed);
    if (mode === "deduct") return roundKg(currentWeight - parsed);
    return roundKg(parsed);
  }, [currentWeight, hasWeight, mode, parsed]);

  const thresholdChanged =
    threshold !== "" && Number(threshold) !== Number(stock?.lowStockThreshold ?? 0);
  const invalidDeduct = mode === "deduct" && hasWeight && parsed > currentWeight;
  const zeroMove = mode !== "set" && hasWeight && parsed === 0;
  const canSubmit =
    !isSaving && ((hasWeight && !invalidDeduct && !zeroMove) || (!weight && thresholdChanged));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSaving(true);
      setError("");
      const { data } = await axiosClient.put("/weight-stock", {
        mode,
        weight: hasWeight ? parsed : undefined,
        notes,
        lowStockThreshold: thresholdChanged ? Number(threshold) : undefined,
      });
      setMessage?.({ type: "success", message: "تم تحديث مخزون الوزن" });
      onSaved?.(data.data);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تحديث المخزون");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal bgWhite maxWidth="xl" open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit} dir="rtl" className="space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 text-2xl">تعديل مخزون الوزن</h2>
          <p className="text-gray-500 text-sm mt-1">
            الرصيد الحالي{" "}
            <span className="font-bold text-gray-800">{formatKg(currentWeight)}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="نوع التعديل">
          {MODES.map(({ id, label, hint, Icon, active }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={mode === id}
              onClick={() => setMode(id)}
              className={`flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 p-3 rounded-xl border-2 text-right transition-colors cursor-pointer ${
                mode === id ? active : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>
                <span className="block font-bold text-sm">{label}</span>
                <span className="block text-xs opacity-75">{hint}</span>
              </span>
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="stock-weight" className="block mb-1.5 font-medium text-gray-700 text-sm">
            {mode === "set" ? "الرصيد الفعلي في المخزن" : "الوزن"}
          </label>
          <div className="relative">
            <input
              id="stock-weight"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.001"
              autoFocus
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl text-2xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">كجم</span>
          </div>

          {nextBalance !== null && (
            <div
              className={`mt-3 flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                invalidDeduct ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-700"
              }`}
              aria-live="polite"
            >
              <span>{invalidDeduct ? "الخصم أكبر من الرصيد المتاح" : "الرصيد بعد الحفظ"}</span>
              <span className="font-bold tabular-nums">
                {formatKg(currentWeight)} ← {formatKg(Math.max(0, nextBalance))}
              </span>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="stock-notes" className="block mb-1.5 font-medium text-gray-700 text-sm">
            ملاحظات <span className="text-gray-400 font-normal">(اختياري)</span>
          </label>
          <textarea
            id="stock-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={mode === "add" ? "مثال: شحنة من المورد ..." : "سبب التعديل ..."}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <BellRing className="w-5 h-5 text-amber-600 shrink-0" />
          <label htmlFor="stock-threshold" className="flex-1 text-sm text-amber-900">
            نبهني عندما يقل المخزون عن
          </label>
          <div className="relative w-32">
            <input
              id="stock-threshold"
              type="number"
              min="0"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full pl-11 pr-3 py-2 border border-amber-300 bg-white rounded-lg font-bold tabular-nums outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">كجم</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div dir="ltr" className="flex justify-between gap-4 pt-2">
          <Button
            large
            onClick={() => setOpen(false)}
            label="إلغاء"
            variant="filled"
            rounded="xl"
            fixedPadding="3"
            color="danger"
          />
          <Button
            large
            type="submit"
            label="حفظ"
            isLoading={isSaving}
            disabled={!canSubmit}
            variant="filled"
            rounded="xl"
            fixedPadding="3"
          />
        </div>
      </form>
    </Modal>
  );
}
