"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader,
  MapPin,
  Package,
  Percent,
  Phone,
  Scale,
  ScanBarcode,
  Search,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import OrderTypeNav from "@/components/CreateOrder/OrderTypeNav";
import PendingOrdersSidebar from "@/components/CreateOrder/PendingOrdersSidebar";
import Message from "@/components/Message";
import LoadingSpinner from "@/components/LoadingSpinner";
import OrderReceiptDialog from "@/components/Order/OrderReceiptDialog";
import axiosClient from "@/lib/axios-client";

function ProductGridCard({ product, cartQuantity, onAdd }) {
  const stock = Number(product.stock || 0);
  const disabled = stock <= cartQuantity;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <h3 className="font-bold text-slate-900">{product.name}</h3>
        <p className="text-xs text-slate-500">
          {[product.model, product.size].filter(Boolean).join(" • ") || "منتج"}
        </p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">السعر</span>
        <span className="font-bold text-emerald-600">{product.price} ج.م</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">المتاح</span>
        <span className={`font-bold ${stock > 0 ? "text-blue-600" : "text-red-500"}`}>
          {stock}
        </span>
      </div>

      <button
        onClick={() => onAdd(product)}
        disabled={disabled}
        className={`w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
          disabled
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {disabled ? "نفذ المخزون" : "إضافة للعربة"}
      </button>
    </div>
  );
}

function WeightGridCard({ item, onAdd }) {
  const [weight, setWeight] = useState("");

  const parsedWeight = Number(weight || 0);
  const total = parsedWeight > 0 ? parsedWeight * Number(item.pricePerKg || 0) : 0;

  return (
    <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-sm space-y-3">
      <div>
        <h3 className="font-bold text-slate-900">{item.name}</h3>
        <p className="text-xs text-slate-500">يباع بالوزن</p>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">سعر الكيلو</span>
        <span className="font-bold text-emerald-600">{item.pricePerKg} ج.م</span>
      </div>

      <input
        type="number"
        min="0"
        step="0.01"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="أدخل الوزن بالكيلو"
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
      />

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">الإجمالي</span>
        <span className="font-bold text-slate-900">
          {total.toFixed(2)} ج.م
        </span>
      </div>

      <button
        onClick={() => {
          onAdd(item, parsedWeight);
          setWeight("");
        }}
        disabled={!parsedWeight}
        className={`w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
          !parsedWeight
            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        إضافة للعربة
      </button>
    </div>
  );
}

export default function CreateOrderPage() {
  const [orderType, setOrderType] = useState("purchase");
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcode, setBarcode] = useState("");
  const [submittedBarcode, setSubmittedBarcode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [oldCustomer, setOldCustomer] = useState(null);
  const [notes, setNotes] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [products, setProducts] = useState([]);
  const [weightProducts, setWeightProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isPendingOrdersLoading, setIsPendingOrdersLoading] = useState(false);
  const [refreshPending, setRefreshPending] = useState(0);
  const [resumingOrderId, setResumingOrderId] = useState(null);
  const [message, setMessage] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const [searchTermDebounced] = useDebounce(searchTerm, 400);
  const [customerPhoneDebounced] = useDebounce(customerPhone, 500);

  const fetchPendingOrders = useCallback(async () => {
    try {
      setIsPendingOrdersLoading(true);
      const { data } = await axiosClient.get("/orders", {
        params: { status: "pending", limit: 50 },
      });
      setPendingOrders(data.data || []);
    } catch {
      setPendingOrders([]);
    } finally {
      setIsPendingOrdersLoading(false);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      setIsLoading(true);
      const [productsRes, weightRes] = await Promise.all([
        axiosClient.get("/products", {
          params: { page: 1, limit: 200, search: searchTermDebounced },
        }),
        axiosClient.get("/weight-products", {
          params: { page: 1, limit: 200, search: searchTermDebounced },
        }),
      ]);

      setProducts(productsRes.data.data || []);
      setWeightProducts(weightRes.data.data || []);
    } catch (error) {
      setMessage({
        type: "error",
        message: "خطأ في تحميل الأصناف",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTermDebounced]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    fetchPendingOrders();
  }, [fetchPendingOrders, refreshPending]);

  useEffect(() => {
    if (!customerPhoneDebounced || customerPhoneDebounced.length < 10) return;

    const fetchCustomer = async () => {
      try {
        const { data } = await axiosClient.get(
          `/customers/lookup?phone=${customerPhoneDebounced}`,
        );

        if (data?.data) {
          setCustomerName(data.data.name);
          setCustomerLocation(data.data.location || "");
          setOldCustomer(data.data);
        } else {
          setOldCustomer(null);
        }
      } catch {
        setOldCustomer(null);
      }
    };

    fetchCustomer();
  }, [customerPhoneDebounced]);

  useEffect(() => {
    if (!submittedBarcode) return;

    const scanProduct = async () => {
      try {
        setScanLoading(true);
        const product = products.find(
          (item) =>
            String(item._id) === submittedBarcode ||
            String(item.barcode || "") === submittedBarcode,
        );

        if (!product) {
          setMessage({ type: "error", message: "المنتج غير موجود" });
          return;
        }

        addProductToCart(product);
      } finally {
        setScanLoading(false);
        setSubmittedBarcode("");
        setBarcode("");
      }
    };

    scanProduct();
  }, [submittedBarcode, products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [products, searchTerm]);

  const filteredWeightProducts = useMemo(() => {
    return weightProducts.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [weightProducts, searchTerm]);

  const regularSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.itemType !== "regular") return sum;
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [cart]);

  const weightSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.itemType !== "weight") return sum;
      return sum + Number(item.total || 0);
    }, 0);
  }, [cart]);

  const subtotal = regularSubtotal + weightSubtotal;

  const discountAmount = useMemo(() => {
    const value = Number(discountValue || 0);
    if (!value) return 0;
    if (discountType === "percentage") {
      return Math.min(subtotal, (subtotal * value) / 100);
    }
    return Math.min(subtotal, value);
  }, [discountType, discountValue, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  const resetForm = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerLocation("");
    setNotes("");
    setDiscountValue("");
    setDiscountType("fixed");
    setOldCustomer(null);
    setResumingOrderId(null);
    setOrderType("purchase");
  };

  const addProductToCart = (product) => {
    const stock = Number(product.stock || 0);

    setCart((current) => {
      const existing = current.find(
        (item) => item.itemType === "regular" && item._id === product._id,
      );

      const currentQty = existing?.quantity || 0;
      if (currentQty >= stock) {
        setMessage({
          type: "error",
          message: `لا يمكن إضافة أكثر من المتاح (${stock})`,
        });
        return current;
      }

      if (existing) {
        return current.map((item) =>
          item.itemType === "regular" && item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
          ...product,
          itemType: "regular",
          quantity: 1,
          price: Number(product.price || 0),
        },
      ];
    });
  };

  const addWeightToCart = (weightProduct, weight) => {
    if (!weight || weight <= 0) {
      setMessage({ type: "error", message: "أدخل وزن صحيح" });
      return;
    }

    setCart((current) => [
      ...current,
      {
        _id: `${weightProduct._id}-${Date.now()}`,
        sourceId: weightProduct._id,
        name: weightProduct.name,
        itemType: "weight",
        weight,
        pricePerKg: Number(weightProduct.pricePerKg || 0),
        total: Number(weightProduct.pricePerKg || 0) * weight,
      },
    ]);
  };

  const updateRegularQuantity = (id, delta) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.itemType !== "regular" || item._id !== id) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          const product = products.find((productItem) => productItem._id === id);
          if (product && nextQty > Number(product.stock || 0)) return item;
          return { ...item, quantity: nextQty };
        })
        .filter(Boolean),
    );
  };

  const removeCartItem = (id) => {
    setCart((current) => current.filter((item) => item._id !== id));
  };

  const handleResumeOrder = (order) => {
    const resumedType = order.order_type === "weight" ? "weight" : "purchase";
    setOrderType(resumedType);
    setCustomerName(order.customer?.name || "");
    setCustomerPhone(order.customer?.phone || "");
    setCustomerLocation(order.customer?.location || "");
    setOldCustomer(order.customer || null);
    setNotes(order.notes || "");
    setDiscountValue(order.discount?.value?.toString() || "");
    setDiscountType(order.discount?.type || "fixed");
    setResumingOrderId(order._id);

    const regularItems = (order.items || []).map((item) => ({
      ...item.product,
      _id: item.product?._id || item.product,
      itemType: "regular",
      quantity: item.quantity,
      price: item.price,
      size: item.size,
      name: item.product?.name || item.name,
    }));

    const weightedItems = (order.weightItems || []).map((item, index) => ({
      _id: `resumed-weight-${index}-${item.weightProduct?._id || item.weightProduct}`,
      sourceId: item.weightProduct?._id || item.weightProduct,
      name: item.weightProduct?.name || "صنف وزن",
      itemType: "weight",
      weight: item.weight,
      pricePerKg: item.pricePerKg,
      total: item.total,
    }));

    setCart([...regularItems, ...weightedItems]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitOrder = async (status) => {
    if (cart.length === 0) {
      setMessage({ type: "error", message: "العربة فارغة" });
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setMessage({ type: "error", message: "أدخل اسم ورقم هاتف العميل" });
      return;
    }

    const orderData = {
      customer: oldCustomer?._id || {
        name: customerName,
        phone: customerPhone,
        location: customerLocation || null,
      },
      items: cart
        .filter((item) => item.itemType === "regular")
        .map((item) => ({
          product: item._id,
          quantity: Number(item.quantity || 0),
          price: Number(item.price || 0),
          size: item.size,
          total: Number(item.quantity || 0) * Number(item.price || 0),
        })),
      weightItems: cart
        .filter((item) => item.itemType === "weight")
        .map((item) => ({
          weightProduct: item.sourceId,
          weight: Number(item.weight || 0),
          pricePerKg: Number(item.pricePerKg || 0),
          total: Number(item.total || 0),
        })),
      subtotal,
      total,
      discount: {
        type: discountType,
        value: Number(discountValue || 0),
        amount: discountAmount,
      },
      shipping: 0,
      priceDiff: 0,
      paymentMethod: "cash",
      order_type: orderType === "weight" ? "weight" : "regular",
      status,
      notes,
    };

    try {
      setLoadingAction(true);
      const method = resumingOrderId ? "put" : "post";
      const url = resumingOrderId ? `/orders/${resumingOrderId}` : "/orders";
      const { data } = await axiosClient[method](url, orderData);

      setCreatedOrder(data.data);
      if (status === "completed") {
        setShowReceiptDialog(true);
      }

      setMessage({
        type: "success",
        message:
          status === "completed"
            ? `تم إنشاء الطلب رقم ${data.data?._id} بنجاح`
            : "تم تعليق الطلب بنجاح",
      });

      setRefreshPending((value) => value + 1);
      setTimeout(resetForm, 1200);
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "خطأ في إنشاء الطلب",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  if (isLoading && products.length === 0 && weightProducts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div dir="rtl">
      <Message message={message} setMessage={setMessage} />

      <OrderReceiptDialog
        isOpen={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        orderData={createdOrder}
        autoPrint
      />

      <OrderTypeNav activeType={orderType} onTypeChange={setOrderType} />

      <div className="sticky top-[64px] z-10">
        <div className="flex flex-col md:flex-row gap-4 shadow-lg m-2 mx-auto p-3 bg-white rounded-2xl w-[95%]">
          <div className="flex items-center gap-3">
            <span className="flex justify-center items-center bg-green-500 rounded-full shrink-0 size-10">
              <ShoppingCart className="size-5 text-white" />
            </span>
            <div>
              <h1 className="font-bold text-gray-800 text-base md:text-lg">
                سجل طلب جديد
              </h1>
              <p className="text-[10px] text-gray-500">
                {orderType === "weight" ? "بيع أصناف الوزن" : "بيع المنتجات"}
              </p>
            </div>
          </div>

          {orderType === "purchase" && (
            <div className="relative flex-1">
              <ScanBarcode className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 w-5 h-5" />
              {scanLoading && (
                <Loader className="top-1/2 right-3 absolute size-4 text-blue-500 -translate-y-1/2 animate-spin" />
              )}
              <input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && barcode.trim()) {
                    setSubmittedBarcode(barcode.trim());
                  }
                }}
                className="py-3 pl-10 pr-4 border-2 border-gray-100 bg-gray-50 rounded-xl w-full focus:outline-none focus:border-blue-500"
                placeholder="امسح الباركود أو أدخل كود المنتج ..."
              />
            </div>
          )}

          <div className="relative flex-1">
            <Search className="top-1/2 left-3 absolute text-gray-400 -translate-y-1/2 w-5 h-5" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-3 pl-10 pr-4 border-2 border-gray-100 bg-gray-50 rounded-xl w-full focus:outline-none focus:border-emerald-500"
              placeholder="ابحث عن الصنف..."
            />
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {pendingOrders.length > 0 && (
            <div className="lg:col-span-3 h-auto lg:h-[calc(100vh-250px)] lg:sticky lg:top-24 order-2 lg:order-1">
              <PendingOrdersSidebar
                fetchPendingOrders={fetchPendingOrders}
                isPendingOrdersLoading={isPendingOrdersLoading}
                onResume={handleResumeOrder}
                setPendingOrders={setPendingOrders}
                pendingOrders={pendingOrders}
              />
            </div>
          )}

          <div
            className={`${
              pendingOrders.length > 0 ? "lg:col-span-4" : "lg:col-span-6"
            } order-1 lg:order-2 space-y-6`}
          >
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                <h3 className="font-bold text-blue-900">بيانات العميل</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    dir="rtl"
                    type="tel"
                    placeholder="رقم الهاتف *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full pr-10 pl-3 py-2.5 border-2 border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    dir="rtl"
                    placeholder="اسم العميل *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 border-2 border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="relative md:col-span-2">
                  <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    dir="rtl"
                    placeholder="العنوان"
                    value={customerLocation}
                    onChange={(e) => setCustomerLocation(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 border-2 border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                {orderType === "weight" ? (
                  <Scale className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Package className="w-5 h-5 text-blue-600" />
                )}
                <h3 className="font-bold text-slate-900">
                  {orderType === "weight" ? "أصناف الوزن" : "المنتجات"}
                </h3>
              </div>

              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {orderType === "weight"
                    ? filteredWeightProducts.map((item) => (
                        <WeightGridCard
                          key={item._id}
                          item={item}
                          onAdd={addWeightToCart}
                        />
                      ))
                    : filteredProducts.map((product) => (
                        <ProductGridCard
                          key={product._id}
                          product={product}
                          cartQuantity={cart
                            .filter(
                              (item) =>
                                item.itemType === "regular" && item._id === product._id,
                            )
                            .reduce((sum, item) => sum + (item.quantity || 0), 0)}
                          onAdd={addProductToCart}
                        />
                      ))}
                </div>
              )}
            </div>
          </div>

          <div
            className={`${
              pendingOrders.length > 0 ? "lg:col-span-3" : "lg:col-span-4"
            } order-3`}
          >
            <div className="bg-white shadow-lg p-4 rounded-2xl min-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-slate-900">العربة</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={resetForm}
                    className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg"
                  >
                    حذف الكل
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-400 py-12">العربة فارغة</div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item._id}
                      className="rounded-2xl border border-slate-200 p-3 space-y-3 bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <p className="text-xs text-slate-500">
                            {item.itemType === "weight"
                              ? `${item.weight} كجم × ${item.pricePerKg} ج.م`
                              : `${item.quantity} × ${item.price} ج.م`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCartItem(item._id)}
                          className="p-1.5 rounded-full hover:bg-red-100 text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {item.itemType === "regular" && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateRegularQuantity(item._id, -1)}
                              className="w-8 h-8 rounded-full bg-white border border-slate-300 font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold min-w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateRegularQuantity(item._id, 1)}
                              className="w-8 h-8 rounded-full bg-white border border-slate-300 font-bold"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-emerald-700">
                            {(item.quantity * item.price).toFixed(2)} ج.م
                          </span>
                        </div>
                      )}

                      {item.itemType === "weight" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">إجمالي الوزن</span>
                          <span className="font-bold text-emerald-700">
                            {Number(item.total || 0).toFixed(2)} ج.م
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات الطلب"
                  className="w-full min-h-24 rounded-2xl border border-slate-300 p-3 text-sm outline-none focus:border-emerald-500"
                />

                <div className="rounded-2xl border border-slate-200 p-3 space-y-3 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-900 text-sm">الخصم</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDiscountType("fixed")}
                      className={`rounded-xl py-2 text-sm font-bold border transition-colors ${
                        discountType === "fixed"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      مبلغ ثابت
                    </button>
                    <button
                      onClick={() => setDiscountType("percentage")}
                      className={`rounded-xl py-2 text-sm font-bold border transition-colors ${
                        discountType === "percentage"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      نسبة %
                    </button>
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={
                      discountType === "percentage"
                        ? "أدخل نسبة الخصم"
                        : "أدخل قيمة الخصم"
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">الدفع</span>
                  <span className="font-bold text-slate-900">كاش</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">المجموع الفرعي</span>
                  <span className="font-bold text-slate-900">{subtotal.toFixed(2)} ج.م</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">الخصم</span>
                    <span className="font-bold text-red-500">- {discountAmount.toFixed(2)} ج.م</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-lg">
                  <span className="font-bold text-slate-900">الإجمالي</span>
                  <span className="font-black text-emerald-700">{total.toFixed(2)} ج.م</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={loadingAction}
                    onClick={() => submitOrder("pending")}
                    className="rounded-2xl py-3 font-bold bg-amber-100 text-amber-700 hover:bg-amber-200"
                  >
                    تعليق
                  </button>
                  <button
                    disabled={loadingAction}
                    onClick={() => submitOrder("completed")}
                    className="rounded-2xl py-3 font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {loadingAction ? "جارٍ الحفظ..." : "تأكيد الطلب"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
