"use client";
import React, { useEffect, useState } from "react";
import { Clock, RefreshCw, ChevronRight, ShoppingCart } from "lucide-react";
import axiosClient from "../../lib/axios-client";

const PendingOrdersSidebar = ({ onResume, isPendingOrdersLoading, pendingOrders, fetchPendingOrders }) => {



    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-full flex flex-col" dir="rtl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-orange-600">
                    <Clock size={20} />
                    <h3 className="font-bold text-lg">طلبات معلقة</h3>
                </div>
                <button
                    onClick={fetchPendingOrders}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                    title="تحديث"
                >
                    <RefreshCw size={18} className={isPendingOrdersLoading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                {pendingOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <ShoppingCart size={40} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">لا توجد طلبات معلقة</p>
                    </div>
                ) : (
                    pendingOrders.map((order) => (
                        <div
                            key={order._id}
                            className="group border border-gray-100 rounded-xl p-3 hover:border-orange-200 hover:bg-orange-50 transition-all cursor-pointer relative"
                            onClick={() => onResume(order)}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-gray-400">#{order._id}</span>
                                <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                    معلق
                                </span>
                            </div>

                            <div className="font-bold text-gray-800 text-sm truncate mb-1">
                                {order.customer?.name || "عميل نقدي"}
                            </div>

                            <div className="flex justify-between items-end">
                                <div className="text-xs text-gray-500">
                                    {(order.items?.length || 0) + (order.weightItems?.length || 0)} عنصر
                                </div>
                                <div className="font-black text-sm text-gray-900">
                                    {(order.total || 0).toFixed(2)} EGP
                                </div>
                            </div>

                            <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={18} className="text-orange-400" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PendingOrdersSidebar;
