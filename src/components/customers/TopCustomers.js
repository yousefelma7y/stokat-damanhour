"use client";

import Link from "next/link";
import { Crown, MapPin, Phone, ShoppingBag } from "lucide-react";
import { Skeleton } from "../Skeleton";

const money = (value) =>
  `${Number(value || 0).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;
const count = (value) => Number(value || 0).toLocaleString("ar-EG");

// Gold / silver / bronze for the podium.
const PODIUM = {
  1: {
    label: "المركز الأول",
    card: "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 shadow-amber-100",
    medal: "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950",
    bar: "bg-amber-400",
  },
  2: {
    label: "المركز الثاني",
    card: "border-slate-300 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-slate-100",
    medal: "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900",
    bar: "bg-slate-400",
  },
  3: {
    label: "المركز الثالث",
    card: "border-orange-300 bg-gradient-to-br from-orange-50 via-white to-orange-100/60 shadow-orange-100",
    medal: "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950",
    bar: "bg-orange-400",
  },
};

/** Small crown chip used next to a top customer's name (table rows, search results). */
export function TopRankBadge({ rank, className = "" }) {
  if (!rank) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-300 whitespace-nowrap ${className}`}
      title={`من أفضل 10 عملاء — المركز ${rank}`}
    >
      <Crown className="w-3 h-3" />
      أفضل {count(rank)}
    </span>
  );
}

// A card is a link only for roles that can open the customer page.
function CardShell({ href, className, children, label }) {
  if (!href) return <div className={className}>{children}</div>;
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${className} transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-amber-500`}
    >
      {children}
    </Link>
  );
}

function PodiumCard({ customer, share, showMoney, href }) {
  const style = PODIUM[customer.rank];
  return (
    <CardShell
      href={href}
      label={`${style.label}: ${customer.name}`}
      className={`relative block rounded-2xl border p-4 shadow-md ${style.card}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex flex-col items-center justify-center size-12 rounded-full shadow shrink-0 ${style.medal}`}
          aria-hidden="true"
        >
          {customer.rank === 1 ? (
            <Crown className="w-5 h-5" />
          ) : (
            <span className="font-black text-lg leading-none">{count(customer.rank)}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-500">{style.label}</p>
          <p className="font-bold text-slate-900 truncate">{customer.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500" dir="ltr">
            <Phone className="w-3 h-3" />
            {customer.phone}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        {showMoney ? (
          <p>
            <span className="block text-[11px] text-slate-500">إجمالي المدفوعات</span>
            <span className="block font-black text-xl text-slate-900 tabular-nums">
              {money(customer.totalPayments)}
            </span>
          </p>
        ) : (
          <span />
        )}
        <p className="flex items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
          <ShoppingBag className="w-3.5 h-3.5" />
          {count(customer.ordersCount)} طلب
        </p>
      </div>

      {showMoney && (
        <div className="mt-3 h-1.5 rounded-full bg-slate-200/70 overflow-hidden" aria-hidden="true">
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${share}%` }} />
        </div>
      )}
      {customer.location && (
        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          {customer.location}
        </p>
      )}
    </CardShell>
  );
}

function RankRow({ customer, share, showMoney, href }) {
  return (
    <CardShell
      href={href}
      label={`المركز ${customer.rank}: ${customer.name}`}
      className="relative flex items-center gap-3 rounded-xl border border-amber-100 bg-white px-3 py-2.5 overflow-hidden"
    >
      {showMoney && (
        <span
          className="absolute inset-y-0 right-0 bg-amber-50"
          style={{ width: `${share}%` }}
          aria-hidden="true"
        />
      )}
      <span className="relative flex items-center justify-center size-8 rounded-full bg-amber-100 font-black text-sm text-amber-800 shrink-0">
        {count(customer.rank)}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-bold text-sm text-slate-900 truncate">{customer.name}</span>
        <span className="block text-[11px] text-slate-500">
          <span dir="ltr">{customer.phone}</span> · {count(customer.ordersCount)} طلب
        </span>
      </span>
      {showMoney && (
        <span className="relative font-bold text-sm text-slate-900 tabular-nums whitespace-nowrap">
          {money(customer.totalPayments)}
        </span>
      )}
    </CardShell>
  );
}

function TopCustomersSkeleton() {
  return (
    <div role="status" aria-label="جاري تحميل أفضل العملاء" className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-[52px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Top paying customers, shown above the customers table.
 * showMoney: amounts are for admins only. canOpen: link cards to the customer page.
 */
export default function TopCustomers({ customers = [], isLoading = false, showMoney = false, canOpen = false }) {
  if (!isLoading && customers.length === 0) return null;

  const best = Number(customers[0]?.totalPayments || 0) || 1;
  const share = (customer) => Math.max(4, Math.round((Number(customer.totalPayments || 0) / best) * 100));
  const hrefFor = (customer) => (canOpen ? `/dashboard/customers/${customer._id}` : null);
  const podium = customers.filter((customer) => customer.rank <= 3);
  const others = customers.filter((customer) => customer.rank > 3);

  return (
    <section
      aria-labelledby="top-customers-title"
      className="mx-2 sm:mx-4 mb-6 rounded-3xl border border-amber-200 bg-gradient-to-b from-amber-50/70 to-white p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow">
          <Crown className="w-5 h-5" />
        </span>
        <div>
          <h2 id="top-customers-title" className="font-bold text-slate-900 text-lg">
            أفضل {count(isLoading ? 10 : customers.length)} عملاء
          </h2>
          <p className="text-xs text-slate-500">الأعلى في إجمالي المدفوعات — عملاء يستحقون عناية خاصة</p>
        </div>
      </div>

      {isLoading ? (
        <TopCustomersSkeleton />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {podium.map((customer) => (
              <PodiumCard
                key={customer._id}
                customer={customer}
                share={share(customer)}
                showMoney={showMoney}
                href={hrefFor(customer)}
              />
            ))}
          </div>
          {others.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
              {others.map((customer) => (
                <RankRow
                  key={customer._id}
                  customer={customer}
                  share={share(customer)}
                  showMoney={showMoney}
                  href={hrefFor(customer)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
