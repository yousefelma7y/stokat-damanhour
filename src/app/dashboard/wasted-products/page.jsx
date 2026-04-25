// FILE LOCATION: app/dashboard/wasted-products/page.tsx

"use client";
import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  ArrowUturnLeftIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/Button";
import ContentTable from "@/components/contentTable";
import Modal from "@/components/Modal";
import DeleteModal from "@/components/DeleteModal";
import Title from "@/components/Title";
import Message from "@/components/Message";
import LoadingSpinner from "@/components/LoadingSpinner";
import FiltersCombonent from "@/components/FiltersCombonent";
import { useDebounce } from "use-debounce";
import CustomComboBox from "@/components/ComboBox";
import axiosClient from "@/lib/axios-client";
import Cookies from "js-cookie";

// Validation Schemas
const CreateWastedValidationSchema = Yup.object().shape({
  product: Yup.string().required("المنتج مطلوب"),
  stock: Yup.number()
    .required("الكمية مطلوبة")
    .positive("يجب أن تكون الكمية أكبر من صفر"),
  condition: Yup.string().required("الحالة مطلوبة"),
  reason: Yup.string().optional(),
});

const ReturnValidationSchema = Yup.object().shape({
  returnedQuantity: Yup.number()
    .required("الكمية المطلوبة مطلوبة")
    .positive("يجب أن تكون الكمية أكبر من صفر"),
});

// Initial form values
const initialCreateValues = {
  product: "",
  stock: "",
  condition: "damaged",
  reason: "",
};

const initialReturnValues = {
  returnedQuantity: "",
};

export default function WastedProducts() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  // UI States
  const [deleteModal, setDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedWasted, setSelectedWasted] = useState(null);

  // Data States
  const [wastedProducts, setWastedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Loading & Message States
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [message, setMessage] = useState(false);

  // Fetch wasted products
  const fetchWastedProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosClient.get("/wasted-products", {
        params: {
          page,
          limit,
          search: searchValue,
        },
      });

      if (data?.success) {
        setWastedProducts(data?.data);
        setTotalPages(data?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching wasted products:", error);
      setMessage({
        type: "error",
        message: "خطأ في تحميل المنتجات المرتجعة",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const { data } = await axiosClient.get("/products", {
        // params: { limit: 100 },
      });
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchWastedProducts();
  }, [page, limit, searchValue]);

  useEffect(() => {
    setPage(1);
  }, [searchValue]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Create Wasted Product
  const handleCreateWastedProduct = async (values, { resetForm }) => {
    try {
      setLoadingBtn(true);

      const selectedProduct = products.find((p) => p._id === values.product);

      // Validate selected product exists
      if (!selectedProduct) {
        setMessage({
          type: "error",
          message: "المنتج المختار غير موجود",
        });
        setLoadingBtn(false);
        return;
      }

      const payload = {
        productId: values.product,
        stock: parseInt(values.stock),
        condition: values.condition,
        reason: values.reason || "عودة العميل",
      };

      const { data } = await axiosClient.post("/wasted-products", payload);

      if (data.success) {
        setMessage({
          type: "success",
          message: `تم إضافة ${values.stock} من المنتج المرتجع بنجاح`,
        });
        setShowCreateModal(false);
        resetForm();
        fetchWastedProducts();
        // Refresh products to see updated stock
        fetchProducts();
      }
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "خطأ في إضافة المنتج",
      });
    } finally {
      setLoadingBtn(false);
    }
  };

  // Handle Return Wasted Product to Inventory
  const handleReturnWastedProduct = async (values, { resetForm }) => {
    try {
      setLoadingBtn(true);

      if (!selectedWasted) {
        setMessage({
          type: "error",
          message: "الرجاء اختيار منتج",
        });
        return;
      }

      const returnQuantity = parseInt(values.returnedQuantity);

      // Validate return quantity
      if (returnQuantity > selectedWasted.stock) {
        setMessage({
          type: "error",
          message: `الكمية المراد إرجاعها لا يمكن أن تتجاوز ${selectedWasted.stock}`,
        });
        setLoadingBtn(false);
        return;
      }

      const { data } = await axiosClient.post(
        `/wasted-products/${selectedWasted._id}/return`,
        {
          quantityToReturn: returnQuantity,
        },
      );

      if (data.success) {
        setMessage({
          type: "success",
          message: `تم إرجاع ${returnQuantity} من المنتج بنجاح`,
        });
        setShowReturnModal(false);
        setSelectedWasted(null);
        resetForm();
        fetchWastedProducts();
        // Refresh products to see updated stock
        fetchProducts();
      }
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "خطأ في إرجاع المنتج",
      });
    } finally {
      setLoadingBtn(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(
        `/wasted-products/${selectedWasted._id}`,
      );

      if (data.success) {
        setMessage({
          type: "success",
          message: "تم حذف المنتج المرتجع بنجاح",
        });
        setDeleteModal(false);
        setSelectedWasted(null);
        fetchWastedProducts();
      }
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "خطأ في الحذف",
      });
    } finally {
      setLoadingBtn(false);
    }
  };

  return (
    <div dir="rtl">
      <Message message={message} setMessage={setMessage} />

      {/* Create Wasted Product Modal */}
      <Modal
        bgWhite
        open={showCreateModal}
        setOpen={(val) => {
          if (!val) setShowCreateModal(false);
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            إضافة منتج مرتجع من الشركة
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل المنتج المرتجع. الكمية سيتم إضافتها للمخزون الأساسي.
          </div>
        </div>

        <Formik
          initialValues={initialCreateValues}
          validationSchema={CreateWastedValidationSchema}
          onSubmit={handleCreateWastedProduct}
        >
          {({ values, errors, touched, setFieldValue }) => {
            const selectedProduct = products.find(
              (p) => p._id === values.product,
            );
            return (
              <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
                {/* Product Selection */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      المنتج *
                    </label>
                    {errors.product && touched.product && (
                      <div className="text-red-500 text-sm">
                        {errors.product}
                      </div>
                    )}
                  </div>
                  <CustomComboBox
                    items={products}
                    value={values.product}
                    onChange={(value) => setFieldValue("product", value)}
                    placeholder="اختر المنتج"
                    className="w-full"
                    displayField="name"
                    byId
                  />
                  {selectedProduct && (
                    <div className="bg-blue-50 mt-2 p-2 rounded-lg text-sm">
                      <p className="text-gray-700">
                        المخزون المتاح:{" "}
                        <span className="font-bold">
                          {selectedProduct.stock}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Stock Quantity */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      الكمية المرتجعة *
                    </label>
                    {errors.stock && touched.stock && (
                      <div className="text-red-500 text-sm">{errors.stock}</div>
                    )}
                  </div>
                  <Field
                    type="number"
                    name="stock"
                    placeholder={`أدخل الكمية (الحد الأقصى: ${selectedProduct?.stock || 0})`}
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    الحالة *
                  </label>
                  <Field
                    as="select"
                    name="condition"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  >
                    <option value="damaged">تالف</option>
                    <option value="broken">مكسور</option>
                    <option value="defective">عيب</option>
                    <option value="expired">منتهي الصلاحية</option>
                  </Field>
                </div>

                {/* Reason */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    السبب (اختياري)
                  </label>
                  <Field
                    as="textarea"
                    name="reason"
                    placeholder="السبب (مثال: عودة العميل)"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full h-20 resize-none"
                  />
                </div>

                {/* Buttons */}
                <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                  <Button
                    large
                    onClick={() => setShowCreateModal(false)}
                    label="إلغاء"
                    variant="filled"
                    rounded="xl"
                    fixedPadding="3"
                    color="danger"
                  />
                  <Button
                    large
                    label="حفظ"
                    variant="filled"
                    type="submit"
                    rounded="xl"
                    fixedPadding="3"
                    disabled={loadingBtn}
                    isLoading={loadingBtn}
                  />
                </div>
              </Form>
            );
          }}
        </Formik>
      </Modal>

      {/* Return to Inventory Modal */}
      <Modal
        bgWhite
        open={showReturnModal}
        setOpen={(val) => {
          if (!val) {
            setShowReturnModal(false);
            setSelectedWasted(null);
          }
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            إرجاع منتج إلى المخزون الأساسي
          </div>
          {selectedWasted && (
            <div className="space-y-1 mt-2 text-gray-500">
              <p>
                المنتج:{" "}
                <span className="font-bold">
                  {selectedWasted?.product?.name}
                </span>
              </p>
              <p>
                الكمية المتاحة للإرجاع:{" "}
                <span className="font-bold">{selectedWasted?.stock}</span>
              </p>
              <p>
                الكمية المرتجعة سابقاً:{" "}
                <span className="font-bold">
                  {selectedWasted?.returnedQuantity || 0}
                </span>
              </p>
            </div>
          )}
        </div>

        <Formik
          initialValues={initialReturnValues}
          validationSchema={ReturnValidationSchema}
          onSubmit={handleReturnWastedProduct}
        >
          {({ values, errors, touched }) => (
            <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
              {/* Quantity to Return */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-medium text-gray-700 text-sm">
                    الكمية المراد إرجاعها *
                  </label>
                  {errors.returnedQuantity && touched.returnedQuantity && (
                    <div className="text-red-500 text-sm">
                      {errors.returnedQuantity}
                    </div>
                  )}
                </div>
                <Field
                  type="number"
                  name="returnedQuantity"
                  placeholder={`أدخل الكمية (الحد الأقصى: ${selectedWasted?.stock || 0})`}
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>

              {/* Buttons */}
              <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                <Button
                  large
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedWasted(null);
                  }}
                  label="إلغاء"
                  variant="filled"
                  rounded="xl"
                  fixedPadding="3"
                  color="danger"
                />
                <Button
                  large
                  label="تأكيد الإرجاع"
                  variant="filled"
                  type="submit"
                  rounded="xl"
                  fixedPadding="3"
                  disabled={loadingBtn}
                  isLoading={loadingBtn}
                />
              </div>
            </Form>
          )}
        </Formik>
      </Modal>

      {/* Delete Modal */}
      <DeleteModal
        deleteReqModal={deleteModal}
        setDeleteReqModal={setDeleteModal}
        name="المنتج المرتجع"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* Title */}
      <Title
        count={wastedProducts?.length}
        title="المنتجات المرتجعة من الشركة" 
        subTitle="إدارة المنتجات المرتجعة من الشركة"
        button={
          userRole === "admin" && (
            <div className="flex justify-end items-center gap-2">
              <Button
                Icon={PlusIcon}
                onClick={() => {
                  setShowCreateModal(true);
                }}
                label="إضافة منتج مرتجع"
                variant="filled"
                type="submit"
                rounded="xl"
                fixedPadding="3"
              />
            </div>
          )
        }
      />

      {/* Filters */}
      <FiltersCombonent
        placeholder="ابحث بالاسم..."
        searchField
        search={search}
        setSearch={setSearch}
      />

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div>
          <ContentTable
            data={wastedProducts.map((item) => ({
              _id: item._id,
              name: item.product?.name || item.name,
              model: item.product?.model || "-",
              size: item.product?.size || "-",
              wastedStock: item.stock,
              returnedQuantity: item.returnedQuantity || 0,
            }))}
            nodata="لا توجد منتجات مرتجعة"
            actions={
              userRole === "admin" && [
                {
                  label: "إرجاع",
                  Icon: ArrowUturnLeftIcon,
                  action: (item) => {
                    const found = wastedProducts.find(
                      (p) => p._id === item._id,
                    );
                    if (found && found.stock > 0) {
                      setSelectedWasted(found);
                      setShowReturnModal(true);
                    } else {
                      setMessage({
                        type: "error",
                        message: "لا توجد كمية متاحة للإرجاع",
                      });
                    }
                  },
                  props: {
                    color: "success",
                    variant: "filled",
                    rounded: "2xl",
                  },
                },
                {
                  label: "إرجاع الكل",
                  Icon: TrashIcon,
                  action: (item) => {
                    const found = wastedProducts.find(
                      (p) => p._id === item._id,
                    );
                    if (found) {
                      setSelectedWasted(found);
                      setDeleteModal(true);
                    }
                  },
                  props: {
                    color: "danger",
                    variant: "filled",
                    rounded: "2xl",
                  },
                },
              ]
            }
            header={[
              "id",
              "اسم المنتج",
              "الموديل",
              "المقاس",
              "الكمية المتهالكة",
              "الكمية المرتجعة",
            ]}
            totalPages={totalPages}
            page={page}
            setPage={setPage}
            setLimit={setLimit}
            limit={limit}
          />
        </div>
      )}
    </div>
  );
}
