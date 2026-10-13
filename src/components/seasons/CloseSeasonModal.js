"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Lock, RotateCcw } from "lucide-react";
import Modal from "../Modal";
import Button from "../Button";
import axiosClient from "@/lib/axios-client";
import { formatMoney } from "../weight-stock/movementMeta";

const EFFECTS = [
  {
    Icon: Lock,
    tone: "bg-slate-100 text-slate-700",
    title: "يُحفظ ويُقفل",
    text: "كل عمليات وطلبات الموسم تبقى كما هي للقراءة فقط، مع ملخص محفوظ لأرقامه.",
  },
  {
    Icon: RotateCcw,
    tone: "bg-emerald-100 text-emerald-700",
    title: "يبدأ من صفر",
    text: "الدخل، المصروفات، الأرباح، عدد الطلبات وسجل العمليات في الحسابات والتقارير.",
  },
  {
    Icon: ArrowLeftRight,
    tone: "bg-amber-100 text-amber-700",
    title: "يُرحَّل كرصيد افتتاحي",
    text: "النقدية في وسائل الدفع، مديونيات العملاء، ومخزون الوزن والمنتجات.",
  },
];

export default function CloseSeasonModal({ open, setOpen, current, nextDefaultName, onClosed }) {
  const season = current?.season;
  const totals = current?.totals || {};
  const balances = current?.balances || {};
  const [nextName, setNextName] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNextName(nextDefaultName || "");
    setNotes("");
    setConfirmName("");
    setError("");
  }, [open, nextDefaultName]);

  if (!season) return null;

  const confirmed = confirmName.trim() === season.name.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!confirmed || isSaving) return;
    try {
      setIsSaving(true);
      setError("");
      const { data } = await axiosClient.post("/seasons/close", {
        confirmName,
        nextName,
        notes,
      });
      onClosed?.(data.data);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "فشل إقفال الموسم");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal bgWhite maxWidth="2xl" open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit} dir="rtl" className="space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 text-2xl">إقفال «{season.name}» وبدء موسم جديد</h2>
          <p className="mt-1 text-sm text-gray-500">لن يُحذف أي شيء. هذا ما سيحدث عند التأكيد:</p>
        </div>

        <ul className="space-y-2">
          {EFFECTS.map(({ Icon, tone, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <span className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${tone}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span>
                <span className="block font-bold text-sm text-slate-900">{title}</span>
                <span className="block text-xs text-slate-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
          <p className="text-slate-600">
            صافي ربح الموسم
            <b className="block text-base text-slate-900 tabular-nums">{formatMoney(totals.netProfit)}</b>
          </p>
          <p className="text-slate-600">
            الرصيد الافتتاحي للموسم الجديد
            <b className="block text-base text-slate-900 tabular-nums">{formatMoney(balances.systemBalance)}</b>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="next-season-name" className="block mb-1.5 font-medium text-gray-700 text-sm">
              اسم الموسم الجديد
            </label>
            <input
              id="next-season-name"
              type="text"
              value={nextName}
              onChange={(e) => setNextName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="season-notes" className="block mb-1.5 font-medium text-gray-700 text-sm">
              ملاحظات على الإقفال <span className="text-gray-400 font-normal">(اختياري)</span>
            </label>
            <input
              id="season-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="season-confirm" className="block mb-1.5 font-medium text-gray-700 text-sm">
            للتأكيد اكتب اسم الموسم الحالي: <b>{season.name}</b>
          </label>
          <input
            id="season-confirm"
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            autoComplete="off"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div dir="ltr" className="flex justify-between gap-4">
          <Button large onClick={() => setOpen(false)} label="رجوع" variant="outlined" rounded="xl" fixedPadding="3" color="info" />
          <Button
            large
            type="submit"
            label="إقفال الموسم"
            isLoading={isSaving}
            disabled={!confirmed || isSaving}
            variant="filled"
            rounded="xl"
            fixedPadding="3"
            color="danger"
          />
        </div>
      </form>
    </Modal>
  );
}
