import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import Button from "../Button";
import { Formik, Form, Field, FieldArray } from "formik";
import * as Yup from "yup";
import { Plus, Trash2 } from "lucide-react";

const EditOrderModal = ({
    showModal,
    setShowModal,
    editingOrder,
    handleSubmit,
    setEditingOrder,
    products = [],
    suppliers = [],
    scraps = [], // Added scraps
    servicesList = [], // Added services
    loadingBtn = false
}) => {
    const [open, setOpen] = useState(false);

    console.log(editingOrder)

    useEffect(() => {
        if (showModal) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [showModal]);

    // Simplified stock helper
    const getProductStock = (productId) => {
        if (!productId) return 0;
        const idToFind = String(productId);
        const product = products.find((p) => String(p._id) === idToFind);
        return product?.stock || 0;
    };

    return (
        <Modal
            bgWhite
            open={open}
            setOpen={(val) => {
                if (!val) setShowModal(null);
            }}
        >
            <div>
                <div className="font-bold text-gray-900 text-2xl">تعديل الطلب</div>
                <div className="text-gray-500">
                    قم بتعديل تفاصيل الطلب أدناه ثم اضغط حفظ.
                </div>
            </div>

            <Formik
                initialValues={{
                    items: editingOrder?.items?.map(item => ({
                        product: item.product?._id || item.product,
                        productName: item.product?.name || '',
                        size: item.size || '',
                        quantity: item.quantity || 1,
                        price: item.price || 0,
                    })) || [],
                    discount: editingOrder?.discount?.value || 0,
                    discountType: editingOrder?.discount?.type || "percentage",
                    shipping: editingOrder?.shipping || 0,
                    priceDiff: editingOrder?.priceDiff || 0,
                    status: editingOrder?.status || "pending",
                    paidAmount: editingOrder?.paidAmount || 0,
                    supplier: editingOrder?.supplier?._id || editingOrder?.supplier || "",
                    order_type: editingOrder?.order_type || "regular",
                    scrapItems: editingOrder?.scrapItems?.map(item => {
                        const isScrapRef = item.refModel === "Scrap";
                        const sourceList = isScrapRef ? scraps : products;
                        const relatedProduct = sourceList.find(p => String(p._id) === String(item.product?._id || item.product));

                        return {
                            product: item.product?._id || item.product,
                            productName: relatedProduct?.name || item.productName || '',
                            size: item.size || relatedProduct?.size || '',
                            quantity: item.quantity || 1,
                            price: item.price || 0,
                            refModel: item.refModel || "Product"
                        };
                    }) || [],
                    services: editingOrder?.services?.map(item => ({
                        service: item.service?._id || item.service,
                        serviceName: item.service?.name || '',
                        quantity: item.quantity || 1,
                        price: item.price || 0,
                    })) || [],
                }}
                validationSchema={Yup.object({
                    items: Yup.array()
                        .of(
                            Yup.object({
                                product: Yup.string().required("المنتج مطلوب"),
                                quantity: Yup.number()
                                    .min(1, "الكمية يجب أن تكون 1 على الأقل")
                                    .required("الكمية مطلوبة"),
                                price: Yup.number()
                                    .min(0, "السعر يجب أن يكون صفر أو أكبر")
                                    .required("السعر مطلوب"),
                            })
                        ),
                    services: Yup.array()
                        .of(
                            Yup.object({
                                service: Yup.string().required("الخدمة مطلوبة"),
                                quantity: Yup.number()
                                    .min(1, "الكمية يجب أن تكون 1 على الأقل")
                                    .required("الكمية مطلوبة"),
                                price: Yup.number()
                                    .min(0, "السعر يجب أن يكون صفر أو أكبر")
                                    .required("السعر مطلوب"),
                            })
                        ),
                    scrapItems: Yup.array().of(
                        Yup.object({
                            product: Yup.string().required("المنتج مطلوب"),
                            quantity: Yup.number().min(1, "الكمية يجب أن تكون 1 على الأقل").required("الكمية مطلوبة"),
                        })
                    ),
                    discount: Yup.number().min(0, "الخصم يجب أن يكون صفر أو أكبر"),
                    shipping: Yup.number().min(0, "الشحن يجب أن يكون صفر أو أكبر"),
                    status: Yup.string().required("حالة الطلب مطلوبة"),
                    paidAmount: Yup.number().min(0, "المبلغ المدفوع يجب أن يكون صفر أو أكبر"),
                    supplier: Yup.string().when("order_type", {
                        is: "delayed",
                        then: () => Yup.string().required("المورد مطلوب للطلبات الآجلة"),
                    }),
                }).shape({
                    priceDiff: Yup.number(),
                })}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue }) => {
                    // Calculate subtotal
                    const itemsSubtotal = (values.items || []).reduce((sum, item) => {
                        return sum + (Number(item.price) * Number(item.quantity));
                    }, 0);

                    const servicesSubtotal = (values.services || []).reduce((sum, item) => {
                        return sum + (Number(item.price) * Number(item.quantity));
                    }, 0);

                    const subtotal = itemsSubtotal + servicesSubtotal;

                    // Calculate discount amount
                    const discountAmount =
                        values.discountType === "percentage"
                            ? (subtotal * values.discount) / 100
                            : values.discount;

                    const priceDiffValue = Number(values.priceDiff) || 0;

                    // Calculate total
                    const total = Math.max(0, subtotal - discountAmount + Number(values.shipping) + priceDiffValue);

                    const isEditable = (editingOrder?.order_type === "regular" || editingOrder?.order_type === "delayed");

                    return (
                        <Form className="space-y-4 ">
                            <div className="space-y-4 mt-4 px-1 max-h-[75vh] overflow-y-auto">
                                {/* Read-only Customer Info */}
                                <div className="space-y-2 bg-gray-50 p-4 border border-gray-200 rounded-lg">
                                    <h3 className="mb-3 font-semibold text-gray-900 text-lg">
                                        معلومات العميل
                                    </h3>
                                    <div className="gap-3 grid grid-cols-2">
                                        <div>
                                            <label className="block mb-1 font-medium text-gray-600 text-xs">
                                                اسم العميل
                                            </label>
                                            <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-700">
                                                {editingOrder?.customer?.name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block mb-1 font-medium text-gray-600 text-xs">
                                                رقم الهاتف
                                            </label>
                                            <div
                                                className="bg-gray-100 px-4 py-2 rounded-lg text-gray-700 font-medium"
                                                dir="ltr"
                                            >
                                                {editingOrder?.customer?.phone}
                                            </div>
                                        </div>
                                        {/* <div>
                                            <label className="block mb-1 font-medium text-gray-600 text-xs">
                                                نوع الطلب
                                            </label>
                                            <Field
                                                as="select"
                                                name="order_type"
                                                className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full bg-white text-gray-700"
                                            >
                                                <option value="regular">طلب عادي</option>
                                                <option value="exchange">طلب تبديل (Exchange)</option>
                                                <option value="replacement">طلب استبدال (Replacement)</option>
                                                <option value="delayed">طلب آجل</option>
                                                <option value="service">طلب خدمة</option>
                                            </Field>
                                        </div> */}
                                    </div>
                                </div>

                                {/* Editable Items Section */}
                                {editingOrder?.order_type != "service" && <FieldArray name="items">
                                    {({ push, remove }) => (
                                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {(["exchange", "replacement"].includes(values.order_type) || values.scrapItems.length > 0) ? "المنتجات المرسلة (الجديدة)" : "المنتجات"}
                                                </h3>
                                                {isEditable && <button
                                                    type="button"
                                                    onClick={() =>
                                                        push({
                                                            product: "",
                                                            productName: "",
                                                            size: "",
                                                            quantity: 1,
                                                            price: 0,
                                                        })
                                                    }
                                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-white text-sm transition-colors"
                                                >
                                                    <Plus size={16} />
                                                    إضافة منتج جديد
                                                </button>}
                                            </div>

                                            {values.items.length === 0 ? (
                                                <div className="bg-white p-8 border border-gray-200 rounded-lg text-center">
                                                    <p className="text-gray-500">
                                                        لا توجد منتجات في هذا الطلب
                                                    </p>
                                                    <p className="mt-1 text-gray-400 text-sm">
                                                        اضغط على "إضافة منتج جديد" لإضافة منتج
                                                    </p>
                                                </div>
                                            ) : (
                                                values.items.map((item, index) => {
                                                    const currentProduct = products.find(p => String(p._id) === String(item.product));
                                                    const currentStock = currentProduct?.stock || 0;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className="space-y-3 bg-white p-4 border border-gray-200 rounded-lg"
                                                        >
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-medium text-gray-700">
                                                                    منتج {index + 1}
                                                                </span>
                                                                {isEditable && <button
                                                                    type="button"
                                                                    onClick={() => remove(index)}
                                                                    className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                    <span className="text-sm">حذف</span>
                                                                </button>}
                                                            </div>

                                                            <div className="gap-3 grid grid-cols-1">
                                                                {/* Product Selector */}
                                                                <div>
                                                                    <label className="block mb-1 text-gray-700 text-sm font-medium">
                                                                        المنتج *
                                                                    </label>
                                                                    <Field
                                                                        disabled={!isEditable}
                                                                        as="select"
                                                                        name={`items.${index}.product`}
                                                                        className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                                                        onChange={(e) => {
                                                                            const selectedProductId = e.target.value;
                                                                            // ✅ FIXED: Use String() for comparison
                                                                            const selectedProduct = products.find(
                                                                                (p) => String(p._id) === String(selectedProductId)
                                                                            );

                                                                            setFieldValue(`items.${index}.product`, selectedProductId);

                                                                            if (selectedProduct) {
                                                                                setFieldValue(`items.${index}.productName`, selectedProduct.name);
                                                                                setFieldValue(`items.${index}.size`, selectedProduct.size || "");
                                                                                setFieldValue(`items.${index}.price`, selectedProduct.price || 0);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <option value="">اختر منتج</option>
                                                                        {products.map((product) => (
                                                                            <option key={product._id} value={product._id}>
                                                                                {product.name} - {product.color} - {product.price} EGP
                                                                            </option>
                                                                        ))}
                                                                    </Field>
                                                                    {errors?.items?.[index]?.product && touched?.items?.[index]?.product && (
                                                                        <div className="mt-1 text-red-500 text-xs">
                                                                            {errors.items[index].product}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="gap-3 grid grid-cols-2">
                                                                    {/* Quantity */}
                                                                    <div>
                                                                        <label className="block mb-1 text-gray-700 text-sm font-medium">
                                                                            الكمية *
                                                                        </label>
                                                                        <Field
                                                                            disabled={!isEditable}
                                                                            type="number"
                                                                            name={`items.${index}.quantity`}
                                                                            min="1"
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                                                        />
                                                                        {item.product && (
                                                                            <p className="mt-1 text-xs text-gray-500">
                                                                                المتوفر بالمخزن: {currentStock}
                                                                            </p>
                                                                        )}
                                                                        {errors?.items?.[index]?.quantity && touched?.items?.[index]?.quantity && (
                                                                            <div className="mt-1 text-red-500 text-xs">
                                                                                {errors.items[index].quantity}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Price */}
                                                                    <div>
                                                                        <label className="block mb-1 text-gray-700 text-sm font-medium">
                                                                            سعر الوحدة *
                                                                        </label>
                                                                        <Field
                                                                            disabled={!isEditable}
                                                                            type="number"
                                                                            name={`items.${index}.price`}
                                                                            min="0"
                                                                            step="0.01"
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                                                        />
                                                                        {errors?.items?.[index]?.price && touched?.items?.[index]?.price && (
                                                                            <div className="mt-1 text-red-500 text-xs">
                                                                                {errors.items[index].price}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Item Total */}
                                                                <div className="bg-gray-50 px-3 py-2 rounded border border-gray-200">
                                                                    <span className="text-gray-600 text-sm">المجموع: </span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {(Number(item.price) * Number(item.quantity)).toFixed(2)} EGP
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}

                                            {typeof errors.items === 'string' && (
                                                <div className="mt-2 text-red-500 text-sm">{errors.items}</div>
                                            )}
                                        </div>
                                    )}
                                </FieldArray>}

                                {/* Editable Services Section */}
                                {editingOrder?.order_type === "service" && <FieldArray name="services">
                                    {({ push, remove }) => (
                                        <div className="space-y-4 bg-cyan-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold text-cyan-900 text-lg">
                                                    الخدمات
                                                </h3>
                                                {isEditable && <button
                                                    type="button"
                                                    onClick={() =>
                                                        push({
                                                            service: "",
                                                            serviceName: "",
                                                            quantity: 1,
                                                            price: 0,
                                                        })
                                                    }
                                                    className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-3 py-1.5 rounded-lg text-white text-sm transition-colors"
                                                >
                                                    <Plus size={16} />
                                                    إضافة خدمة جديدة
                                                </button>}
                                            </div>

                                            {values.services.length === 0 ? (
                                                <div className="bg-white p-4 border border-cyan-200 rounded-lg text-center">
                                                    <p className="text-gray-500">
                                                        لا توجد خدمات في هذا الطلب
                                                    </p>
                                                </div>
                                            ) : (
                                                values.services.map((serviceItem, index) => {
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="space-y-3 bg-white p-4 border border-cyan-200 rounded-lg"
                                                        >
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-medium text-cyan-700">
                                                                    خدمة {index + 1}
                                                                </span>
                                                                {isEditable && <button
                                                                    type="button"
                                                                    onClick={() => remove(index)}
                                                                    className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                                                                >
                                                                    <Trash2 size={18} />
                                                                    <span className="text-sm">حذف</span>
                                                                </button>}
                                                            </div>

                                                            <div className="gap-3 grid grid-cols-1">
                                                                <div>
                                                                    <label className="block mb-1 text-gray-700 text-sm font-medium">
                                                                        الخدمة *
                                                                    </label>
                                                                    <Field
                                                                        disabled={!isEditable}
                                                                        as="select"
                                                                        name={`services.${index}.service`}
                                                                        className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                                                                        onChange={(e) => {
                                                                            const selectedServiceId = e.target.value;
                                                                            const selectedService = servicesList.find(
                                                                                (s) => String(s._id) === String(selectedServiceId)
                                                                            );

                                                                            setFieldValue(`services.${index}.service`, selectedServiceId);

                                                                            if (selectedService) {
                                                                                setFieldValue(`services.${index}.serviceName`, selectedService.name);
                                                                                setFieldValue(`services.${index}.price`, selectedService.price || 0);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <option value="">اختر خدمة</option>
                                                                        {servicesList.map((service) => (
                                                                            <option key={service._id} value={service._id}>
                                                                                {service.name} - {service.price} EGP
                                                                            </option>
                                                                        ))}
                                                                    </Field>
                                                                    {errors?.services?.[index]?.service && touched?.services?.[index]?.service && (
                                                                        <div className="mt-1 text-red-500 text-xs">
                                                                            {errors.services[index].service}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="gap-3 grid grid-cols-2">
                                                                    <div>
                                                                        <label className="block mb-1 text-gray-700 text-sm font-medium">
                                                                            العدد *
                                                                        </label>
                                                                        <Field
                                                                            disabled={!isEditable}
                                                                            type="number"
                                                                            name={`services.${index}.quantity`}
                                                                            min="1"
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                                                                        />
                                                                        {errors?.services?.[index]?.quantity && touched?.services?.[index]?.quantity && (
                                                                            <div className="mt-1 text-red-500 text-xs">
                                                                                {errors.services[index].quantity}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <label className="block mb-1 text-gray-700 text-sm font-medium">
                                                                            السعر *
                                                                        </label>
                                                                        <Field
                                                                            disabled={!isEditable}
                                                                            type="number"
                                                                            name={`services.${index}.price`}
                                                                            min="0"
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                                                                        />
                                                                        {errors?.services?.[index]?.price && touched?.services?.[index]?.price && (
                                                                            <div className="mt-1 text-red-500 text-xs">
                                                                                {errors.services[index].price}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </FieldArray>}

                                {/* Scrap Items Section (Visible only for Exchange/Replacement orders, or if items exist) */}
                                {(["replacement"].includes(values.order_type) || values.scrapItems.length > 0) && (
                                    <FieldArray name="scrapItems">
                                        {({ push, remove }) => (
                                            <div className="space-y-4 bg-orange-50 p-4 rounded-lg mt-4">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-orange-900 text-lg">
                                                        المنتجات المسترجعة (تالف/سكراب)
                                                    </h3>
                                                    {/* <button
                                                        type="button"
                                                        onClick={() =>
                                                            push({
                                                                product: "",
                                                                productName: "",
                                                                size: "",
                                                                quantity: 1,
                                                                price: 0,
                                                                refModel: "Product"
                                                            })
                                                        }
                                                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-3 py-1.5 rounded-lg text-white text-sm transition-colors"
                                                    >
                                                        <Plus size={16} />
                                                        إضافة مرتجع
                                                    </button> */}
                                                </div>

                                                {values.scrapItems.length === 0 ? (
                                                    <div className="bg-white p-8 border border-orange-200 rounded-lg text-center">
                                                        <p className="text-gray-500">لا توجد منتجات مسترجعة</p>
                                                    </div>
                                                ) : (
                                                    values.scrapItems.map((item, index) => {
                                                        const currentScrapProduct = products.find(p => String(p._id) === String(item.product));
                                                        return (
                                                            <div key={index} className="space-y-3 bg-white p-4 border border-orange-200 rounded-lg">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <span className="font-medium text-orange-700">مرتجع {index + 1}</span>
                                                                    {/* <button
                                                                        type="button"
                                                                        onClick={() => remove(index)}
                                                                        className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                        <span className="text-sm">حذف</span>
                                                                    </button> */}
                                                                </div>

                                                                <div className="gap-3 grid grid-cols-1">
                                                                    <div>
                                                                        <label className="block mb-1 text-gray-700 text-sm font-medium">المنتج المرتجع *</label>
                                                                        <Field
                                                                            disabled={!isEditable}
                                                                            as="select"
                                                                            name={`scrapItems.${index}.product`}
                                                                            value={`${item.refModel || 'Product'}:${item.product}`}
                                                                            className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 w-full"
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                if (!val) {
                                                                                    setFieldValue(`scrapItems.${index}.product`, "");
                                                                                    return;
                                                                                }

                                                                                const [type, id] = val.split(":");
                                                                                const sourceList = type === "Scrap" ? scraps : products;
                                                                                const selected = sourceList.find(p => String(p._id) === String(id));

                                                                                setFieldValue(`scrapItems.${index}.product`, id);
                                                                                setFieldValue(`scrapItems.${index}.refModel`, type);
                                                                                if (selected) {
                                                                                    setFieldValue(`scrapItems.${index}.productName`, selected.name);
                                                                                    setFieldValue(`scrapItems.${index}.size`, selected.size || "");
                                                                                }
                                                                            }}
                                                                        >
                                                                            <option value="">اختر منتج</option>
                                                                            <optgroup label="المنتجات">
                                                                                {products.map((p) => (
                                                                                    <option key={`Product:${p._id}`} value={`Product:${p._id}`}>{p.name} - {p.size}</option>
                                                                                ))}
                                                                            </optgroup>
                                                                            {scraps.length > 0 && (
                                                                                <optgroup label="خردة / سكراب">
                                                                                    {scraps.map((s) => (
                                                                                        <option key={`Scrap:${s._id}`} value={`Scrap:${s._id}`}>{s.name} - {s.size} (متوفر: {s.stock})</option>
                                                                                    ))}
                                                                                </optgroup>
                                                                            )}
                                                                        </Field>
                                                                    </div>

                                                                    <div className="gap-3 grid grid-cols-2">
                                                                        <div>
                                                                            <label className="block mb-1 text-gray-700 text-sm font-medium">الكمية *</label>
                                                                            <Field
                                                                                disabled={!isEditable}
                                                                                type="number"
                                                                                name={`scrapItems.${index}.quantity`}
                                                                                min="1"
                                                                                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 w-full"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block mb-1 text-gray-700 text-sm font-medium">سعر المرتجع</label>
                                                                            <Field
                                                                                disabled={!isEditable}
                                                                                type="number"
                                                                                name={`scrapItems.${index}.price`}
                                                                                className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 w-full"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </FieldArray>
                                )}

                                {/* Editable Order Details */}
                                <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        تفاصيل الطلب
                                    </h3>

                                    <div className="gap-3 grid grid-cols-2">
                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700 text-sm">
                                                الخصم
                                            </label>
                                            <Field
                                                type="number"
                                                name="discount"
                                                min="0"
                                                step="0.01"
                                                className="px-4 py-1 border border-gray-300 !h-11 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            />
                                            {errors.discount && touched.discount && (
                                                <div className="mt-1 text-red-500 text-xs">{errors.discount}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700 text-sm">
                                                نوع الخصم
                                            </label>
                                            <Field
                                                as="select"
                                                name="discountType"
                                                className="px-4 py-1 border !h-11 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            >
                                                <option value="percentage">نسبة مئوية (%)</option>
                                                <option value="fixed">مبلغ ثابت (EGP)</option>
                                            </Field>
                                        </div>

                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700 text-sm">
                                                الشحن (EGP)
                                            </label>
                                            <Field
                                                type="number"
                                                name="shipping"
                                                min="0"
                                                step="0.01"
                                                className="px-4 py-1 border !h-11 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            />
                                            {errors.shipping && touched.shipping && (
                                                <div className="mt-1 text-red-500 text-xs">{errors.shipping}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700 text-sm">
                                                فرق مقاس (EGP)
                                            </label>
                                            <Field
                                                type="number"
                                                name="priceDiff"
                                                step="0.01"
                                                className="px-4 py-1 border !h-11 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            />
                                            {errors.priceDiff && touched.priceDiff && (
                                                <div className="mt-1 text-red-500 text-xs">{errors.priceDiff}</div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block mb-2 font-medium text-gray-700 text-sm">
                                                حالة الطلب *
                                            </label>
                                            <Field
                                                as="select"
                                                name="status"
                                                className="px-4 py-1 border !h-11 border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                            >
                                                <option value="pending">معلق</option>
                                                <option value="completed">ناجح</option>
                                                <option value="cancelled">ملغي</option>
                                            </Field>
                                        </div>

                                        {/* Delayed Order Specific Fields */}
                                        {editingOrder?.order_type === "delayed" && (
                                            <>
                                                <div>
                                                    <label className="block mb-2 font-medium text-gray-700 text-sm">
                                                        المورد *
                                                    </label>
                                                    <Field
                                                        as="select"
                                                        name="supplier"
                                                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                                    >
                                                        <option value="">اختر المورد</option>
                                                        {suppliers.map((s) => (
                                                            <option key={s._id} value={s._id}>
                                                                {s.name} - رصيد: {s.wallet} EGP
                                                            </option>
                                                        ))}
                                                    </Field>
                                                    {errors.supplier && touched.supplier && (
                                                        <div className="mt-1 text-red-500 text-xs">{errors.supplier}</div>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block mb-2 font-medium text-gray-700 text-sm">
                                                        المبلغ المدفوع
                                                    </label>
                                                    <Field
                                                        type="number"
                                                        name="paidAmount"
                                                        min="0"
                                                        step="0.01"
                                                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                                    />
                                                    {errors.paidAmount && touched.paidAmount && (
                                                        <div className="mt-1 text-red-500 text-xs">{errors.paidAmount}</div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Order Summary */}
                                    <div className="bg-white mt-4 p-4 border border-gray-200 rounded-lg">
                                        <h4 className="mb-3 font-semibold text-gray-900">
                                            ملخص الطلب
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">المجموع الفرعي:</span>
                                                <span className="font-medium">{subtotal.toFixed(2)} EGP</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">الخصم:</span>
                                                <span className="font-medium text-red-600">
                                                    -{discountAmount.toFixed(2)} EGP
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">الشحن:</span>
                                                <span className="font-medium">
                                                    +{Number(values.shipping).toFixed(2)} EGP
                                                </span>
                                            </div>
                                            {priceDiffValue !== 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">فرق مقاس:</span>
                                                    <span className={`font-medium ${priceDiffValue > 0 ? "text-blue-600" : "text-red-600"}`}>
                                                        {priceDiffValue > 0 ? "+" : ""}
                                                        {priceDiffValue.toFixed(2)} EGP
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2 border-gray-300 border-t">
                                                <span className="font-semibold text-gray-900">
                                                    الإجمالي:
                                                </span>
                                                <span className="font-bold text-indigo-600 text-lg">
                                                    {total.toFixed(2)} EGP
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    large
                                    label="حفظ التعديلات"
                                    variant="filled"
                                    type="submit"
                                    rounded="xl"
                                    fixedPadding="3"
                                    isLoading={loadingBtn}
                                />
                                <Button
                                    large
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingOrder(null);
                                    }}
                                    label={"إلغاء"}
                                    variant="filled"
                                    rounded="xl"
                                    fixedPadding="3"
                                    color="danger"
                                />
                            </div>
                        </Form>
                    );
                }}
            </Formik>
        </Modal>
    );
};

export default EditOrderModal;
