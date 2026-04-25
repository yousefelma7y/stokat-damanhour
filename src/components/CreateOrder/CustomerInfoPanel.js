import React, { useRef, useState } from "react";
import { User, Phone, MapPin, Calendar, Loader } from "lucide-react";

const CustomerInfoPanel = ({
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerLocation,
    setCustomerLocation,
    loadingCustomer = false,
    onPhoneChange = null,
}) => {
    const [showLookupStatus, setShowLookupStatus] = useState(false);

    const handlePhoneChange = (e) => {
        const phone = e.target.value.replace(/[^0-9]/g, "");
        setCustomerPhone(phone);

        // Call parent's phone change handler if provided
        if (onPhoneChange) {
            setShowLookupStatus(true);
            onPhoneChange(phone);
        }
    };

    return (
        <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200 space-y-3">
            <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">بيانات العميل</h3>
            </div>

            {/* Phone Field with Lookup Status */}
            <div className="relative">
                <div className="flex items-center justify-between mb-1">
                    <Phone
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        size={16}
                    />
                    {loadingCustomer && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                            <Loader className="w-3 h-3 animate-spin" />
                            جاري البحث...
                        </span>
                    )}
                </div>
                <input
                    type="tel"
                    placeholder="* رقم الهاتف "
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    disabled={loadingCustomer}
                    className="w-full pr-10 pl-3 py-2 border-2 border-slate-300 !text-right rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                />
                {/* Lookup Status */}
                {showLookupStatus && customerPhone.length >= 10 && (
                    <div className="absolute bottom-[-20px] right-0 text-xs text-slate-500">
                        {loadingCustomer ? (
                            <span>🔍 جاري البحث عن العميل...</span>
                        ) : customerName ? (
                            <span className="text-green-600">✓ تم العثور على العميل</span>
                        ) : (
                            <span className="text-orange-600">⚠ عميل جديد</span>
                        )}
                    </div>
                )}
            </div>

            {/* Name Field */}
            <div className="relative mt-6">
                <User
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                />
                <input
                    type="text"
                    placeholder="اسم العميل *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {customerName && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-sm">
                        ✓
                    </span>
                )}
            </div>

            {/* Location Field */}
            <div className="relative">
                <MapPin
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                />
                <input
                    type="text"
                    placeholder="العنوان"
                    value={customerLocation}
                    onChange={(e) => setCustomerLocation(e.target.value)}
                    className="w-full pr-10 pl-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
            </div>

            {/* Status Summary */}
            {(customerName || customerPhone) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-xs space-y-1">
                    <div className="flex items-center gap-2 text-blue-700">
                        <span>{customerName ? "✓" : "○"}</span>
                        <span>
                            اسم العميل:{" "}
                            <span className="font-semibold">
                                {customerName || "مطلوب"}
                            </span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-700">
                        <span>{customerPhone ? "✓" : "○"}</span>
                        <span>
                            رقم الهاتف:{" "}
                            <span className="font-semibold">
                                {customerPhone || "مطلوب"}
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerInfoPanel;