"use client";
import { useEffect, useState, useMemo } from "react";
import {
    Banknote,
    CreditCard,
    Wallet,
    LayoutGrid,
    Plus,
    Trash2,
    Split,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";
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
 * Payment Split Select — allows splitting order payments across multiple wallets.
 *
 * @param {Array}    payments      – [{paymentMethodId, name, amount}]
 * @param {Function} setPayments   – state setter
 * @param {number}   totalAmount   – order total to distribute
 * @param {string}   label         – heading label
 * @param {string}   className     – wrapper class
 */
const PaymentSplitSelect = ({
    payments = [],
    setPayments,
    totalAmount = 0,
    label = "وسيلة الدفع",
    className = "",
    onValidationChange,
}) => {
    const [methods, setMethods] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSplitMode, setIsSplitMode] = useState(false);

    const showBalance = Cookies.get("role") !== "cashier";

    // Fetch payment methods once
    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const { data } = await axiosClient.get("/payment-methods");
                setMethods(data.data || []);
            } catch (error) {
                console.error("Error fetching payment methods:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMethods();
    }, []);

    // Auto-select first method with full amount when methods load
    useEffect(() => {
        if (methods.length > 0 && payments.length === 0 && totalAmount > 0) {
            const first = methods[0];
            setPayments([
                {
                    paymentMethodId: first._id,
                    name: first.name,
                    amount: totalAmount,
                },
            ]);
        }
    }, [methods]);

    // When totalAmount changes and we have a single payment, auto-update its amount
    useEffect(() => {
        if (payments.length === 1 && !isSplitMode && totalAmount > 0) {
            const updated = [{ ...payments[0], amount: totalAmount }];
            setPayments(updated);
        }
    }, [totalAmount]);

    // Detect split mode from existing payments
    useEffect(() => {
        if (payments.length > 1) {
            setIsSplitMode(true);
        }
    }, [payments.length]);

    const paidTotal = useMemo(
        () => payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        [payments]
    );

    const remaining = totalAmount - paidTotal;
    const isBalanced = Math.abs(remaining) < 0.01;
    const isOverpaid = remaining < -0.01;

    // Notify parent about validation state
    useEffect(() => {
        if (onValidationChange) {
            onValidationChange({ isBalanced, isOverpaid, remaining, paidTotal });
        }
    }, [isBalanced, isOverpaid, remaining, paidTotal]);

    // ─── Single mode: Select one wallet for the full amount ───
    const handleSelectSingle = (method) => {
        setPayments([
            {
                paymentMethodId: method._id,
                name: method.name,
                amount: totalAmount,
            },
        ]);
    };

    // ─── Split mode helpers ───
    const handleEnableSplit = () => {
        setIsSplitMode(true);
        // Keep current selection as first split item
        if (payments.length === 1) {
            // keep as is — user can now modify amounts and add more
        }
    };

    const handleDisableSplit = () => {
        setIsSplitMode(false);
        // Collapse to first payment with full amount
        if (payments.length > 0) {
            setPayments([{ ...payments[0], amount: totalAmount }]);
        }
    };

    const handleSplitAmountChange = (index, newAmount) => {
        const numValue = parseFloat(newAmount);
        // Prevent negative values
        if (numValue < 0) return;
        const updated = [...payments];
        updated[index] = { ...updated[index], amount: numValue || 0 };
        setPayments(updated);
    };

    // Clamp individual amounts: if total exceeds totalAmount, auto-adjust on blur
    const handleSplitAmountBlur = (index) => {
        const updated = [...payments];
        const currentVal = parseFloat(updated[index].amount) || 0;
        // Clamp negative to 0
        if (currentVal < 0) {
            updated[index] = { ...updated[index], amount: 0 };
            setPayments(updated);
            return;
        }
        // Calculate sum of other payments
        const othersSum = updated.reduce((sum, p, i) => i !== index ? sum + (parseFloat(p.amount) || 0) : sum, 0);
        const maxAllowed = Math.max(0, totalAmount - othersSum);
        if (currentVal > maxAllowed) {
            updated[index] = { ...updated[index], amount: parseFloat(maxAllowed.toFixed(2)) };
            setPayments(updated);
        }
    };

    const handleAddSplit = () => {
        // Find first method not already used
        const usedIds = payments.map((p) => p.paymentMethodId);
        const available = methods.find((m) => !usedIds.includes(m._id));
        if (!available) return;

        setPayments([
            ...payments,
            {
                paymentMethodId: available._id,
                name: available.name,
                amount: remaining > 0 ? remaining : 0,
            },
        ]);
    };

    const handleRemoveSplit = (index) => {
        if (payments.length <= 1) return;
        const updated = payments.filter((_, i) => i !== index);
        // If only one left, give it the full amount
        if (updated.length === 1) {
            updated[0] = { ...updated[0], amount: totalAmount };
            setIsSplitMode(false);
        }
        setPayments(updated);
    };

    const handleChangeSplitMethod = (index, methodId) => {
        const method = methods.find((m) => m._id === parseInt(methodId));
        if (!method) return;
        const updated = [...payments];
        updated[index] = {
            ...updated[index],
            paymentMethodId: method._id,
            name: method.name,
        };
        setPayments(updated);
    };

    // Available methods for a specific split row (exclude already-used ones except current)
    const getAvailableFor = (index) => {
        const usedIds = payments
            .filter((_, i) => i !== index)
            .map((p) => p.paymentMethodId);
        return methods.filter((m) => !usedIds.includes(m._id));
    };

    // ─── Loading skeleton ───
    if (isLoading) {
        return (
            <div className={className}>
                <div className="bg-slate-100 rounded-lg h-10 animate-pulse" />
            </div>
        );
    }

    // ─── Render ───
    return (
        <div className={`space-y-3 ${className}`}>
            {label && (
                <label className="block mb-1 font-bold text-slate-700 text-sm">
                    {label}
                </label>
            )}

            {/* Single mode — wallet grid selector */}
            {!isSplitMode ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {methods.map((method) => {
                            const isSelected = payments[0]?.paymentMethodId === method._id;
                            return (
                                <button
                                    key={method._id}
                                    type="button"
                                    onClick={() => handleSelectSingle(method)}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all cursor-pointer text-right ${isSelected
                                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm ring-2 ring-indigo-200"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                                        }`}
                                >
                                    <div
                                        className={`p-1.5 rounded-md ${isSelected ? "bg-indigo-100" : "bg-slate-100"
                                            }`}
                                    >
                                        {getMethodIcon(method.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-xs truncate">
                                            {method.name}
                                        </p>
                                        {showBalance && (
                                            <p
                                                className={`text-[10px] font-medium ${isSelected ? "text-indigo-500" : "text-slate-400"
                                                    }`}
                                            >
                                                {Number(method.balance).toLocaleString()} ج.م
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Split toggle */}
                    {methods.length > 1 && totalAmount > 0 && (
                        <button
                            type="button"
                            onClick={handleEnableSplit}
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border-2 border-dashed border-indigo-300 text-indigo-600 text-xs font-bold hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer"
                        >
                            <Split size={14} />
                            تقسيم الدفع على أكثر من وسيلة
                        </button>
                    )}
                </>
            ) : (
                /* ─── Split mode ─── */
                <div className="space-y-2">
                    {/* Split rows */}
                    {payments.map((payment, index) => {
                        const available = getAvailableFor(index);
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-xl p-2.5 transition-all hover:border-indigo-200"
                            >
                                {/* Method picker */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="bg-indigo-50 p-1.5 rounded-lg shrink-0">
                                        {getMethodIcon(
                                            methods.find((m) => m._id === payment.paymentMethodId)
                                                ?.type
                                        )}
                                    </div>
                                    <select
                                        value={payment.paymentMethodId}
                                        onChange={(e) =>
                                            handleChangeSplitMethod(index, e.target.value)
                                        }
                                        className="flex-1 min-w-0 py-1.5 px-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
                                    >
                                        {available.map((m) => (
                                            <option key={m._id} value={m._id}>
                                                {m.name}
                                                {showBalance
                                                    ? ` (${Number(m.balance).toLocaleString()} ج.م)`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount input */}
                                <div className="relative w-28 shrink-0">
                                    <input
                                        type="number"
                                        value={payment.amount || ""}
                                        onChange={(e) =>
                                            handleSplitAmountChange(index, e.target.value)
                                        }
                                        onBlur={() => handleSplitAmountBlur(index)}
                                        placeholder="المبلغ"
                                        min="0"
                                        max={totalAmount}
                                        step="0.01"
                                        className={`w-full py-1.5 px-2 pr-8 border rounded-lg text-xs font-bold text-right focus:outline-none focus:ring-2 transition-colors ${(parseFloat(payment.amount) || 0) > totalAmount || (parseFloat(payment.amount) || 0) < 0
                                                ? 'border-red-400 focus:ring-red-300 bg-red-50'
                                                : 'border-slate-200 focus:ring-indigo-500'
                                            }`}
                                    />
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">
                                        ج.م
                                    </span>
                                </div>

                                {/* Remove button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSplit(index)}
                                    disabled={payments.length <= 1}
                                    className={`p-1.5 rounded-lg transition-all shrink-0 ${payments.length <= 1
                                        ? "text-slate-300 cursor-not-allowed"
                                        : "text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                        }`}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        );
                    })}

                    {/* Add another split */}
                    {payments.length < methods.length && (
                        <button
                            type="button"
                            onClick={handleAddSplit}
                            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                        >
                            <Plus size={14} />
                            إضافة وسيلة دفع أخرى
                        </button>
                    )}

                    {/* Summary bar */}
                    {totalAmount > 0 && (
                        <div
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isBalanced
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                : remaining > 0
                                    ? "bg-amber-50 border border-amber-200 text-amber-700"
                                    : "bg-red-50 border border-red-200 text-red-700"
                                }`}
                        >
                            <div className="flex items-center gap-1.5">
                                {isBalanced ? (
                                    <CheckCircle2 size={14} />
                                ) : (
                                    <AlertTriangle size={14} />
                                )}
                                <span>
                                    {isBalanced
                                        ? "المبلغ مطابق ✓"
                                        : remaining > 0
                                            ? `متبقي: ${remaining.toLocaleString()} ج.م`
                                            : `زيادة: ${Math.abs(remaining).toLocaleString()} ج.م`}
                                </span>
                            </div>
                            <span className="text-slate-500 font-medium">
                                الإجمالي: {totalAmount.toLocaleString()} ج.م
                            </span>
                        </div>
                    )}

                    {/* Back to single mode */}
                    <button
                        type="button"
                        onClick={handleDisableSplit}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer transition-colors"
                    >
                        ← العودة لوسيلة دفع واحدة
                    </button>
                </div>
            )}

            {methods.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    لا توجد وسائل دفع. أضف وسيلة دفع من الإعدادات.
                </p>
            )}
        </div>
    );
};

export default PaymentSplitSelect;
