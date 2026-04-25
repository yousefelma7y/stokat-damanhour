import CustomComboBox from "../ComboBox";
import Modal from "../Modal";
import Button from "../Button";

import { Field, Form, Formik } from "formik";
import { Plus, X } from "lucide-react";



const ProductsModal = ({
    showModal,
    setShowModal,
    editingProduct,
    productValidationSchema,
    handleSubmit,
    setEditingProduct,
    loadingBtn,
    initialFormValues,
    isLoading,
}) => {

    return (
        <Modal
            bgWhite
            open={showModal}
            setOpen={(val) => {
                if (!val) {
                    setShowModal(null);
                }
            }}
        >
            <div>
                <div className="font-bold text-gray-900 text-2xl">
                    {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
                </div>
                <div className="text-gray-500">
                    أدخل تفاصيل المنتج أدناه ثم اضغط حفظ.
                </div>
            </div>

            <Formik
                initialValues={
                    editingProduct
                        ? {
                            name: editingProduct.name,
                            model: editingProduct.model || "",
                            size: editingProduct.size || "",
                            price: editingProduct.price || "",
                            stock: editingProduct.stock || "",
                        }
                        : initialFormValues
                }
                validationSchema={productValidationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ setFieldValue, values, errors, touched, isSubmitting }) => (
                    <Form className="space-y-4 mt-4 px-1 max-h-[70vh] overflow-y-auto">

                        {/* Product Name */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block font-medium text-gray-700 text-sm">
                                    اسم المنتج *
                                </label>
                                {errors.name && touched.name && (
                                    <div className="mt-1 text-red-500 text-sm">
                                        {errors.name}
                                    </div>
                                )}
                            </div>
                            <Field
                                type="text"
                                name="name"
                                className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                            />
                        </div>

                        {/* Model and Size */}
                        <div className="gap-4 grid grid-cols-2">
                            <div className="col-span-2 md:col-span-1">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block font-medium text-gray-700 text-sm">
                                        النوع *
                                    </label>
                                    {errors.model && touched.model && (
                                        <div className="mt-1 text-red-500 text-sm">
                                            {errors.model}
                                        </div>
                                    )}
                                </div>
                                <Field
                                    type="text"
                                    name="model"
                                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block font-medium text-gray-700 text-sm">
                                        المقاس *
                                    </label>
                                    {errors.size && touched.size && (
                                        <div className="mt-1 text-red-500 text-sm">
                                            {errors.size}
                                        </div>
                                    )}
                                </div>
                                <Field
                                    type="text"
                                    name="size"
                                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                />
                            </div>
                        </div>

                        <div className="gap-4 grid grid-cols-2">
                            <div className="col-span-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block font-medium text-gray-700 text-sm">
                                        الكمية *
                                    </label>
                                    {errors.stock && touched.stock && (
                                        <div className="mt-1 text-red-500 text-sm">
                                            {errors.stock}
                                        </div>
                                    )}
                                </div>
                                <Field
                                    type="number"
                                    name="stock"
                                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                />
                            </div>
                        </div>

                        <div className="gap-4 grid grid-cols-1">
                            <div className="col-span-1">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block font-medium text-gray-700 text-sm">
                                        سعر البيع *
                                    </label>
                                    {errors.price && touched.price && (
                                        <div className="mt-1 text-red-500 text-sm">
                                            {errors.price}
                                        </div>
                                    )}
                                </div>
                                <Field
                                    type="number"
                                    name="price"
                                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                />
                            </div>
                        </div>

                        <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                            <Button
                                large
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingProduct(null);
                                }}
                                label={"إلغاء"}
                                variant="filled"
                                rounded="xl"
                                fixedPadding="3"
                                color="danger"
                            />
                            <Button
                                large
                                label={editingProduct ? "تحديث" : "إضافة"}
                                isLoading={loadingBtn}
                                variant="filled"
                                type="submit"
                                rounded="xl"
                                fixedPadding="3"
                                disabled={loadingBtn}
                            />
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default ProductsModal;
