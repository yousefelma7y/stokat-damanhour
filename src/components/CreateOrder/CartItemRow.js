import React from "react";
import { RotateCcw } from "lucide-react";

const WasteProductCard = ({ product, onExchange }) => (
    <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50 hover:border-orange-400 transition-all">
        <div className="space-y-2">
            <div>
                <h4 className="font-semibold text-slate-900">{product?.name}</h4>
                <p className="text-xs text-slate-600">{product?.color}</p>
            </div>

            <div className="bg-white rounded p-2 text-xs">
                <p className="text-slate-600">الحالة:</p>
                <p className="font-semibold text-red-600">{product?.condition}</p>
            </div>

            <button
                onClick={() => onExchange(product)}
                className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
            >
                <RotateCcw className="w-4 h-4" />
                استبدال
            </button>
        </div>
    </div>
);

export default WasteProductCard;