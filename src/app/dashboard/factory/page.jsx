"use client";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
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
import axiosClient from "@/lib/axios-client";
import Cookies from "js-cookie";

// Validation Schemas
const CreateFactoryProductValidationSchema = Yup.object().shape({
  productName: Yup.string()
    .required("المنتج مطلوب")
    .oneOf(["بطارية جافة", "بطارية مية", "رصاص"], "يجب اختيار منتج صحيح"),
  stock: Yup.number()
    .required("الكمية مطلوبة")
    .positive("يجب أن تكون الكمية أكبر من صفر"),
});

const ReturnValidationSchema = Yup.object().shape({
  returnedQuantity: Yup.number()
    .required("الكمية المطلوبة مطلوبة")
    .positive("يجب أن تكون الكمية أكبر من صفر"),
});

// Initial form values
const initialCreateValues = {
  productName: "بطارية جافة",
  stock: "",
};

const initialReturnValues = {
  returnedQuantity: "",
};

export default function Factory() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  // UI States
  const [deleteModal, setDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Data States
  const [factoryProducts, setFactoryProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Loading & Message States
  const [isLoading, setIsLoading] = useState(true);

  const [loadingBtn, setLoadingBtn] = useState(false);
  const [message, setMessage] = useState(false);

  // Fetch factory products
  const fetchFactoryProducts = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosClient.get("/factory-products", {
        params: {
          page,
          limit,
          search: searchValue,
        },
      });

      if (data?.success) {
        setFactoryProducts(data?.data);
        setTotalPages(data?.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching factory products:", error);
      setMessage({
        type: "error",
        message: "خطأ في تحميل منتجات المصنع",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFactoryProducts();
  }, [page, limit, searchValue]);

  // Handle Create Factory Product
  const handleCreateProduct = async (values, { resetForm }) => {
    try {
      setLoadingBtn(true);

      const payload = {
        productName: values.productName,
        stock: parseInt(values.stock),
      };

      const { data } = await axiosClient.post("/factory-products", payload);

      if (data.success) {
        setMessage({
          type: "success",
          message: `تم إضافة ${values.stock} من ${values.productName} بنجاح`,
        });
        setShowCreateModal(false);
        resetForm();
        fetchFactoryProducts();
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

  // Handle Return Product
  const handleReturnProduct = async (values, { resetForm }) => {
    try {
      setLoadingBtn(true);

      if (!selectedProduct) {
        setMessage({
          type: "error",
          message: "الرجاء اختيار منتج",
        });
        return;
      }

      const returnQuantity = parseInt(values.returnedQuantity);

      // Validate return quantity
      if (returnQuantity > selectedProduct.stock) {
        setMessage({
          type: "error",
          message: `الكمية المراد إرجاعها لا يمكن أن تتجاوز ${selectedProduct.stock}`,
        });
        setLoadingBtn(false);
        return;
      }

      const { data } = await axiosClient.post(
        `/factory-products/${selectedProduct._id}/return`,
        {
          quantityToReturn: returnQuantity,
        },
      );

      if (data.success || data.message?.includes("نجاح")) {
        setMessage({
          type: "success",
          message: `تم إرجاع ${returnQuantity} من المنتج بنجاح`,
        });
        setShowReturnModal(false);
        setSelectedProduct(null);
        resetForm();
        fetchFactoryProducts();
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
        `/factory-products/${selectedProduct._id}`,
      );

      if (data.success) {
        setMessage({
          type: "success",
          message: "تم حذف المنتج بنجاح",
        });
        setDeleteModal(false);
        setSelectedProduct(null);
        fetchFactoryProducts();
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

  // Handle Reset Returned Quantity
  const handleResetReturnedQuantity = async (item) => {
    try {
      const found = factoryProducts.find((p) => p._id === item._id);
      if (!found) {
        setMessage({
          type: "error",
          message: "المنتج غير موجود",
        });
        return;
      }

      if ((found.returnedQuantity || 0) === 0) {
        setMessage({
          type: "error",
          message: "الكمية المرتجعة بالفعل صفر",
        });
        return;
      }

      setLoadingBtn(true);
      const { data } = await axiosClient.put(`/factory-products/${found._id}`, {
        returnedQuantity: 0,
      });

      if (data?.success) {
        setMessage({
          type: "success",
          message: "تم تصفير الكمية المرتجعة بنجاح",
        });
        fetchFactoryProducts();
      }
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "خطأ في تصفير الكمية المرتجعة",
      });
    } finally {
      setLoadingBtn(false);
    }
  };

  return (
    <div dir="rtl">
      <Message message={message} setMessage={setMessage} />

      {/* Create Modal */}
      <Modal
        bgWhite
        open={showCreateModal}
        setOpen={(val) => {
          if (!val) setShowCreateModal(false);
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            إضافة منتج للمصنع
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل المنتج. الكمية سيتم إضافتها للمخزون.
          </div>
        </div>

        <Formik
          initialValues={initialCreateValues}
          validationSchema={CreateFactoryProductValidationSchema}
          onSubmit={handleCreateProduct}
        >
          {({ errors, touched }) => (
            <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
              {/* Product Selection */}
              <div>
                <label className="block font-medium text-gray-700 text-sm mb-2">
                  المنتج *
                </label>
                <Field
                  as="select"
                  name="productName"
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                >
                  <option value="بطارية جافة">بطارية جافة</option>
                  <option value="بطارية مية">بطارية مية</option>
                  <option value="رصاص">رصاص</option>
                </Field>
                {errors.productName && touched.productName && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.productName}
                  </div>
                )}
              </div>

              {/* Stock Quantity */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-medium text-gray-700 text-sm">
                    الكمية *
                  </label>
                  {errors.stock && touched.stock && (
                    <div className="text-red-500 text-sm">{errors.stock}</div>
                  )}
                </div>
                <Field
                  type="number"
                  name="stock"
                  placeholder="أدخل الكمية"
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
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
          )}
        </Formik>
      </Modal>

      {/* Return Modal */}
      <Modal
        bgWhite
        open={showReturnModal}
        setOpen={(val) => {
          if (!val) {
            setShowReturnModal(false);
            setSelectedProduct(null);
          }
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            إرجاع من المخزون
          </div>
          {selectedProduct && (
            <div className="text-gray-500 mt-2 space-y-1">
              <p>
                المنتج:{" "}
                <span className="font-bold">
                  {selectedProduct?.productName}
                </span>
              </p>
              <p>
                المخزون الحالي:{" "}
                <span className="font-bold">{selectedProduct?.stock}</span>
              </p>
            </div>
          )}
        </div>

        <Formik
          initialValues={initialReturnValues}
          validationSchema={ReturnValidationSchema}
          onSubmit={handleReturnProduct}
        >
          {({ errors, touched }) => (
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
                  placeholder={`أدخل الكمية (الحد الأقصى: ${selectedProduct?.stock || 0})`}
                  className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>

              {/* Buttons */}
              <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                <Button
                  large
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedProduct(null);
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
        name="منتج المصنع"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* Title */}
      <Title
        count={factoryProducts?.length}
        title="منتجات المصنع"
        subTitle="إدارة منتجات المصنع (بطارية / رصاص)"
        button={
          userRole === "admin" && (
            <div className="flex justify-end items-center gap-2">
              <Button
                Icon={PlusIcon}
                onClick={() => {
                  setShowCreateModal(true);
                }}
                label="إضافة"
                variant="filled"
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
            data={factoryProducts.map((item) => ({
              _id: item._id,
              name: item.productName,
              stock: item.stock,
              returnedQuantity: item.returnedQuantity || 0,
            }))}
            nodata="لا توجد منتجات حالياً"
            actions={
              userRole === "admin" && [
                {
                  label: "إرجاع",
                  Icon: ArrowUturnLeftIcon,
                  action: (item) => {
                    const found = factoryProducts.find(
                      (p) => p._id === item._id,
                    );
                    if (found && found.stock > 0) {
                      setSelectedProduct(found);
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
                  label: "تصفير المرتجع",
                  Icon: RotateCcw,
                  action: (item) => {
                    handleResetReturnedQuantity(item);
                  },
                  props: {
                    color: "warning",
                    variant: "filled",
                    rounded: "2xl",
                  },
                },
                {
                  label: "حذف",
                  Icon: TrashIcon,
                  action: (item) => {
                    const found = factoryProducts.find(
                      (p) => p._id === item._id,
                    );
                    if (found) {
                      setSelectedProduct(found);
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
            header={["id", "المنتج", "المخزون", "الكمية المرتجعة"]}
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
