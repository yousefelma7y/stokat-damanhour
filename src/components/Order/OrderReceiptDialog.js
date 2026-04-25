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
    size: 72mm auto;
    margin: 0 !important;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    width: 72mm;
    max-width: 72mm;
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000 !important;
    font-family: 'Courier New', 'Lucida Console', 'Arial', monospace;
    direction: rtl;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Force ALL text to pure black for thermal printer */
  *, *::before, *::after {
    color: #000 !important;
  }

  img {
    max-width: 100%;
    display: block;
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }

  .receipt-content {
    width: 68mm;
    max-width: 68mm;
    margin: 0 auto;
    padding: 1mm 2mm;
    background: #fff;
  }

  .receipt-header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 6px;
    margin-bottom: 6px;
  }

  .receipt-store {
    font-size: 18px;
    font-weight: 900;
    color: #000 !important;
    line-height: 1.3;
  }

  .receipt-subtext {
    margin-top: 3px;
    font-size: 11px;
    font-weight: 700;
    color: #000 !important;
    line-height: 1.5;
  }

  .receipt-badge {
    display: inline-block;
    margin: 0 auto 6px;
    padding: 3px 14px;
    background-color: #000;
    color: #fff !important;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1px;
  }

  .receipt-badge-wrap {
    text-align: center;
    padding: 5px 0;
    border-bottom: 1px dashed #000;
  }

  .receipt-section {
    border-bottom: 1px dashed #000;
    padding: 4px 0;
  }

  .receipt-section:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .receipt-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 2px;
    font-size: 11px;
    font-weight: 700;
    color: #000 !important;
    line-height: 1.5;
  }

  .receipt-row:last-child {
    margin-bottom: 0;
  }

  .receipt-label {
    font-weight: 900;
    color: #000 !important;
  }

  .receipt-value {
    font-weight: 700;
    color: #000 !important;
    text-align: left;
  }

  .receipt-barcode {
    text-align: center;
    padding: 4px 0;
    border-bottom: 1px dashed #000;
  }

  .receipt-barcode img {
    width: 100%;
    max-width: 170px;
    height: 36px;
    margin: 0 auto 4px;
    object-fit: contain;
  }

  .receipt-order-id {
    color: #000 !important;
    font-size: 9px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    direction: ltr;
    text-align: center;
    word-break: break-all;
  }

  .receipt-items-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding-bottom: 4px;
    margin-bottom: 2px;
    border-bottom: 2px solid #000;
    font-size: 12px;
    font-weight: 900;
    color: #000 !important;
  }

  .receipt-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    padding: 3px 0;
    border-bottom: 1px dotted #333;
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
    color: #000 !important;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.4;
    word-break: break-word;
  }

  .receipt-item-meta {
    margin-top: 1px;
    color: #000 !important;
    font-size: 11px;
    font-weight: 700;
    line-height: 1.4;
  }

  .receipt-item-total {
    min-width: 60px;
    color: #000 !important;
    font-size: 11px;
    font-weight: 900;
    text-align: left;
    direction: ltr;
    white-space: nowrap;
  }

  .receipt-total-box {
    border-top: 2px solid #000;
    padding-top: 4px;
  }

  .receipt-grand-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-top: 3px;
    padding: 5px 0;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000;
    font-size: 16px;
    font-weight: 900;
    color: #000 !important;
  }

  .receipt-note {
    font-size: 10px;
    font-weight: 700;
    line-height: 1.5;
    color: #000 !important;
    white-space: pre-wrap;
  }

  .receipt-footer {
    padding-top: 6px;
    border-top: 2px solid #000;
    text-align: center;
    font-weight: 900;
    color: #000 !important;
    line-height: 1.6;
  }

  .receipt-footer-main {
    font-size: 13px;
    font-weight: 900;
  }

  .receipt-footer-sub {
    font-size: 10px;
    font-weight: 700;
  }

  .receipt-footer-line {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    margin-top: 4px;
  }

  @media print {
    html, body {
      width: 72mm;
      max-width: 72mm;
      margin: 0;
      padding: 0;
    }

    .receipt-content {
      page-break-after: avoid;
      page-break-inside: avoid;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color: #000 !important;
    }

    /* Keep badge inverted */
    .receipt-badge {
      background-color: #000 !important;
      color: #fff !important;
    }
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
  orderType === "weight" ? "فاتورة وزن" : "فاتورة بيع";

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
          height: 36,
          displayValue: false,
          margin: 0,
          background: "#ffffff",
          lineColor: "#000000",
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
    <div className="receipt-shell mx-auto w-full max-w-[260px]">
      <div
        className="receipt-content receipt-paper"
        dir="rtl"
        style={{
          width: '100%',
          maxWidth: '260px',
          margin: '0 auto',
          padding: '4px 6px',
          backgroundColor: '#fff',
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: '12px',
          color: '#000',
          lineHeight: '1.5',
        }}
      >
        {/* ═══════ STORE HEADER ═══════ */}
        <div className="receipt-header" style={{
          textAlign: 'center',
          paddingBottom: '6px',
          borderBottom: '2px solid #000',
        }}>
          <div className="receipt-store" style={{
            fontSize: '18px',
            fontWeight: '900',
            color: '#000',
            letterSpacing: '1px',
            marginBottom: '2px',
          }}>
            {storeName}
          </div>
          {(storeLocation || storePhone) && (
            <div className="receipt-subtext" style={{ marginTop: '3px' }}>
              {storeLocation && (
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#000' }}>
                  {storeLocation}
                </div>
              )}
              {storePhone && (
                <div dir="ltr" style={{ fontSize: '11px', fontWeight: '700', color: '#000' }}>
                  {storePhone}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════ RECEIPT TYPE BADGE ═══════ */}
        <div className="receipt-badge-wrap" style={{
          textAlign: 'center',
          padding: '5px 0',
          borderBottom: '1px dashed #000',
        }}>
          <div className="receipt-badge" style={{
            display: 'inline-block',
            backgroundColor: '#000',
            color: '#fff',
            padding: '3px 14px',
            fontSize: '13px',
            fontWeight: '900',
            letterSpacing: '1px',
          }}>
            {getOrderTitle(order?.order_type)}
          </div>
        </div>

        {/* ═══════ ORDER INFO ═══════ */}
        <div className="receipt-section" style={{
          padding: '4px 0',
          borderBottom: '1px dashed #000',
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '900', color: '#000' }}>رقم الطلب:</span>
            <span style={{ fontWeight: '700', color: '#000' }}>
              #{order?.orderNumber || order?._id || "0000"}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '900', color: '#000' }}>التاريخ:</span>
            <span style={{ fontWeight: '700', color: '#000', textAlign: 'left' }}>
              {formatDate(order?.createdAt || new Date())}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '900', color: '#000' }}>الدفع:</span>
            <span style={{ fontWeight: '700', color: '#000' }}>
              {getPaymentMethodLabel(order?.paymentMethod)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '900', color: '#000' }}>العميل:</span>
            <span style={{ fontWeight: '700', color: '#000' }}>
              {order?.customer?.name || "عميل نقدي"}
            </span>
          </div>
          {order?.customer?.phone && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '900', color: '#000' }}>الهاتف:</span>
              <span dir="ltr" style={{ fontWeight: '700', color: '#000' }}>
                {order.customer.phone}
              </span>
            </div>
          )}
        </div>

        {/* ═══════ BARCODE ═══════ */}
        <div className="receipt-barcode" style={{
          textAlign: 'center',
          padding: '4px 0',
          borderBottom: '1px dashed #000',
        }}>
          {barcodeUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
              <img
                src={barcodeUrl}
                alt="Barcode"
                style={{
                  height: '36px',
                  width: 'auto',
                  maxWidth: '170px',
                  imageRendering: 'crisp-edges',
                }}
              />
            </div>
          )}
          <div className="receipt-order-id" style={{
            fontSize: '9px',
            fontWeight: '700',
            color: '#000',
            fontFamily: "'Courier New', monospace",
            wordBreak: 'break-all',
          }} dir="ltr">
            {order?._id || "00000000"}
          </div>
        </div>

        {/* ═══════ ITEMS TABLE HEADER ═══════ */}
        <div style={{ padding: '4px 0 2px 0', borderBottom: '2px solid #000' }}>
          <div className="receipt-items-head" style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: '900',
            color: '#000',
            border: 'none',
            padding: '0',
            margin: '0',
          }}>
            <span>الأصناف</span>
            {!isGift && <span>الإجمالي</span>}
          </div>
        </div>

        {/* ═══════ ITEMS ═══════ */}
        <div style={{ padding: '2px 0' }}>
          {receiptItems.length > 0 ? (
            receiptItems.map((item) => (
              <div key={item.id} className="receipt-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '3px 0',
                borderBottom: '1px dotted #333',
              }}>
                <div className="receipt-item-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="receipt-item-name" style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    color: '#000',
                    marginBottom: '1px',
                    wordBreak: 'break-word',
                  }}>
                    {item.name}
                  </div>
                  <div className="receipt-item-meta" style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#000',
                  }}>
                    {item.details}
                  </div>
                </div>
                {!isGift && (
                  <span className="receipt-item-total" dir="ltr" style={{
                    minWidth: '55px',
                    fontSize: '11px',
                    fontWeight: '900',
                    color: '#000',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  }}>
                    {formatCurrency(item.total)} ج.م
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '6px 0', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#000' }}>
              لا توجد أصناف في هذا الطلب
            </div>
          )}
        </div>

        {/* ═══════ TOTALS ═══════ */}
        {!isGift && (
          <div className="receipt-total-box" style={{
            borderTop: '2px solid #000',
            paddingTop: '4px',
            marginTop: '2px',
          }}>
            {totals
              .filter((item) => item.visible)
              .map((item) => (
                <div key={item.label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#000',
                  marginBottom: '2px',
                }}>
                  <span>{item.label}:</span>
                  <span dir="ltr">
                    {item.negative ? "-" : ""}
                    {formatCurrency(item.value)} ج.م
                  </span>
                </div>
              ))}

            {/* ═══ GRAND TOTAL ═══ */}
            <div className="receipt-grand-total" style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: '900',
              color: '#000',
              borderTop: '2px solid #000',
              borderBottom: '2px solid #000',
              padding: '5px 0',
              marginTop: '3px',
            }}>
              <span>الإجمالي:</span>
              <span dir="ltr">{formatCurrency(order?.total)} ج.م</span>
            </div>
          </div>
        )}

        {/* ═══════ NOTES ═══════ */}
        {order?.notes && (
          <div style={{
            borderTop: '1px dashed #000',
            paddingTop: '4px',
            marginTop: '4px',
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '900',
              color: '#000',
              marginBottom: '2px',
            }}>
              ملاحظات:
            </div>
            <div className="receipt-note" style={{
              fontSize: '10px',
              fontWeight: '700',
              color: '#000',
              whiteSpace: 'pre-wrap',
              textAlign: 'right',
              lineHeight: '1.5',
            }}>
              {order.notes}
            </div>
          </div>
        )}

        {/* ═══════ FOOTER ═══════ */}
        <div className="receipt-footer" style={{
          textAlign: 'center',
          borderTop: '2px solid #000',
          paddingTop: '6px',
          marginTop: '6px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: '900', color: '#000', marginBottom: '2px' }}>
            شكراً لزيارتكم!
          </div>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#000' }}>
            نتشرف بخدمتكم دائماً
          </div>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#000', marginTop: '4px', letterSpacing: '2px' }}>
            ════════════════════
          </div>
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
      const timer = setTimeout(() => handlePrint(), 600);
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
