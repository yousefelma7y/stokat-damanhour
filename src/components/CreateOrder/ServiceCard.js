import React from "react";
import { Clock } from "lucide-react";

const ServiceCard = ({ service, onAdd, inCart = false }) => (
  <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:border-blue-400 transition-all">
    <div className="space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-slate-900">{service.name}</h4>
          <p className="text-xs text-slate-600">{service.description}</p>
        </div>
        {inCart && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            مختار
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-blue-300">
        <div className="flex-1">
          <p className="text-xs text-slate-600">السعر</p>
          <p className="text-lg font-bold text-blue-600">{service.price} EGP</p>
        </div>

      </div>
      <div className="w-full">
        <button
          onClick={() => onAdd(service)}
          disabled={inCart}
          className={`px-4 py-2 w-full rounded-lg text-sm font-semibold transition-all ${inCart
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {inCart ? "تم الاختيار" : "اختر"}
        </button>
      </div>
    </div>
  </div>
);

export default ServiceCard;