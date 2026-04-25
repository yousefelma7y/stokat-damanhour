import { Edit, PinIcon, Trash2, XCircleIcon } from 'lucide-react'
import React, { useState } from 'react'
import ContentTable from '../contentTable';
import { NumericFormat } from 'react-number-format';
import DeleteModal from '../DeleteModal';
import axiosClient from '../../lib/axios-client';
import EditOrderModal from '../Order/EditOrderModal';


const PendingOrdersSection = ({ products = [], pendingOrders = [], setRefetshPending, refetshPending, setMessage }) => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [deleteModal, setDeleteModal] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(false);

    const [editingOrder, setEditingOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleDelete = async (_id) => {

        // Handle delete logic here
        try {
            const params = {
                status: "cancelled",
            };
            setLoadingBtn(true);
            const { data } = await axiosClient.put(`/orders/${deleteModal}`, params);

            setMessage({ type: "success", message: data.message });
        } catch (error) {
            console.log(error);
            if (error.response) {
                setMessage({ type: "error", message: error.response.data.message });
            } else {
                setMessage({ type: "error", message: error.message });
            }
        } finally {
            setRefetshPending(!refetshPending);
            setLoadingBtn(false);
            setDeleteModal(false);
        }
    };

    // open edit modal
    const handleEdit = (order) => {
        setEditingOrder(order);
        setShowModal(true);
    };

    // ✅ FIXED: submit edit with size field
    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setLoadingBtn(true);

            // ✅ Prepare the order data with SIZE field
            const orderData = {
                items: values.items.map((item) => ({
                    product: item.product,
                    size: item.size, // ✅ Include size
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                })),
                discount: {
                    value: Number(values.discount),
                    type: values.discountType,
                },
                shipping: Number(values.shipping),
                priceDiff: Number(values.priceDiff || 0),
                status: values.status,
            };

            // Make the API call to update the order
            const { data } = await axiosClient.put(
                `/orders/${editingOrder._id}`,
                orderData
            );

            // Check if the API returned success
            if (!data.success) {
                throw new Error(data.message || "فشل تحديث الطلب");
            }

            setMessage({
                type: "success",
                message: data.message || "تم تحديث الطلب بنجاح",
            });

            // Reset form and close modal
            resetForm();
            setEditingOrder(null);
            setShowModal(false);

            // Refresh the orders list
            setRefetshPending(!refetshPending);

        } catch (error) {
            console.error("Error updating order:", error);

            let errorMessage = "حدث خطأ أثناء تحديث الطلب";

            if (error.response) {
                // Server responded with error status
                const responseData = error.response.data;

                // Handle specific error cases
                if (error.response.status === 404) {
                    errorMessage = responseData.message || "الطلب غير موجود";
                } else if (error.response.status === 400) {
                    // Handle validation errors or insufficient stock
                    if (responseData.errors && Array.isArray(responseData.errors)) {
                        errorMessage = responseData.errors.join(", ");
                    } else {
                        errorMessage = responseData.message || "بيانات غير صحيحة";
                    }
                } else if (error.response.status === 500) {
                    errorMessage = responseData.message || "خطأ في الخادم، يرجى المحاولة لاحقاً";
                } else {
                    errorMessage = responseData.message || errorMessage;
                }
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = "لا يوجد اتصال بالخادم، تحقق من الاتصال بالإنترنت";
            } else {
                // Something else happened while setting up the request
                errorMessage = error.message || "حدث خطأ غير متوقع";
            }

            setMessage({
                type: "error",
                message: errorMessage,
            });

            // Keep modal open so user can fix the issue
            // Don't reset form on error
        } finally {
            setLoadingBtn(false);
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 lg:col-span-2 bg-white shadow-sm  rounded-xl hidden lg:block">
            <DeleteModal
                deleteReqModal={deleteModal}
                setDeleteReqModal={setDeleteModal}
                name="الطلب"
                deleteHandler={handleDelete}
                OrdersPage
                isLoading={loadingBtn}
            />

            {/*edit and add order modal */}
            <EditOrderModal
                loadingBtn={loadingBtn}
                showModal={showModal}
                setShowModal={setShowModal}
                editingOrder={editingOrder}
                handleSubmit={handleSubmit}
                setEditingOrder={setEditingOrder}
                products={products}
            />

            {/* header and search */}
            <div className="flex justify-between items-center space-x-4 w-full p-4">
                <div className="flex justify-start items-center space-x-3 w-1/2">
                    <span>
                        <PinIcon className='text-yellow-500' />
                    </span>
                    <h1 className="w-fit font-bold text-gray-900 text-2xl">
                        الطلبات المعلقة
                    </h1>
                </div>
            </div>

            {/* Pending Orders  */}
            <div className="pb-2">
                <ContentTable
                    smallSection
                    data={pendingOrders.map((order) => {
                        return {
                            _id: order?._id,
                            name: order?.customer?.name,
                            itemsQty: order?.items?.reduce(
                                (acc, curr) => acc + curr?.quantity,
                                0
                            ), // ✅ Fixed: Calculate total quantity correctly
                            total: (
                                <div className="flex justify-center items-center space-x-2">
                                    <span
                                        className={`font-semibold ${order?.total > 0 && "text-green-600"
                                            }`}
                                    >
                                        <NumericFormat
                                            dir="ltr"
                                            value={order?.total}
                                            displayType={"text"}
                                            thousandSeparator={true}
                                        />
                                    </span>
                                    {order?.subtotal > 0 && order?.subtotal != order?.total && (
                                        <span
                                            className={`font-semibold text-red-600 line-through`}
                                        >
                                            (
                                            <NumericFormat
                                                dir="ltr"
                                                value={order?.subtotal}
                                                displayType={"text"}
                                                thousandSeparator={true}
                                            />
                                            )
                                        </span>
                                    )}
                                </div>
                            ),
                            discount: (
                                <span>
                                    {order?.discount?.value}{" "}
                                    {order?.discount?.type == "percentage" ? "%" : "EGP"}
                                </span>
                            ),
                            shipping:
                                (
                                    <span
                                        className={`font-semibold ${order?.shipping > 0 && "text-orange-600"
                                            }`}
                                    >
                                        <NumericFormat
                                            dir="ltr"
                                            value={order?.shipping}
                                            displayType={"text"}
                                            thousandSeparator={true}
                                        />
                                    </span>
                                ) || 0,
                            status: (
                                <span
                                    className={`md:text-white md:p-2 md:px-4 rounded-xl ${order?.status == "completed"
                                        ? "md:bg-green-600 text-green-500"
                                        : order?.status == "pending"
                                            ? "md:bg-yellow-500 text-yellow-500"
                                            : "md:bg-red-500 text-red-500"
                                        }`}
                                >
                                    {order?.status == "completed"
                                        ? "ناجح"
                                        : order?.status == "pending"
                                            ? "معلق"
                                            : order?.status == "cancelled"
                                                ? "ألغي"
                                                : "-"}
                                </span>
                            ),
                            date: order?.createdAt.split("T", 1),
                        };
                    })}
                    nodata="طلبات"
                    actions={[
                        {
                            label: null,
                            Icon: Edit,
                            action: (order) => {
                                // Find the full order object from the orders array
                                const fullOrder = pendingOrders.find((o) => o._id === order._id);
                                handleEdit(fullOrder);
                            },
                            props: {
                                color: "babyBlue",
                                variant: "filled",
                                rounded: "2xl",
                            },
                        },
                        {
                            label: null,
                            Icon: XCircleIcon,
                            action: (order) => {
                                setDeleteModal(order?._id);
                            },
                            props: {
                                color: "danger",
                                variant: "filled",
                                rounded: "2xl",
                            },
                        },
                    ]}
                    header={[
                        "ID",
                        "إسم العميل",
                        "عدد القطع",
                        "الإجمالي",
                        "الخصم",
                        "التوصيل",
                        "الحالة",
                        "تاريخ الطلب",
                    ]}
                    totalPages={1}
                    page={page}
                    setPage={setPage}
                    setLimit={setLimit}
                    limit={limit}
                />
            </div>
        </div>
    )
}

export default PendingOrdersSection
