import React from "react";
import { Plus } from "lucide-react";

const ScrapProductCard = ({ product, onAdd, inCart = false }) => {
    return (
        <div
            className={`p-4 rounded-lg border-2 transition-all border-orange-200 hover:border-orange-400 bg-orange-50`}
        >
            <div className="space-y-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-slate-900">{product?.name}</h4>
                        <p className="text-xs text-slate-600">{product?.size}</p>
                        <span className="inline-block mt-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            منتج تالف
                        </span>
                    </div>
                    {inCart && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                            محدد
                        </span>
                    )}
                </div>

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                <button
                    // disabled={!hasScrap}
                    onClick={() => onAdd(product, 'scrap')}
                    className={`px-4 w-full py-2 rounded-lg text-sm font-semibold transition-all bg-orange-600 text-white hover:bg-orange-700 cursor-pointer`}
                >
                    <Plus className="w-4 h-4 inline mr-1" />
                    اختر للاستبدال
                </button>
            </div>
        </div>
    );
};

export default ScrapProductCard;