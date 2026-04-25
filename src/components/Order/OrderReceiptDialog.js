import React, { useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import Button from "../Button";
import { Printer, X } from "lucide-react";
import Cookies from "js-cookie";
import JsBarcode from "jsbarcode";

const PAYMENT_METHOD_LABELS = {
  cash: "كاش",
  card: "بطاقة",
  transfer: "تحويل",
  wallet: "محفظة",
  mixed: "مختلط",
};

const PRINT_STYLES = `
  @page {
    size: 80mm auto;
    margin: 0;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #111827;
    font-family: Arial, sans-serif;
    direction: rtl;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  img {
    max-width: 100%;
    display: block;
  }

  .receipt-content {
    width: 72mm;
    margin: 0 auto;
    padding: 4mm 3.5mm 5mm;
  }

  .receipt-paper {
    width: 100%;
  }

  .receipt-header {
    text-align: center;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }

  .receipt-store {
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
  }

  .receipt-subtext {
    margin-top: 4px;
    color: #4b5563;
    font-size: 11px;
    line-height: 1.6;
  }

  .receipt-badge {
    display: inline-block;
    margin: 0 auto 8px;
    padding: 4px 10px;
    border: 1px solid #111827;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .receipt-section {
    border-bottom: 1px dashed #d1d5db;
    padding: 8px 0;
  }

  .receipt-section:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .receipt-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 4px;
    font-size: 11px;
    line-height: 1.5;
  }

  .receipt-row:last-child {
    margin-bottom: 0;
  }

  .receipt-label {
    color: #4b5563;
    font-weight: 700;
  }

  .receipt-value {
    color: #111827;
    font-weight: 600;
    text-align: left;
  }

  .receipt-barcode {
    text-align: center;
  }

  .receipt-barcode img {
    width: 100%;
    max-width: 180px;
    height: 42px;
    margin: 0 auto 6px;
    object-fit: contain;
  }

  .receipt-order-id {
    color: #6b7280;
    font-size: 10px;
    font-family: monospace;
    direction: ltr;
    text-align: center;
  }

  .receipt-items-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 6px;
    margin-bottom: 4px;
    border-bottom: 1px solid #d1d5db;
    font-size: 10px;
    font-weight: 700;
    color: #374151;
  }

  .receipt-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px dotted #e5e7eb;
  }

  .receipt-item:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .receipt-item-info {
    flex: 1;
    min-width: 0;
  }

  .receipt-item-name {
    color: #111827;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.5;
    word-break: break-word;
  }

  .receipt-item-meta {
    margin-top: 2px;
    color: #6b7280;
    font-size: 10px;
    line-height: 1.45;
  }

  .receipt-item-total {
    min-width: 66px;
    color: #111827;
    font-size: 11px;
    font-weight: 700;
    text-align: left;
    direction: ltr;
    white-space: nowrap;
  }

  .receipt-total-box {
    border-top: 2px solid #111827;
    padding-top: 8px;
  }

  .receipt-grand-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #111827;
    font-size: 14px;
    font-weight: 700;
  }

  .receipt-note {
    font-size: 11px;
    line-height: 1.7;
    color: #374151;
    white-space: pre-wrap;
  }

  .receipt-footer {
    padding-top: 10px;
    text-align: center;
    font-size: 10px;
    color: #4b5563;
    line-height: 1.7;
  }
`;

const formatDate = (dateString) =>
  new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));

const formatCurrency = (amount) =>
  new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getPaymentMethodLabel = (paymentMethod) =>
  PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod || "كاش";

const getOrderTitle = (orderType) =>
  orderType === "weight" ? "فاتورة وزن" : "فاتورة شراء";

const getReceiptItems = (order) => {
  const regularItems = (order?.items || []).map((item, index) => ({
    id: `item-${item?.product?._id || item?.product || index}`,
    name: item?.product?.name || "منتج",
    details: [
      item?.size ? `المقاس: ${item.size}` : null,
      `${item?.quantity || 0} × ${formatCurrency(item?.price)} ج.م`,
    ]
      .filter(Boolean)
      .join(" | "),
    total: item?.total,
  }));

  const weightItems = (order?.weightItems || []).map((item, index) => ({
    id: `weight-${item?.weightProduct?._id || item?.weightProduct || index}`,
    name: item?.weightProduct?.name || "صنف وزن",
    details: `${item?.weight || 0} كجم × ${formatCurrency(item?.pricePerKg)} ج.م`,
    total: item?.total,
  }));

  return [...regularItems, ...weightItems];
};

const getTotals = (order) => {
  const discountAmount = Number(order?.discount?.amount || 0);
  const shippingAmount = Number(order?.shipping || 0);
  const priceDiffAmount = Number(order?.priceDiff || 0);

  return [
    { label: "المجموع الفرعي", value: order?.subtotal || 0, visible: true },
    { label: "الخصم", value: discountAmount, visible: discountAmount > 0, negative: true },
    { label: "الشحن", value: shippingAmount, visible: shippingAmount > 0 },
    { label: "فارق السعر", value: priceDiffAmount, visible: priceDiffAmount !== 0 },
  ];
};

const waitForPrintResources = async (printDocument) => {
  const images = Array.from(printDocument.images || []);

  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          const done = () => resolve();
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
          setTimeout(done, 1200);
        }),
    ),
  );

  if (printDocument.fonts?.ready) {
    try {
      await printDocument.fonts.ready;
    } catch {
      return;
    }
  }
};

const OrderReceipt = ({ order, isGift, user, storeSettings }) => {
  const [barcodeUrl, setBarcodeUrl] = useState("");
  const receiptItems = getReceiptItems(order);
  const totals = getTotals(order);
  const storeName = storeSettings?.storeName || user?.brandName || "اسم المتجر";
  const storePhone = storeSettings?.storePhone || user?.phone || "";
  const storeLocation = storeSettings?.storeLocation || user?.location || "";

  useEffect(() => {
    if (order?._id) {
      const canvas = document.createElement("canvas");

      try {
        JsBarcode(canvas, order._id.toString(), {
          format: "CODE128",
          width: 1.6,
          height: 42,
          displayValue: false,
          margin: 0,
        });
        setBarcodeUrl(canvas.toDataURL("image/png"));
      } catch {
        setBarcodeUrl("");
      }
    } else {
      setBarcodeUrl("");
    }
  }, [order?._id]);

  return (
    <div className="receipt-shell mx-auto w-full max-w-[380px]">
      <div
        className="receipt-content receipt-paper space-y-3 rounded-[28px] border border-slate-200 bg-white p-5 text-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        dir="rtl"
      >
        <div className="receipt-header border-slate-200 border-b pb-3 text-center">
          <h2 className="receipt-store font-black text-[22px] text-slate-950 leading-tight">
            {storeName}
          </h2>
          {(storeLocation || storePhone) && (
            <div className="receipt-subtext mt-2 space-y-1 text-slate-500 text-xs leading-6">
              {storeLocation && <p>{storeLocation}</p>}
              {storePhone && (
                <p dir="ltr" className="font-medium">
                  {storePhone}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="receipt-section space-y-1 border-slate-200 border-b border-dashed pb-3">
          <div className="receipt-row flex items-center justify-between gap-3 text-xs">
            <span className="receipt-label font-bold text-slate-500">رقم الطلب</span>
            <span className="receipt-value font-semibold text-slate-900">
              #{order?.orderNumber || order?._id || "0000"}
            </span>
          </div>
          <div className="receipt-row flex items-center justify-between gap-3 text-xs">
            <span className="receipt-label font-bold text-slate-500">التاريخ</span>
            <span className="receipt-value font-semibold text-slate-900 text-left">
              {formatDate(order?.createdAt || new Date())}
            </span>
          </div>
          <div className="receipt-row flex items-center justify-between gap-3 text-xs">
            <span className="receipt-label font-bold text-slate-500">الدفع</span>
            <span className="receipt-value font-semibold text-slate-900">
              {getPaymentMethodLabel(order?.paymentMethod)}
            </span>
          </div>
          <div className="receipt-row flex items-center justify-between gap-3 text-xs">
            <span className="receipt-label font-bold text-slate-500">العميل</span>
            <span className="receipt-value font-semibold text-slate-900">
              {order?.customer?.name || "عميل نقدي"}
            </span>
          </div>
          {order?.customer?.phone && (
            <div className="receipt-row flex items-center justify-between gap-3 text-xs">
              <span className="receipt-label font-bold text-slate-500">الهاتف</span>
              <span className="receipt-value font-semibold text-slate-900" dir="ltr">
                {order.customer.phone}
              </span>
            </div>
          )}
        </div>

        <div className="receipt-section receipt-barcode border-slate-200 border-b border-dashed pb-3 text-center">
          {barcodeUrl && (
            <img
              src={barcodeUrl}
              alt="Order Barcode"
              className="mx-auto mb-2 h-12 w-full max-w-[190px] object-contain"
            />
          )}
          <p className="receipt-order-id font-mono text-[11px] text-slate-500" dir="ltr">
            {order?._id || "00000000"}
          </p>
        </div>

        <div className="receipt-section border-slate-200 border-b border-dashed pb-2">
          <div className="receipt-items-head mb-1 flex items-center justify-between gap-3 border-slate-200 border-b pb-2 font-bold text-[11px] text-slate-600">
            <span>الأصناف</span>
            {!isGift && <span>الإجمالي</span>}
          </div>

          {receiptItems.length > 0 ? (
            receiptItems.map((item) => (
              <div
                key={item.id}
                className="receipt-item flex items-start justify-between gap-3 border-slate-200 border-b border-dotted py-2 last:border-b-0"
              >
                <div className="receipt-item-info min-w-0 flex-1">
                  <p className="receipt-item-name font-bold text-[13px] text-slate-950 leading-6 break-words">
                    {item.name}
                  </p>
                  <p className="receipt-item-meta mt-1 text-[11px] text-slate-500 leading-5">
                    {item.details}
                  </p>
                </div>
                {!isGift && (
                  <span
                    className="receipt-item-total min-w-[72px] text-left font-bold text-[12px] text-slate-950"
                    dir="ltr"
                  >
                    {formatCurrency(item.total)} ج.م
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="py-3 text-center text-slate-500 text-xs">
              لا توجد أصناف في هذا الطلب
            </div>
          )}
        </div>

        {!isGift && (
          <div className="receipt-section receipt-total-box space-y-1 pt-1">
            {totals
              .filter((item) => item.visible)
              .map((item) => (
                <div
                  key={item.label}
                  className="receipt-row flex items-center justify-between gap-3 text-xs"
                >
                  <span className="receipt-label font-bold text-slate-600">
                    {item.label}
                  </span>
                  <span className="receipt-value font-semibold text-slate-900" dir="ltr">
                    {item.negative ? "-" : ""}
                    {formatCurrency(item.value)} ج.م
                  </span>
                </div>
              ))}

            <div className="receipt-grand-total flex items-center justify-between gap-3 pt-2 font-black text-slate-950 text-base">
              <span>الإجمالي</span>
              <span dir="ltr">{formatCurrency(order?.total)} ج.م</span>
            </div>
          </div>
        )}

        {order?.notes && (
          <div className="receipt-section border-slate-200 border-t border-dashed pt-2">
            <p className="mb-1 font-bold text-[11px] text-slate-700">ملاحظات</p>
            <p className="receipt-note text-[11px] text-slate-600 leading-6 whitespace-pre-wrap">
              {order.notes}
            </p>
          </div>
        )}

        <div className="receipt-footer border-slate-200 border-t pt-3 text-center text-[11px] text-slate-500 leading-6">
          <p className="font-bold text-slate-800">شكراً لزيارتكم</p>
          <p>نتشرف بخدمتكم دائماً</p>
        </div>
      </div>
    </div>
  );
};

const OrderReceiptDialog = ({ isOpen, onClose, orderData, autoPrint = false }) => {
  const [activeTab, setActiveTab] = useState("receipt");
  const [user, setUser] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const printFrameRef = useRef(null);

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

  const cleanupPrintFrame = () => {
    if (printFrameRef.current) {
      printFrameRef.current.remove();
      printFrameRef.current = null;
    }
  };

  useEffect(() => cleanupPrintFrame, []);

  const handlePrint = () => {
    const printContent = document.querySelector(".receipt-content");
    if (!printContent) return;

    cleanupPrintFrame();

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.bottom = "0";
    iframe.style.right = "0";

    printFrameRef.current = iframe;

    iframe.onload = async () => {
      const printWindow = iframe.contentWindow;
      const printDocument = printWindow?.document;

      if (!printWindow || !printDocument) {
        cleanupPrintFrame();
        return;
      }

      await waitForPrintResources(printDocument);

      printWindow.onafterprint = () => {
        setTimeout(() => {
          cleanupPrintFrame();
        }, 200);
      };

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 150);
    };

    iframe.srcdoc = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>فاتورة الطلب #${orderData?.orderNumber || orderData?._id || ""}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>${printContent.outerHTML}</body>
      </html>
    `;

    document.body.appendChild(iframe);
  };

  useEffect(() => {
    if (isOpen && autoPrint && orderData) {
      const timer = setTimeout(() => handlePrint(), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint, orderData]);

  if (!isOpen || !orderData) return null;

  return (
    <Modal open={isOpen} setOpen={onClose} bgWhite>
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900">فاتورة الطلب</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("receipt")}
            className={`rounded-xl px-4 py-2 font-bold text-sm transition ${activeTab === "receipt"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700"
              }`}
          >
            الفاتورة
          </button>
          <button
            onClick={() => setActiveTab("gift")}
            className={`rounded-xl px-4 py-2 font-bold text-sm transition ${activeTab === "gift"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700"
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
          />
          <Button
            label="إغلاق"
            onClick={onClose}
            variant="outline"
            rounded="xl"
          />
        </div>
      </div>
    </Modal>
  );
};

export default OrderReceiptDialog;
