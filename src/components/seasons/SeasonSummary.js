import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Package,
  Receipt,
  Scale,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatKg, formatMoney } from "../weight-stock/movementMeta";

const num = (value) => Number(value || 0).toLocaleString("ar-EG");

function Figure({ icon: Icon, label, value, hint, tone = "text-slate-500" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className={`w-3.5 h-3.5 ${tone}`} />
        {label}
      </p>
      <p className="mt-1 font-bold text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

/** Season activity: these numbers restart from zero in the next season. */
export function SeasonTotals({ totals = {} }) {
  const profit = Number(totals.netProfit || 0);
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <Figure icon={ArrowDownLeft} tone="text-emerald-600" label="إجمالي الدخل" value={formatMoney(totals.totalIncome)} />
      <Figure icon={ArrowUpRight} tone="text-rose-600" label="إجمالي المصروفات" value={formatMoney(totals.totalExpenses)} />
      <Figure
        icon={TrendingUp}
        tone={profit >= 0 ? "text-emerald-600" : "text-rose-600"}
        label="صافي الربح"
        value={<span className={profit >= 0 ? "text-emerald-700" : "text-rose-700"}>{formatMoney(profit)}</span>}
      />
      <Figure
        icon={ShoppingCart}
        tone="text-blue-600"
        label="الطلبات"
        value={num(totals.ordersCount)}
        hint={`${num(totals.completedOrders)} مكتمل · ${formatMoney(totals.ordersValue)}`}
      />
      <Figure icon={Receipt} tone="text-indigo-600" label="العمليات المالية" value={num(totals.transactionsCount)} />
      <Figure
        icon={Scale}
        tone="text-violet-600"
        label="المباع بالوزن"
        value={formatKg(totals.weightSoldKg)}
        hint={totals.weightTransferredKg ? `منقول ${formatKg(totals.weightTransferredKg)}` : undefined}
      />
    </div>
  );
}

/** Balances of things that still exist: these carry over to the next season. */
export function SeasonBalances({ balances = {}, showWallets = true }) {
  const wallets = balances.wallets || [];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Figure
          icon={Wallet}
          tone="text-emerald-600"
          label="النقدية في وسائل الدفع"
          value={formatMoney(balances.walletsTotal)}
          hint={`رصيد الخزينة ${formatMoney(balances.systemBalance)}`}
        />
        <Figure
          icon={HandCoins}
          tone="text-amber-600"
          label="مديونيات العملاء"
          value={formatMoney(balances.customerDebt)}
          hint={`${num(balances.customersWithDebt)} عميل`}
        />
        <Figure icon={Scale} tone="text-violet-600" label="مخزن الوزن" value={formatKg(balances.weightStockKg)} />
        <Figure
          icon={Package}
          tone="text-blue-600"
          label="مخزون المنتجات"
          value={formatMoney(balances.productsStockValue)}
          hint={`${num(balances.productsStockQty)} قطعة · ${num(balances.productsCount)} صنف`}
        />
      </div>
      {showWallets && wallets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {wallets.map((wallet) => (
            <span
              key={wallet.paymentMethodId}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700"
            >
              {wallet.name}: <b className="tabular-nums">{formatMoney(wallet.balance)}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
