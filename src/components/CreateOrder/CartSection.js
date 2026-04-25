import {
    ShoppingCart,
    User,
    Phone,
    MapPin,
    Percent,
    DollarSign,
    Truck,
    Edit2,
    Trash2,
    Plus,
    Minus,
    StickyNote,
    Wallet
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import Button from "../Button";
import NoData from "./NoData";
import CartItem from "./CartItem";
import PaymentSplitSelect from "../PaymentSplitSelect";
import axiosClient from "@/lib/axios-client";

const CartSection = ({
    cart = [],
    handleCreateOrder,
    removeFromCart,
    updateQuantity,
    updateItemPrice,
    clearCart,
    isLoading = false,
    setMessage,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerLocation,
    setCustomerLocation,
    discountValue,
    setDiscountValue,
    discountType,
    setDiscountType,
    shippingCost,
    setShippingCost,
    priceDiff,
    setPriceDiff,
    manualSection = false,
    oldCustomer,
    setOldCustomer,
    notes,
    setNotes,
    orderType = "",
    paidAmount = "",
    setPaidAmount,
    selectedSupplier = null,
    payments = [],
    setPayments
}) => {


    const [discountSection, setDiscountSection] = useState(false);
    const [shippingSection, setShippingSection] = useState(false);
    const [priceDiffSection, setPriceDiffSection] = useState(false);
    const [notesSection, setNotesSection] = useState(false);
    const [paymentSection, setPaymentSection] = useState(false);
    const [paymentValidation, setPaymentValidation] = useState({ isBalanced: true, isOverpaid: false, remaining: 0, paidTotal: 0 });


    // Calculate subtotal
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            const itemPrice = item.price || 0;
            return acc + itemPrice * (item.quantity || 1);
        }, 0);
    }, [cart]);

    // Calculate discount amount
    const discountAmount = useMemo(() => {
        if (!discountValue || discountValue <= 0) return 0;

        if (discountType === "percentage") {
            return subtotal * (parseFloat(discountValue) / 100);
        } else {
            return parseFloat(discountValue);
        }
    }, [discountType, discountValue, subtotal]);

    // Calculate shipping
    const shipping = useMemo(() => {
        return parseFloat(shippingCost) || 0;
    }, [shippingCost]);
    // Calculate final total
    const finalTotal = useMemo(() => {
        const total = subtotal - discountAmount + shipping + (parseFloat(priceDiff) || 0);
        return Math.max(0, total); // Ensure total is never negative
    }, [subtotal, discountAmount, shipping, priceDiff]);

    // === DISCOUNT VALIDATION ===
    const discountError = useMemo(() => {
        if (!discountValue || discountValue <= 0) return null;
        if (discountType === "percentage") {
            if (parseFloat(discountValue) > 100) return "النسبة لا يمكن أن تتجاوز 100%";
        } else {
            if (parseFloat(discountValue) > subtotal) return "الخصم أكبر من المجموع الفرعي";
        }
        return null;
    }, [discountValue, discountType, subtotal]);

    // === SHIPPING VALIDATION ===
    const shippingError = useMemo(() => {
        if (shippingCost && parseFloat(shippingCost) < 0) return "تكلفة الشحن لا يمكن أن تكون سالبة";
        return null;
    }, [shippingCost]);

    // === PAID AMOUNT VALIDATION (for delayed orders) ===
    const paidAmountError = useMemo(() => {
        if (orderType !== "delayed") return null;
        if (paidAmount === "" || paidAmount === null) return null;
        const val = parseFloat(paidAmount);
        if (val < 0) return "المبلغ المدفوع لا يمكن أن يكون سالب";
        if (val > finalTotal) return "المبلغ المدفوع أكبر من إجمالي الطلب";
        return null;
    }, [paidAmount, finalTotal, orderType]);

    // === PAYMENT VALIDATION ===
    const hasValidPayments = useMemo(() => {
        // If no payment section or no payments, consider it valid (default behavior)
        if (payments.length === 0) return true;
        // In split mode, payments must balance
        return paymentValidation.isBalanced && !paymentValidation.isOverpaid;
    }, [payments, paymentValidation]);

    // === OVERALL VALIDATION STATE ===
    const hasNoErrors = useMemo(() => {
        return !discountError && !shippingError && !paidAmountError;
    }, [discountError, shippingError, paidAmountError]);

    // Validate prices
    const hasValidPrices = useMemo(() => {
        return cart.every((item) => {
            // Allow 0 price for scrap items OR exchange orders
            if (item.isScrap || item.itemType === 'scrap' || orderType === 'exchange') {
                return true;
            }
            const price = item.price;
            return price > 0;
        });
    }, [cart, orderType]);

    // Validate customer or supplier data
    const hasValidContactData = useMemo(() => {
        if (orderType === "delayed") {
            return selectedSupplier !== null && paidAmount !== "" && paidAmount !== null;
        }
        return customerName.trim() !== "" && customerPhone.trim() !== "";
    }, [customerName, customerPhone, orderType, selectedSupplier, paidAmount]);

    // Total items count
    const totalItems = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }, [cart]);

    const handleQuantityIncrement = (_id, size) => {
        const cartKey = size ? `${_id}-${size}` : _id;
        const item = cart.find((item) => {
            const itemKey = item.size ? `${item._id}-${item.size}` : item._id;
            return itemKey === cartKey;
        });

        if (item && item.quantity < item.stock) {
            updateQuantity(_id, size, item.quantity + 1);
        }
    };

    const handleQuantityDecrement = (_id, size) => {
        const cartKey = size ? `${_id}-${size}` : _id;
        const item = cart.find((item) => {
            const itemKey = item.size ? `${item._id}-${item.size}` : item._id;
            return itemKey === cartKey;
        });

        if (item && item.quantity > 1) {
            updateQuantity(_id, size, item.quantity - 1);
        }
    };

    // Clear cart handler
    const handleClearCart = () => {
        clearCart();
        setCustomerName("");
        setCustomerPhone("");
        setCustomerLocation("");
        setDiscountValue("");
        setShippingCost("");
        setPriceDiff("");
        setOldCustomer(null);
    };

    // Suspend order handler
    const handleSuspendOrder = () => {
        if (!hasValidPrices) {
            setMessage({
                type: "error",
                message: "من فضلك تأكد من أسعار جميع المنتجات",
            });
            return;
        }
        if (!hasValidContactData) {
            let errorMsg = "من فضلك أدخل بيانات العميل (الاسم والهاتف)";
            if (orderType === "delayed") {
                if (!selectedSupplier) errorMsg = "من فضلك اختر التاجر";
                else if (paidAmount === "" || paidAmount === null) errorMsg = "من فضلك أدخل المبلغ المدفوع";
            }
            setMessage({
                type: "error",
                message: errorMsg,
            });
            return;
        }
        if (discountError) {
            setMessage({ type: "error", message: discountError });
            return;
        }
        if (shippingError) {
            setMessage({ type: "error", message: shippingError });
            return;
        }
        if (paidAmountError) {
            setMessage({ type: "error", message: paidAmountError });
            return;
        }

        // Filter regular, service and scrap items
        const serviceItems = cart.filter(item => item.itemType === 'service');
        const regularItems = cart.filter(item => !item.isScrap && item.itemType !== 'scrap' && item.itemType !== 'service');
        const scrapItems = cart.filter(item => item.isScrap || item.itemType === 'scrap');

        const orderData = {
            items: regularItems.map((item) => ({
                product: item._id,
                size: item.size,
                quantity: item.quantity || 1,
                price: item.price || 0,
            })),
            services: serviceItems.map((item) => ({
                service: item._id,
                quantity: item.quantity || 1,
                price: item.price || 0,
            })),
            scrapItems: scrapItems.map((item) => ({
                product: item._id,
                size: item.size,
                quantity: item.quantity || 1,
                price: 0,
                name: item.name,
                refModel: item.productId ? "Scrap" : "Product",
            })),
            customer: orderType === "delayed" ? null : (oldCustomer?._id || {
                name: customerName,
                phone: customerPhone,
                location: customerLocation || null,
            }),
            discount:
                discountValue && discountValue > 0
                    ? {
                        type: discountType,
                        value: parseFloat(discountValue),
                        amount: discountAmount,
                    }
                    : { type: "fixed", value: 0, amount: 0 },
            shipping: shipping > 0 ? shipping : 0,
            priceDiff: parseFloat(priceDiff) || 0,
            notes: notes || "",
            subtotal,
            total: finalTotal,
            status: "pending",
            order_type: orderType === "purchase" ? "regular" : orderType,
            supplier: orderType === "delayed" ? selectedSupplier?._id : null,
            paidAmount: orderType === "delayed" ? parseFloat(paidAmount) || 0 : 0,
            payments: payments.filter(p => parseFloat(p.amount) > 0),
        };

        handleCreateOrder(true, orderData);
    };

    // Confirm order handler
    const handleConfirmOrder = () => {
        if (!hasValidPrices) {
            setMessage({
                type: "error",
                message: "من فضلك تأكد من أسعار جميع المنتجات",
            });
            return;
        }
        if (!hasValidContactData) {
            let errorMsg = "من فضلك أدخل بيانات العميل (الاسم والهاتف)";
            if (orderType === "delayed") {
                if (!selectedSupplier) errorMsg = "من فضلك اختر التاجر";
                else if (paidAmount === "" || paidAmount === null) errorMsg = "من فضلك أدخل المبلغ المدفوع";
            }
            setMessage({
                type: "error",
                message: errorMsg,
            });
            return;
        }
        if (discountError) {
            setMessage({ type: "error", message: discountError });
            return;
        }
        if (shippingError) {
            setMessage({ type: "error", message: shippingError });
            return;
        }
        if (paidAmountError) {
            setMessage({ type: "error", message: paidAmountError });
            return;
        }
        if (!hasValidPayments && payments.length > 0) {
            setMessage({
                type: "error",
                message: paymentValidation.isOverpaid
                    ? "إجمالي المدفوعات أكبر من إجمالي الطلب"
                    : "إجمالي المدفوعات لا يساوي إجمالي الطلب",
            });
            return;
        }

        // Filter regular, service and scrap items
        const serviceItems = cart.filter(item => item.itemType === 'service');
        const regularItems = cart.filter(item => !item.isScrap && item.itemType !== 'scrap' && item.itemType !== 'service');
        const scrapItems = cart.filter(item => item.isScrap || item.itemType === 'scrap');

        const orderData = {
            items: regularItems.map((item) => ({
                product: item._id,
                size: item.size,
                quantity: item.quantity || 1,
                price: item.price || 0,
            })),
            services: serviceItems.map((item) => ({
                service: item._id,
                quantity: item.quantity || 1,
                price: item.price || 0,
            })),
            scrapItems: scrapItems.map((item) => ({
                product: item._id,
                size: item.size,
                quantity: item.quantity || 1,
                price: 0,
                name: item.name,
                refModel: item.productId ? "Scrap" : "Product",
            })),
            customer: orderType === "delayed" ? null : (oldCustomer?._id || {
                name: customerName,
                phone: customerPhone,
                location: customerLocation || null,
            }),
            discount:
                discountValue && discountValue > 0
                    ? {
                        type: discountType,
                        value: parseFloat(discountValue),
                        amount: discountAmount,
                    }
                    : { type: "fixed", value: 0, amount: 0 },
            shipping: shipping > 0 ? shipping : 0,
            priceDiff: parseFloat(priceDiff) || 0,
            notes: notes || "",
            subtotal,
            total: finalTotal,
            status: "completed",
            order_type: orderType === "purchase" ? "regular" : orderType,
            supplier: orderType === "delayed" ? selectedSupplier?._id : null,
            paidAmount: orderType === "delayed" ? parseFloat(paidAmount) || 0 : 0,
            payments: payments.filter(p => parseFloat(p.amount) > 0),
        };

        handleCreateOrder(false, orderData);
    };

    return (
        <div
            className={`flex flex-col justify-between ${manualSection ? "lg:col-span-1" : "max-w-4xl mx-auto"
                } bg-white shadow-lg p-4 rounded-xl h-full min-h-[80vh] overflow-hidden space-y-1`}
        >
            {/* Header Section */}
            <div className="flex flex-row justify-between items-center gap-2 w-full mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <ShoppingCart size={20} className="text-green-600" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-bold text-gray-900 text-sm md:text-base leading-tight">عربة التسوق</h2>
                        {cart.length > 0 && (
                            <span className="text-emerald-600 text-[10px] md:text-xs font-bold">
                                {totalItems} {totalItems === 1 ? "منتج" : "منتجات"}
                            </span>
                        )}
                    </div>
                </div>

                {cart.length > 0 && (
                    <button
                        onClick={handleClearCart}
                        disabled={isLoading}
                        className="text-[10px] md:text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 transition-colors"
                    >
                        حذف الكل
                    </button>
                )}
            </div>

            {/* Scrollable Cart Items */}
            <div
                className="flex-1 overflow-y-auto pr-2"
                style={{ maxHeight: "calc(88vh - 480px)" }}
            >
                {cart.length === 0 ? (
                    <div className="flex justify-center items-center min-h-[100px]">
                        <NoData cart data={"العربة فارغة، أضف منتجات"} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* ✅ REPLACED: Use CartItem component */}
                        {cart.map((item) => {
                            const uniqueKey = item.itemType === 'scrap'
                                ? `scrap-${item._id}`
                                : item.size
                                    ? `${item._id}-${item.size}`
                                    : item._id;

                            return (
                                <CartItem
                                    key={uniqueKey}
                                    item={item}
                                    onQuantityIncrement={handleQuantityIncrement}
                                    onQuantityDecrement={handleQuantityDecrement}
                                    onPriceChange={updateItemPrice}
                                    onDelete={removeFromCart}
                                    orderType={orderType}

                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Adjustments Section */}
            {cart.length > 0 && (
                <div className="bg-slate-50/50 rounded-2xl p-3 border border-slate-200/60 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <Edit2 size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">تعديلات الطلب</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {/* Discount Toggle */}
                        <button
                            onClick={() => setDiscountSection(!discountSection)}
                            className={`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer ${discountSection
                                ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-100"
                                : "bg-white border-purple-100 text-purple-700 hover:border-purple-300 hover:bg-purple-50"
                                }`}
                        >
                            <Percent size={16} />
                            <span className="text-xs font-bold">الخصم</span>
                        </button>

                        {/* Shipping Toggle */}
                        <button
                            onClick={() => setShippingSection(!shippingSection)}
                            className={`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer ${shippingSection
                                ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-100"
                                : "bg-white border-orange-100 text-orange-700 hover:border-orange-300 hover:bg-orange-50"
                                }`}
                        >
                            <Truck size={16} />
                            <span className="text-xs font-bold">الشحن</span>
                        </button>

                        {/* Price Diff Toggle */}
                        <button
                            onClick={() => setPriceDiffSection(!priceDiffSection)}
                            className={`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer ${priceDiffSection
                                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                                : "bg-white border-blue-100 text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                                }`}
                        >
                            <DollarSign size={16} />
                            <span className="text-xs font-bold">فرق مقاس</span>
                        </button>

                        {/* Notes Toggle */}
                        <button
                            onClick={() => setNotesSection(!notesSection)}
                            className={`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-all duration-200 cursor-pointer ${notesSection
                                ? "bg-yellow-500 border-yellow-500 text-white shadow-md shadow-yellow-100"
                                : "bg-white border-yellow-100 text-yellow-700 hover:border-yellow-300 hover:bg-yellow-50"
                                }`}
                        >
                            <StickyNote size={16} />
                            <span className="text-xs font-bold">ملاحظات</span>
                        </button>
                    </div>

                    {/* Expanded Content Area */}
                    <div className="space-y-3 transition-all duration-300">
                        {/* Discount Content */}
                        {discountSection && (
                            <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-200 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex gap-2 mb-3">
                                    <button
                                        onClick={() => setDiscountType("percentage")}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${discountType === "percentage"
                                            ? "bg-purple-600 text-white"
                                            : "bg-white text-purple-600 border border-purple-200"
                                            }`}
                                    >
                                        نسبة مئوية %
                                    </button>
                                    <button
                                        onClick={() => setDiscountType("fixed")}
                                        className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${discountType === "fixed"
                                            ? "bg-purple-600 text-white"
                                            : "bg-white text-purple-600 border border-purple-200"
                                            }`}
                                    >
                                        مبلغ ثابت
                                    </button>
                                </div>
                                <div className="relative">
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">
                                        {discountType === "percentage" ? "%" : "EGP"}
                                    </span>
                                    <input
                                        type="number"
                                        placeholder={discountType === "percentage" ? "0%" : "0.00"}
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        className="w-full pr-10 pl-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 font-bold"
                                    />
                                </div>
                                {discountError && (
                                    <p className="text-[10px] text-red-500 mt-1 font-bold">⚠️ {discountError}</p>
                                )}
                            </div>
                        )}

                        {/* Shipping Content */}
                        {shippingSection && (
                            <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-200 animate-in slide-in-from-top-2 duration-200">
                                <div className="relative">
                                    <Truck className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400" size={16} />
                                    <input
                                        type="number"
                                        placeholder="تكلفة الشحن..."
                                        value={shippingCost}
                                        onChange={(e) => setShippingCost(e.target.value)}
                                        className="w-full pr-10 pl-3 py-2 bg-white border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 font-bold"
                                    />
                                </div>
                                {shippingError && (
                                    <p className="text-[10px] text-red-500 mt-1 font-bold">⚠️ {shippingError}</p>
                                )}
                            </div>
                        )}

                        {/* Price Diff Content */}
                        {priceDiffSection && (
                            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-200 animate-in slide-in-from-top-2 duration-200">
                                <div className="relative">
                                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                                    <input
                                        type="number"
                                        placeholder="فرق المقاس (+/-)..."
                                        value={priceDiff}
                                        onChange={(e) => setPriceDiff(e.target.value)}
                                        className="w-full pr-10 pl-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 font-bold text-blue-900"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes Content */}
                        {notesSection && (
                            <div className="bg-yellow-50/50 rounded-xl p-3 border border-yellow-200 animate-in slide-in-from-top-2 duration-200">
                                <textarea
                                    className="w-full p-3 bg-white border border-yellow-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-100 min-h-[70px] resize-none text-slate-700"
                                    placeholder="ملاحظات الطلب..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                ></textarea>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Section - Kept distinct as it's the final phase */}
            {cart.length > 0 && (
                <div className={`transition-all duration-300 ${paymentSection ? "bg-indigo-50 border-indigo-200 pb-2" : "bg-transparent"} rounded-2xl border-2 border-transparent`}>
                    {!paymentSection ? (
                        <button
                            onClick={() => setPaymentSection(true)}
                            className="w-full flex items-center justify-between p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all font-bold cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <Wallet size={18} />
                                <span className="text-sm">طريقة الدفع</span>
                            </div>
                            <Plus size={16} />
                        </button>
                    ) : (
                        <div className="p-3 space-y-3">
                            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                                <div className="flex items-center gap-2 text-indigo-700">
                                    <Wallet size={18} />
                                    <span className="font-bold text-sm">تفاصيل الدفع</span>
                                </div>
                                <button onClick={() => setPaymentSection(false)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                                    <Minus size={18} />
                                </button>
                            </div>
                            <PaymentSplitSelect
                                payments={payments}
                                setPayments={setPayments}
                                totalAmount={orderType === "delayed" && paidAmount ? parseFloat(paidAmount) || 0 : finalTotal}
                                label={null}
                                onValidationChange={setPaymentValidation}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Footer Section - Summary & Actions */}
            <div className="space-y-2 w-full pt-2 border-t-2 border-gray-200">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 shadow-inner">
                    <div className="space-y-2 text-sm border-b border-slate-200 pb-3">
                        <div className="flex justify-between items-center text-slate-500">
                            <span className="font-medium">المجموع الفرعي:</span>
                            <span className="font-bold">{subtotal.toFixed(2)} EGP</span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex justify-between items-center text-purple-600 bg-purple-50/50 px-2 py-1 rounded-lg border border-purple-100">
                                <span className="flex items-center gap-1 font-medium"><Percent size={12} /> الخصم:</span>
                                <span className="font-bold">-{discountAmount?.toFixed(2)} EGP</span>
                            </div>
                        )}

                        {shipping > 0 && (
                            <div className="flex justify-between items-center text-orange-600 bg-orange-50/50 px-2 py-1 rounded-lg border border-orange-100">
                                <span className="flex items-center gap-1 font-medium"><Truck size={12} /> الشحن:</span>
                                <span className="font-bold">+{shipping.toFixed(2)} EGP</span>
                            </div>
                        )}

                        {parseFloat(priceDiff) !== 0 && priceDiff !== "" && (
                            <div className={`flex justify-between items-center px-2 py-1 rounded-lg border ${parseFloat(priceDiff) > 0
                                ? "text-blue-600 bg-blue-50/50 border-blue-100"
                                : "text-red-600 bg-red-50/50 border-red-100"
                                }`}>
                                <span className="flex items-center gap-1 font-medium"><DollarSign size={12} /> فرق مقاس:</span>
                                <span className="font-bold">
                                    {parseFloat(priceDiff) > 0 ? "+" : ""}
                                    {parseFloat(priceDiff).toFixed(2)} EGP
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-1">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">الإجمالي النهائي</span>
                            <span className="text-slate-900 font-black text-xl leading-tight">صافي الطلب</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-green-600 font-black text-2xl drop-shadow-sm">
                                {finalTotal?.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-green-700 font-bold -mt-1">EGP فقط لا غير</span>
                        </div>
                    </div>
                </div>

                {/* Paid Amount Section for Delayed Orders */}
                {orderType === "delayed" && cart.length > 0 && (
                    <div className="bg-red-50 rounded-xl p-3 border-2 border-red-200 space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-red-800">المبلغ المدفوع الآن:</label>
                            <span className="text-xs text-gray-500">المتبقي: {(finalTotal - (parseFloat(paidAmount) || 0)).toFixed(2)} EGP</span>
                        </div>
                        <div className="relative">
                            <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="number"
                                placeholder="أدخل المبلغ المدفوع"
                                value={paidAmount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") { setPaidAmount(""); return; }
                                    const num = parseFloat(val);
                                    if (num < 0) return; // block negative
                                    setPaidAmount(val);
                                }}
                                onBlur={() => {
                                    if (paidAmount === "" || paidAmount === null) return;
                                    let val = parseFloat(paidAmount);
                                    if (isNaN(val) || val < 0) { setPaidAmount(""); return; }
                                    if (val > finalTotal) {
                                        setPaidAmount(finalTotal.toString());
                                    }
                                }}
                                className={`w-full pr-10 pl-3 py-2 border-2 rounded-lg text-sm focus:outline-none font-bold transition-all ${paidAmountError
                                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
                                    : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                                    }`}
                            />
                        </div>
                        {paidAmountError && (
                            <div className="bg-red-100 rounded-lg p-2 border border-red-300">
                                <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                                    ⚠️ {paidAmountError}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div dir="ltr" className="flex justify-between items-center gap-2 w-full">
                    <Button
                        large
                        onClick={handleSuspendOrder}
                        color="yellow"
                        label={"تعليق الطلب"}
                        rounded={"lg"}
                        disabled={
                            isLoading ||
                            cart.length === 0 ||
                            !hasValidPrices ||
                            !hasValidContactData ||
                            !hasNoErrors
                        }
                        className="flex-1"
                    />
                    <Button
                        large
                        onClick={handleConfirmOrder}
                        color="green"
                        label={"أكد الطلب"}
                        rounded={"lg"}
                        variant="filled"
                        disabled={
                            isLoading ||
                            cart.length === 0 ||
                            !hasValidPrices ||
                            !hasValidContactData ||
                            !hasNoErrors ||
                            !hasValidPayments
                        }
                        className="flex-1"
                    />
                </div>

                {(!hasValidPrices || !hasValidContactData || !hasNoErrors || !hasValidPayments) && (
                    <div className="space-y-1">
                        {!hasValidPrices && orderType !== 'exchange' && (
                            <p className="text-xs text-red-500 text-center">
                                • تأكد من إدخال أسعار صحيحة لجميع المنتجات
                            </p>
                        )}
                        {!hasValidContactData && (
                            <p className="text-xs text-red-500 text-center">
                                • {orderType === "delayed"
                                    ? (!selectedSupplier ? "من فضلك اختر التاجر" : "من فضلك أدخل المبلغ المدفوع")
                                    : "من فضلك أدخل اسم العميل ورقم الهاتف"}
                            </p>
                        )}
                        {discountError && (
                            <p className="text-xs text-red-500 text-center">
                                • {discountError}
                            </p>
                        )}
                        {shippingError && (
                            <p className="text-xs text-red-500 text-center">
                                • {shippingError}
                            </p>
                        )}
                        {paidAmountError && (
                            <p className="text-xs text-red-500 text-center">
                                • {paidAmountError}
                            </p>
                        )}
                        {!hasValidPayments && payments.length > 0 && (
                            <p className="text-xs text-red-500 text-center">
                                • {paymentValidation.isOverpaid
                                    ? "إجمالي المدفوعات أكبر من إجمالي الطلب"
                                    : "إجمالي المدفوعات لا يساوي إجمالي الطلب"}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default CartSection;
