import React from "react";
import { AlertCircle } from "lucide-react";

const ValidationAlert = ({ customerName, customerPhone, cart }) => {
    if (cart.length === 0) return null;
    if (customerName.trim() !== "" && customerPhone.trim() !== "") return null;

    return (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-700 flex gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
                {customerName.trim() === "" && (
                    <p>• من فضلك أدخل اسم العميل</p>
                )}
                {customerPhone.trim() === "" && (
                    <p>• من فضلك أدخل رقم الهاتف</p>
                )}
            </div>
        </div>
    );
};

export default ValidationAlert;