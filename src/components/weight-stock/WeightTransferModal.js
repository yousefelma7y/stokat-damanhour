"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Store, Truck } from "lucide-react";
import Modal from "../Modal";
import Button from "../Button";
import PaymentMethodSelect from "../PaymentMethodSelect";
import axiosClient from "@/lib/axios-client";
import { formatKg, formatMoney, roundKg } from "./movementMeta";

const QUICK_WEIGHTS = [10, 25, 50, 100];

export default function WeightTransferModal({ open, setOpen, stock, onSaved, setMessage }) {
  const available = Number(stock?.currentWeight || 0);
  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopId, setShopId] = useState(null);
  const [isNewShop, setIsNewShop] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [isCollected, setIsCollected] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setWeight("");
    setPrice("");
    setNotes("");
    setIsCollected(false);
    setNewShopName("");
    setError("");

    const loadShops = async () => {
      try {
        setShopsLoading(true);
        const { data } = await axiosClient.get("/shops");
        const list = data.data || [];
        setShops(list);
        setShopId(list.length === 1 ? list[0]._id : null);
        setIsNewShop(list.length === 0);
      } catch {
        setShops([]);
        setIsNewShop(true);
      } finally {
        setShopsLoading(false);
      }
    };
    loadShops();
  }, [open]);

  const parsedWeight = Number(weight || 0);
  const parsedPrice = Number(price || 0);
  const remaining = roundKg(available - parsedWeight);
  const overStock = parsedWeight > available + 0.0005;
  const selectedShop = shops.find((shop) => shop._id === shopId);
  const destinationName = isNewShop ? newShopName.trim() : selectedShop?.name;
  const pricePerKg = parsedWeight > 0 && parsedPrice > 0 ? parsedPrice / parsedWeight : 0;

  const validationMessage = useMemo(() => {
    if (!destinationName) return "اختر المحل المنقول إليه";
    if (!(parsedWeight > 0)) return "أدخل الوزن المراد نقله";
    if (overStock) return `الوزن أكبر من المتاح (${formatKg(available)})`;
    if (parsedPrice < 0) return "السعر يجب أن يكون رقم موجب";
    if (isCollected && parsedPrice > 0 && !paymentMethodId) return "اختر وسيلة الدفع";
    return "";
  }, [available, destinationName, isCollected, overStock, parsedPrice, parsedWeight, paymentMethodId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const { data } = await axiosClient.post("/weight-stock/transfer", {
        shopId: isNewShop ? undefined : shopId,
        shopName: isNewShop ? newShopName.trim() : undefined,
        weight: parsedWeight,
        price: parsedPrice,
        isCollected: isCollected && parsedPrice > 0,
        paymentMethodId: isCollected ? paymentMethodId : undefined,
        notes,
      });
      setMessage?.({
        type: "success",
        message: `تم نقل ${formatKg(parsedWeight)} إلى ${destinationName}`,
      });
      onSaved?.(data.data);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "فشل نقل الوزن");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal bgWhite maxWidth="2xl" open={open} setOpen={setOpen}>
      <form onSubmit={handleSubmit} dir="rtl" className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center size-11 rounded-xl bg-violet-100 text-violet-700 shrink-0">
            <Truck className="w-5 h-5" />
          </span>
          <div>
            <h2 className="font-bold text-gray-900 text-2xl">نقل وزن لمحل آخر</h2>
            <p className="text-gray-500 text-sm mt-0.5">
              المتاح في المخزن <span className="font-bold text-gray-800">{formatKg(available)}</span>
            </p>
          </div>
        </div>

        {/* Destination */}
        <fieldset>
          <legend className="mb-2 font-medium text-gray-700 text-sm">المحل المنقول إليه</legend>
          {shopsLoading ? (
            <div className="h-11 rounded-xl bg-slate-100 animate-pulse" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {shops.map((shop) => {
                const active = !isNewShop && shopId === shop._id;
                return (
                  <button
                    key={shop._id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setShopId(shop._id);
                      setIsNewShop(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors cursor-pointer ${
                      active
                        ? "border-violet-500 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    {shop.name}
                  </button>
                );
              })}
              {shops.length > 0 && (
                <button
                  type="button"
                  aria-pressed={isNewShop}
                  onClick={() => {
                    setIsNewShop(true);
                    setShopId(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-bold transition-colors cursor-pointer ${
                    isNewShop
                      ? "border-violet-500 bg-violet-50 text-violet-800"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  محل جديد
                </button>
              )}
            </div>
          )}
          {isNewShop && !shopsLoading && (
            <input
              type="text"
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              placeholder="اسم المحل الجديد (سيتم حفظه للمرات القادمة)"
              aria-label="اسم المحل الجديد"
              className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}
        </fieldset>

        {/* Weight */}
        <div>
          <label htmlFor="transfer-weight" className="block mb-1.5 font-medium text-gray-700 text-sm">
            الوزن المنقول
          </label>
          <div className="relative">
            <input
              id="transfer-weight"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.001"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              className={`w-full pl-14 pr-4 py-3 border rounded-xl text-2xl font-bold tabular-nums outline-none focus:ring-2 ${
                overStock ? "border-rose-400 focus:ring-rose-400" : "border-gray-300 focus:ring-violet-500"
              }`}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">كجم</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_WEIGHTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setWeight(String(roundKg(parsedWeight + value)))}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold tabular-nums cursor-pointer"
              >
                +{value}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setWeight(String(roundKg(available)))}
              disabled={available <= 0}
              className="px-3 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              كل المتاح
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transfer-price" className="block mb-1.5 font-medium text-gray-700 text-sm">
              القيمة الإجمالية <span className="text-gray-400 font-normal">(اختياري)</span>
            </label>
            <div className="relative">
              <input
                id="transfer-price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl font-bold tabular-nums outline-none focus:ring-2 focus:ring-violet-500"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ج.م</span>
            </div>
            {pricePerKg > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                ≈ {formatMoney(pricePerKg)} للكيلو
              </p>
            )}
          </div>

          <div>
            <label htmlFor="transfer-notes" className="block mb-1.5 font-medium text-gray-700 text-sm">
              ملاحظات <span className="text-gray-400 font-normal">(اختياري)</span>
            </label>
            <input
              id="transfer-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اسم السائق، رقم البون ..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {parsedPrice > 0 && (
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span>
                <span className="block font-bold text-sm text-slate-800">تم استلام المبلغ الآن</span>
                <span className="block text-xs text-slate-500">
                  يُسجل كتحصيل في الحسابات ويُضاف لرصيد وسيلة الدفع
                </span>
              </span>
              <input
                type="checkbox"
                checked={isCollected}
                onChange={(e) => setIsCollected(e.target.checked)}
                className="size-5 accent-emerald-600 cursor-pointer"
              />
            </label>
            {isCollected && (
              <PaymentMethodSelect
                value={paymentMethodId}
                onChange={(id) => setPaymentMethodId(id)}
                label="وسيلة الدفع"
                required
              />
            )}
          </div>
        )}

        {/* Summary */}
        <div
          aria-live="polite"
          className={`rounded-xl px-4 py-3 text-sm ${overStock ? "bg-rose-50 text-rose-700" : "bg-violet-50 text-violet-900"}`}
        >
          {overStock ? (
            <span>الوزن المطلوب أكبر من المتاح في المخزن ({formatKg(available)})</span>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                نقل <b className="tabular-nums">{formatKg(parsedWeight)}</b> إلى{" "}
                <b>{destinationName || "—"}</b>
                {parsedPrice > 0 && (
                  <>
                    {" "}بقيمة <b>{formatMoney(parsedPrice)}</b>
                  </>
                )}
              </span>
              <span className="tabular-nums">
                المتبقي في المخزن <b>{formatKg(Math.max(0, remaining))}</b>
              </span>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div dir="ltr" className="flex justify-between gap-4 pt-1">
          <Button
            large
            onClick={() => setOpen(false)}
            label="إلغاء"
            variant="filled"
            rounded="xl"
            fixedPadding="3"
            color="danger"
          />
          <Button
            large
            type="submit"
            label="تأكيد النقل"
            isLoading={isSaving}
            disabled={isSaving || Boolean(validationMessage)}
            variant="filled"
            rounded="xl"
            fixedPadding="3"
            color="indigo"
          />
        </div>
      </form>
    </Modal>
  );
}
