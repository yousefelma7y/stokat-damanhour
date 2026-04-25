import React from "react";
import { Plus } from "lucide-react";

const ProductCard = ({
    product,
    onAdd,
    inCart = false,
    cartQuantity = 0,
    showScrap = false,
    orderType,
}) => {
    const stockCount = Number(product.stock || 0);
    const hasStock = stockCount > 0;
    const isAtStockLimit = hasStock && cartQuantity >= stockCount;
    const canAdd = hasStock && !isAtStockLimit;

    return (
        <div
            className={`p-4 rounded-lg border-2 transition-all ${hasStock
                ? "border-slate-200 hover:border-blue-300 bg-white"
                : "border-red-200 bg-red-50"
                }`}
        >
            <div className="space-y-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-semibold text-slate-900">{product.name}</h4>
                        <p className="text-xs text-slate-600">{product.color}</p>
                    </div>
                    {inCart && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                            في العربة
                        </span>
                    )}
                </div>
                <div className="flex gap-3 items-center">
                    <div>
                        <p className="text-xs text-slate-600">سعر البيع</p>
                        <p className="text-lg font-bold text-green-600">
                            {product.price} EGP
                        </p>
                    </div>
                </div>
            </div>

            {showScrap && (
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-dashed border-slate-200">
                    <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-green-50 text-green-700">
                        <span className="font-bold">المتاح:</span>
                        <span>{product.stock || 0}</span>
                    </div>
                    {/* <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-50 text-orange-700">
                        <span className="font-bold">تالف:</span>
                        <span>{product.scrap || 0}</span>
                    </div> */}
                </div>
            )}
            <div className="flex items-center justify-between pt-2 ">

                <button
                    disabled={!canAdd}
                    onClick={() => onAdd(product)}
                    className={`px-4 w-full py-2 rounded-lg text-sm font-semibold transition-all ${canAdd
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        } ${canAdd ? "cursor-pointer" : ""}`}
                >
                    <Plus className="w-4 h-4 inline mr-1" />
                    {showScrap ? "استبدال" : "إضافة"}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
