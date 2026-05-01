"use client";
import { useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Wallet, LayoutGrid, ChevronDown, CheckCircle2 } from "lucide-react";
import axiosClient from "@/lib/axios-client";
import Cookies from "js-cookie";

const getMethodIcon = (type) => {
  switch (type) {
    case "cash":
      return <Banknote className="w-4 h-4" />;
    case "bank":
      return <CreditCard className="w-4 h-4" />;
    case "wallet":
      return <Wallet className="w-4 h-4" />;
    default:
      return <LayoutGrid className="w-4 h-4" />;
  }
};

const METHOD_TYPE_ORDER = {
  cash: 1,
  bank: 2,
  wallet: 3,
  other: 4,
};

const sortPaymentMethods = (methods) =>
  [...methods].sort((a, b) => {
    const typeDiff =
      (METHOD_TYPE_ORDER[a.type] || 99) - (METHOD_TYPE_ORDER[b.type] || 99);
    if (typeDiff !== 0) return typeDiff;
    return String(a.name || "").localeCompare(String(b.name || ""), "ar");
  });

const getDefaultMethod = (methods) =>
  methods.find((method) => method.type === "cash" || method.name === "كاش") ||
  methods[0] ||
  null;

/**
 * Reusable Payment Method Selector Component
 * @param {Object} props
 * @param {number|null} props.value - Selected payment method ID
 * @param {function} props.onChange - Callback with (paymentMethodId, paymentMethod)
 * @param {string} props.label - Label text (default: "وسيلة الدفع")
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.showBalance - Whether to show balance
 * @param {string} props.className - Additional wrapper classes
 * @param {boolean} props.compact - Compact mode (inline)
 * @param {number|null} props.excludeId - ID to exclude from the list (for transfer)
 */
const PaymentMethodSelect = ({
  value = null,
  onChange,
  label = "وسيلة الدفع",
  required = false,

  className = "",
  compact = false,
  excludeId = null,
}) => {
  const [methods, setMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showBalance = Cookies.get("role") != "cashier" ? true : false;

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const { data } = await axiosClient.get("/payment-methods");
        const fetchedMethods = sortPaymentMethods(data.data || []);
        setMethods(fetchedMethods);
        // Auto-select cash method first, otherwise fallback to first method
        const availableMethods = excludeId
          ? fetchedMethods.filter((method) => method._id !== excludeId)
          : fetchedMethods;
        if (!value && availableMethods.length > 0) {
          const defaultMethod = getDefaultMethod(availableMethods);
          onChange?.(defaultMethod._id, defaultMethod);
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMethods();
  }, []);

  const filteredMethods = useMemo(
    () => (excludeId ? methods.filter((m) => m._id !== excludeId) : methods),
    [excludeId, methods],
  );

  useEffect(() => {
    if (isLoading || methods.length === 0) return;

    const selectedIsExcluded = excludeId && value === excludeId;
    const selectedStillAvailable = filteredMethods.some(
      (method) => method._id === value,
    );

    if (!value || selectedIsExcluded || !selectedStillAvailable) {
      const defaultMethod = getDefaultMethod(filteredMethods);
      if (defaultMethod && defaultMethod._id !== value) {
        onChange?.(defaultMethod._id, defaultMethod);
      } else if (!defaultMethod && value) {
        onChange?.(null, null);
      }
    }
  }, [excludeId, filteredMethods, isLoading, methods.length, onChange, value]);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        {!compact && (
          <label className="block mb-1 font-medium text-slate-700 text-sm">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="bg-slate-100 rounded-lg h-10 animate-pulse" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
          {label}:
        </span>
        <div className="relative flex-1">
          <select
            value={value || ""}
            onChange={(e) => {
              const id = Number(e.target.value);
              const method = methods.find((m) => m._id === id);
              onChange?.(id, method);
            }}
            className="w-full py-1.5 px-2 pr-8 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
          >
            <option value="">اختر...</option>
            {filteredMethods.map((method) => (
              <option key={method._id} value={method._id}>
                {method.name}
                {showBalance ? ` (${Number(method.balance).toLocaleString()} ج.م)` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block mb-1.5 font-medium text-slate-700 text-sm">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={`grid grid-cols-2 gap-3 ${filteredMethods.length > 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
        {filteredMethods.map((method) => (
          <button
            key={method._id}
            type="button"
            onClick={() => onChange?.(method._id, method)}
            className={`group relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ease-in-out cursor-pointer text-right overflow-hidden ${
              value === method._id
                ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-4 ring-emerald-500/10 scale-[1.02]"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:bg-slate-50 text-slate-700 hover:-translate-y-0.5"
            }`}
          >
            {value === method._id && (
              <div className="absolute top-2 left-2 animate-in zoom-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
              </div>
            )}
            
            <div
              className={`p-2.5 rounded-lg transition-colors ${
                value === method._id
                  ? "bg-emerald-100 text-emerald-600 shadow-sm"
                  : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
              }`}
            >
              {getMethodIcon(method.type)}
            </div>
            
            <div className="flex-1 min-w-0 pr-1">
              <p className={`font-bold text-sm truncate transition-colors ${
                value === method._id ? "text-emerald-800" : "text-slate-800"
              }`}>
                {method.name}
              </p>
              {/* {showBalance && (
                <p className={`text-[11px] font-semibold mt-0.5 ${
                  value === method._id ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {Number(method.balance).toLocaleString()} ج.م
                </p>
              )} */}
            </div>
          </button>
        ))}
      </div>

      {filteredMethods.length === 0 && (
        <p className="text-center text-slate-400 text-xs py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          لا توجد وسائل دفع. أضف وسيلة دفع من الإعدادات.
        </p>
      )}
    </div>
  );
};

export default PaymentMethodSelect;
