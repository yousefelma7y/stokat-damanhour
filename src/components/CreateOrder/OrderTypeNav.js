import React from "react";
import { Package, Scale } from "lucide-react";

const orderTypes = [
  {
    id: "purchase",
    label: "طلب منتجات",
    icon: Package,
    activeClasses: "border-blue-500 text-blue-600 bg-blue-50",
    idleClasses: "border-slate-200 text-slate-600 hover:border-blue-200",
  },
  {
    id: "weight",
    label: "الوزن",
    icon: Scale,
    activeClasses: "border-emerald-500 text-emerald-600 bg-emerald-50",
    idleClasses: "border-slate-200 text-slate-600 hover:border-emerald-200",
  },
];

const OrderTypeNav = ({ activeType, onTypeChange }) => {
  return (
    <div className="sticky top-0 z-20">
      <div className="mx-auto bg-white/90">
        <div className="flex items-center gap-2 p-2">
          {orderTypes.map((type) => {
            const Icon = type.icon;
            const isActive = activeType === type.id;

            return (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                className={`flex-1 px-4 py-4 cursor-pointer border-2 rounded-2xl transition-all flex items-center justify-center gap-2 font-semibold text-sm ${
                  isActive ? type.activeClasses : type.idleClasses
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTypeNav;
