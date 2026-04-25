import React from "react";
import { X } from "lucide-react";

const ExchangeModal = ({
    isOpen,
    onClose,
    selectedWasteProduct,
    replacementProduct,
    onConfirm,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">تأكيد الاستبدال</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="bg-red-50 rounded-lg p-3 border-2 border-red-200">
                        <p className="text-xs text-red-600 mb-1">المنتج التالف:</p>
                        <p className="font-bold text-slate-900">
                            {selectedWasteProduct?.name}
                        </p>
                        <p className="text-xs text-slate-600">
                            {selectedWasteProduct?.condition}
                        </p>
                    </div>

                    <div className="text-center text-slate-400">↓</div>

                    <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
                        <p className="text-xs text-green-600 mb-1">المنتج الجديد:</p>
                        <p className="font-bold text-slate-900">
                            {replacementProduct?.name}
                        </p>
                        <p className="text-lg font-bold text-green-600 mt-1">
                            بدون تكلفة إضافية
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 transition-all"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                    >
                        تأكيد
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExchangeModal;