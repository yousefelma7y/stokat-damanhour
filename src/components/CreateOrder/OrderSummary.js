import React from "react";
import { Receipt } from "lucide-react";

const OrderSummary = ({
    cart,
    discount,
    shipping,
    onDiscount,
    onShipping,
    cartTotal,
    orderType,
}) => {
    const subtotal = cartTotal;
    const discountAmount = discount ? (subtotal * discount) / 100 : 0;
    const finalTotal = subtotal - discountAmount + shipping;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                ملخص الطلب
            </h3>

            <div className="space-y-2 pb-4 border-b border-slate-700">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">عدد العناصر</span>
                    <span className="font-semibold">{cart.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">نوع الطلب</span>
                    <span className="font-semibold capitalize">{orderType}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                    <span>المجموع الفرعي</span>
                    <span>{subtotal} EGP</span>
                </div>
            </div>

            {discount > 0 && (
                <div className="flex justify-between text-sm text-yellow-300">
                    <span>الخصم ({discount}%)</span>
                    <span>-{discountAmount.toFixed(2)} EGP</span>
                </div>
            )}

            {shipping > 0 && (
                <div className="flex justify-between text-sm text-orange-300">
                    <span>التوصيل</span>
                    <span>+{shipping} EGP</span>
                </div>
            )}

            {(discount > 0 || shipping > 0) && (
                <div className="bg-slate-700 rounded-lg p-3">
                    <div className="flex justify-between text-lg font-bold text-green-400">
                        <span>الإجمالي النهائي</span>
                        <span>{finalTotal.toFixed(2)} EGP</span>
                    </div>
                </div>
            )}

            {discount === 0 && shipping === 0 && (
                <div className="bg-slate-700 rounded-lg p-3">
                    <div className="flex justify-between text-lg font-bold text-green-400">
                        <span>الإجمالي</span>
                        <span>{finalTotal.toFixed(2)} EGP</span>
                    </div>
                </div>
            )}

            <div className="space-y-2 pt-4 border-t border-slate-700">
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-slate-400 block mb-1">خصم %</label>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) =>
                                onDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            max="100"
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                            placeholder="0"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-slate-400 block mb-1">
                            توصيل EGP
                        </label>
                        <input
                            type="number"
                            value={shipping}
                            onChange={(e) =>
                                onShipping(Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSummary;