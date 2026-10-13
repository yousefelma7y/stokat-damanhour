import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardCheck,
  RotateCcw,
  ShoppingBag,
  Truck,
  Undo2,
} from "lucide-react";

export const MOVEMENT_META = {
  add: {
    label: "وارد للمخزن",
    Icon: ArrowDownToLine,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  deduct: {
    label: "خصم يدوي",
    Icon: ArrowUpFromLine,
    tone: "bg-rose-50 text-rose-700 ring-rose-200",
  },
  adjust: {
    label: "ضبط الرصيد (جرد)",
    Icon: ClipboardCheck,
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  sale: {
    label: "بيع",
    Icon: ShoppingBag,
    tone: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  sale_return: {
    label: "إرجاع من طلب",
    Icon: Undo2,
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  transfer: {
    label: "نقل لمحل",
    Icon: Truck,
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
  },
  transfer_cancel: {
    label: "إلغاء نقل",
    Icon: RotateCcw,
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
};

export const MOVEMENT_FILTERS = [
  { _id: "sale", name: "المبيعات" },
  { _id: "transfer", name: "النقل للمحلات" },
  { _id: "add", name: "الوارد" },
  { _id: "deduct", name: "الخصم اليدوي" },
  { _id: "adjust", name: "ضبط الرصيد" },
];

export const roundKg = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 1000) / 1000;

export const formatKg = (value, { withUnit = true } = {}) => {
  const formatted = roundKg(value).toLocaleString("ar-EG", {
    maximumFractionDigits: 3,
  });
  return withUnit ? `${formatted} كجم` : formatted;
};

export const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("ar-EG", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

/** Signed weight for display, e.g. "+12.5" / "-3". */
export const signedKg = (movement) =>
  `${movement.direction === "in" ? "+" : "−"}${formatKg(movement.weight)}`;
