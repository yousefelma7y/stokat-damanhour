import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import Button from "../Button";
import { Printer, X } from "lucide-react";
import Cookies from "js-cookie";
import JsBarcode from "jsbarcode";

const OrderReceipt = ({ order, isGift, user, storeSettings }) => {
  const [barcodeUrl, setBarcodeUrl] = useState("");

  useEffect(() => {
    if (order?._id) {
      const canvas = document.createElement("canvas");
      try {
        JsBarcode(canvas, order._id.toString(), {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: false,
          margin: 0,
        });
        setBarcodeUrl(canvas.toDataURL("image/png"));
      } catch {
        setBarcodeUrl("");
      }
    }
  }, [order?._id]);

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateString));
  };

  const formatCurrency = (amount) => Number(amount || 0).toFixed(2);

  return (
    <div className="mx-auto w-full max-w-[300px] space-y-2 bg-white p-4 text-gray-800 font-sans text-sm receipt-content">
      <div className="text-center border-b border-gray-300 pb-2">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">
          {storeSettings?.storeName || user?.brandName || "اسم المتجر"}
        </h2>
        <p className="text-xs text-gray-600 mt-1">
          {storeSettings?.storeLocation || user?.location || "العنوان"}
        </p>
        <p className="text-xs text-gray-600">
          تليفون: {storeSettings?.storePhone || user?.phone || "0123456789"}
        </p>
      </div>

      <div className="text-center py-1">
        <div className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
          {order?.order_type === "weight" ? "فاتورة وزن" : "فاتورة شراء"}
        </div>
      </div>

      <div className="text-center text-xs text-gray-600 border-b border-dashed border-gray-300 pb-2">
        {formatDate(order?.createdAt || new Date())}
      </div>

      <div className="text-center border-b border-dashed border-gray-300 pb-2">
        <p className="text-xs font-semibold text-gray-600 mb-1">رقم الطلب</p>
        {barcodeUrl && (
          <div className="flex justify-center my-1">
            <img src={barcodeUrl} alt="Order Barcode" className="h-12 w-auto" />
          </div>
        )}
        <p className="text-xs font-mono text-gray-700">{order?._id || "00000000"}</p>
      </div>

      <div className="space-y-1 border-b border-dashed border-gray-300 pb-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 font-semibold">العميل:</span>
          <span className="text-black font-medium">{order?.customer?.name || "عميل نقدي"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 font-semibold">الهاتف:</span>
          <span className="text-black font-medium" dir="ltr">
            {order?.customer?.phone || "N/A"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 font-semibold">الدفع:</span>
          <span className="text-black font-medium">كاش</span>
        </div>
      </div>

      <div className="space-y-1 pb-2">
        <div className="flex justify-between text-xs font-bold border-b border-gray-400 pb-1 mb-1">
          <span>الصنف</span>
          {!isGift && <span>المبلغ</span>}
        </div>

        {order?.items?.map((item, index) => (
          <div key={index} className="text-xs py-1 border-b border-dotted border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-black font-semibold">{item?.product?.name || "منتج"}</p>
                <p className="text-gray-600 text-[10px]">
                  {item?.quantity} × {formatCurrency(item?.price)} ج.م
                </p>
              </div>
              {!isGift && (
                <span className="text-black font-bold ml-2">
                  {formatCurrency(item?.total)} ج.م
                </span>
              )}
            </div>
          </div>
        ))}

        {order?.weightItems?.map((item, index) => (
          <div key={index} className="text-xs py-1 border-b border-dotted border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-black font-semibold">
                  {item?.weightProduct?.name || "صنف وزن"}
                </p>
                <p className="text-gray-600 text-[10px]">
                  {item?.weight} كجم × {formatCurrency(item?.pricePerKg)} ج.م
                </p>
              </div>
              {!isGift && (
                <span className="text-black font-bold ml-2">
                  {formatCurrency(item?.total)} ج.م
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isGift && (
        <div className="space-y-1 border-t-2 border-gray-400 pt-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-700">المجموع الفرعي:</span>
            <span className="text-black font-semibold">
              {formatCurrency(order?.subtotal)} ج.م
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">الدفع:</span>
            <span className="text-black font-semibold">كاش</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t-2 border-black">
            <span>الإجمالي:</span>
            <span>{formatCurrency(order?.total)} ج.م</span>
          </div>
        </div>
      )}

      {order?.notes && (
        <div className="border-t border-dashed border-gray-300 pt-2 text-xs">
          <p className="font-bold text-gray-800 mb-1">ملاحظات:</p>
          <p className="text-gray-600 whitespace-pre-wrap text-right leading-relaxed">
            {order.notes}
          </p>
        </div>
      )}

      <div className="text-center pt-2 border-t border-gray-300 space-y-1">
        <p className="text-xs font-semibold text-gray-700">شكراً لزيارتكم!</p>
      </div>
    </div>
  );
};

const OrderReceiptDialog = ({ isOpen, onClose, orderData, autoPrint = false }) => {
  const [activeTab, setActiveTab] = useState("receipt");
  const [user, setUser] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    fetch("/api/store-settings")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setStoreSettings(result.data);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (isOpen && autoPrint && orderData) {
      const timer = setTimeout(() => handlePrint(), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, orderData]);

  const handlePrint = () => {
    const printContent = document.querySelector(".receipt-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة الطلب #${orderData?._id || ""}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: Arial, sans-serif; background: white; color: #1a1a1a; }
          .receipt-content { width: 72mm; margin: 0 auto; padding: 4mm; }
        </style>
      </head>
      <body>${printContent.outerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  if (!isOpen || !orderData) return null;

  return (
    <Modal open={isOpen} setOpen={onClose} bgWhite>
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">فاتورة الطلب</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("receipt")}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              activeTab === "receipt" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            الفاتورة
          </button>
          <button
            onClick={() => setActiveTab("gift")}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${
              activeTab === "gift" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            بدون أسعار
          </button>
        </div>

        <OrderReceipt
          order={orderData}
          isGift={activeTab === "gift"}
          user={user}
          storeSettings={storeSettings}
        />

        <div className="flex gap-3">
          <Button
            label="طباعة"
            Icon={Printer}
            onClick={handlePrint}
            variant="filled"
            rounded="xl"
            className="flex-1"
          />
          <Button
            label="إغلاق"
            onClick={onClose}
            variant="outline"
            rounded="xl"
            className="flex-1"
          />
        </div>
      </div>
    </Modal>
  );
};

export default OrderReceiptDialog;
