import { Crown, HandCoins, ShoppingBag, Sparkles, Wallet } from "lucide-react";

const money = (value) =>
  `${Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
const count = (value) => Number(value || 0).toLocaleString("ar-EG");

/**
 * Shown on the create-order screen when the entered phone belongs to one of
 * the top 10 customers, so the cashier knows to give them special care.
 */
export default function VipCustomerAlert({ customer, showMoney = false }) {
  if (!customer?.topRank) return null;
  const debt = Number(customer.debtBalance || 0);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-l from-amber-100 via-amber-50 to-white p-4 shadow-md shadow-amber-100 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <Sparkles className="absolute -left-2 -top-2 w-16 h-16 text-amber-200/70" aria-hidden="true" />

      <div className="relative flex items-center gap-3">
        <span className="relative flex shrink-0">
          <span className="absolute inset-0 rounded-full bg-amber-400/50 motion-safe:animate-ping" aria-hidden="true" />
          <span className="relative flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow">
            <Crown className="w-6 h-6" />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-black text-amber-950">
            عميل مميز
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-black text-white">
              المركز {count(customer.topRank)} من أفضل 10
            </span>
          </p>
          <p className="text-sm text-amber-900">
            <b>{customer.name}</b> من أهم عملائنا — يستحق عناية وخدمة خاصة.
          </p>
        </div>
      </div>

      <div className="relative mt-3 flex flex-wrap gap-2 text-xs font-bold">
        <span className="flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1.5 text-slate-700 ring-1 ring-amber-200">
          <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
          {count(customer.ordersCount)} طلب سابق
        </span>
        {showMoney && (
          <span className="flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1.5 text-slate-700 ring-1 ring-amber-200">
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            مدفوعاته {money(customer.totalPayments)}
          </span>
        )}
        {debt > 0.01 && (
          <span className="flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1.5 text-rose-700 ring-1 ring-rose-200">
            <HandCoins className="w-3.5 h-3.5" />
            عليه مديونية {money(debt)}
          </span>
        )}
      </div>
    </div>
  );
}
