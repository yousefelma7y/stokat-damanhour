"use client";
import { useEffect, useState } from "react";
import { Banknote, CreditCard, Wallet, LayoutGrid, ChevronDown } from "lucide-react";
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
        setMethods(data.data || []);
        // Auto-select first method if none selected
        if (!value && data.data?.length > 0) {
          const first = data.data[0];
          onChange?.(first._id, first);
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMethods();
  }, []);

  const filteredMethods = excludeId
    ? methods.filter((m) => m._id !== excludeId)
    : methods;

  const selectedMethod = methods.find((m) => m._id === value);

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredMethods.map((method) => (
          <button
            key={method._id}
            type="button"
            onClick={() => onChange?.(method._id, method)}
            className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all cursor-pointer text-right ${value === method._id
              ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-200"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
              }`}
          >
            <div
              className={`p-1.5 rounded-md ${value === method._id
                ? "bg-indigo-100"
                : "bg-slate-100"
                }`}
            >
              {getMethodIcon(method.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs truncate">{method.name}</p>
              {showBalance && (
                <p className={`text-[10px] font-medium ${value === method._id ? "text-indigo-500" : "text-slate-400"
                  }`}>
                  {Number(method.balance).toLocaleString()} ج.م
                </p>
              )}
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
