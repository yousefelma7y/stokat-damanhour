"use client";
import { useEffect, useRef, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import { BanknotesIcon, PlusIcon } from "@heroicons/react/24/outline";
import Button from "../../../components/Button";
import ContentTable from "../../../components/contentTable";
import Modal from "../../../components/Modal";
import DeleteModal from "../../../components/DeleteModal";
import Title from "../../../components/Title";
import Message from "../../../components/Message";
import axiosClient from "../../../lib/axios-client";
import LoadingSpinner from "../../../components/LoadingSpinner";
import FiltersCombonent from "../../../components/FiltersCombonent";
import { useDebounce } from "use-debounce";
import CustomComboBox from "../../../components/ComboBox";
import PaymentMethodSelect from "../../../components/PaymentMethodSelect";
import Cookies from "js-cookie";

// Validation Schema
const ValidationSchema = Yup.object().shape({
  name: Yup.string().required("اسم المنتج مطلوب"),
  size: Yup.string(),
  stock: Yup.number().required("الكمية مطلوبة").typeError("يجب أن يكون رقم"),
});

// Initial form values
const initialFormValues = {
  name: "",
  size: "",
  stock: "",
};

const initialSellFormValues = {
  product: "",
  quantity: "",
  price: "",
  paymentMethodId: null,
};
const sellValidationSchema = Yup.object().shape({
  product: Yup.string().required("المنتج مطلوب"),
  quantity: Yup.number().required("الكمية مطلوبة"),
  price: Yup.number().required("السعر مطلوب"),
});

export default function Scrap() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingScrap, setEditingScrap] = useState(null);

  const [sellModal, setSellModal] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [scraps, setScraps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [refetsh, setRefetsh] = useState(false);
  const [message, setMessage] = useState(false);

  useEffect(() => {
    setPage(1);
    setRefetsh(!refetsh);
  }, [limit, searchValue]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {
          page: page,
          limit: limit,
          search: searchValue,
        };
        setIsLoading(true);
        const { data } = await axiosClient.get(`/scraps`, { params });

        setScraps(data.data);
        setTotalPages(data?.pages);
      } catch (error) {
        console.log(error);
        if (error.response) {
          setMessage({ type: "error", message: error.response.data.message });
        } else {
          setMessage({ type: "error", message: error.message });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [page, refetsh]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingScrap) {
        try {
          setLoadingBtn(true);
          const { data } = await axiosClient.put(
            `/scraps/${editingScrap._id}`,
            values,
          );

          setMessage({ type: "success", message: data.message });
        } catch (error) {
          console.log(error);
          if (error.response) {
            setMessage({ type: "error", message: error.response.data.message });
          } else {
            setMessage({ type: "error", message: error.message });
          }
        } finally {
          setRefetsh(!refetsh);
          setLoadingBtn(false);
        }
      } else {
        try {
          setLoadingBtn(true);
          const { data } = await axiosClient.post(`/scraps`, values);

          setMessage({ type: "success", message: data.message });
        } catch (error) {
          console.log(error);
          setMessage({ type: "error", message: error?.response?.data?.error });
        } finally {
          setRefetsh(!refetsh);
          setLoadingBtn(false);
        }
      }

      resetForm();
      setEditingScrap(null);
    } catch (error) {
      console.error("Error submitting scrap:", error);
    } finally {
      setShowModal(false);
      setSubmitting(false);
    }
  };

  const handleEdit = (scrap) => {
    setEditingScrap(scrap);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(`/scraps/${deleteModal}`);

      setMessage({ type: "success", message: data.message });
    } catch (error) {
      console.log(error);
      if (error.response) {
        setMessage({ type: "error", message: error.response.data.message });
      } else {
        setMessage({ type: "error", message: error.message });
      }
    } finally {
      setDeleteModal(false);
      setRefetsh(!refetsh);
      setLoadingBtn(false);
    }
  };

  const handleSellSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.post("/scraps/sell", {
        product: values.product,
        quantity: values.quantity,
        price: values.price,
        paymentMethodId: values.paymentMethodId || null,
      });
      setMessage({ type: "success", message: data.message });
      resetForm();
      setSellModal(false);
      setRefetsh(!refetsh);
    } catch (error) {
      console.error("Error selling scrap:", error);
      if (error.response) {
        setMessage({ type: "error", message: error.response.data.message });
      } else {
        setMessage({ type: "error", message: error.message });
      }
    } finally {
      setLoadingBtn(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="" dir="rtl">
      <Message message={message} setMessage={setMessage} />

      {/*edit and add scrap modal */}
      <Modal
        bgWhite
        open={showModal}
        setOpen={(val) => {
          if (!val) {
            setShowModal(false);
            setEditingScrap(null);
          }
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            {editingScrap ? "تعديل المنتج التالف" : "إضافة منتج تالف جديد"}
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل المنتج التالف أدناه ثم اضغط حفظ.
          </div>
        </div>
        <Formik
          initialValues={
            editingScrap
              ? {
                  name: editingScrap?.name,
                  size: editingScrap?.size,
                  stock: editingScrap?.stock,
                }
              : initialFormValues
          }
          validationSchema={ValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
              {/* Scrap Information */}
              <div className="space-y-4 p-2 rounded-lg">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      اسم المنتج *
                    </label>
                    {errors?.name && touched?.name && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.name}
                      </div>
                    )}
                  </div>
                  <Field
                    type="text"
                    name="name"
                    placeholder="أدخل اسم المنتج"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      المقاس
                    </label>
                  </div>
                  <Field
                    type="text"
                    name="size"
                    placeholder="أدخل المقاس (اختياري)"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      الكمية *
                    </label>
                    {errors?.stock && touched?.stock && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.stock}
                      </div>
                    )}
                  </div>
                  <Field
                    type="number"
                    name="stock"
                    placeholder="أدخل الكمية"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>
              </div>

              <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                <Button
                  large
                  onClick={() => {
                    setShowModal(false);
                    setEditingScrap(null);
                  }}
                  label={"إلغاء"}
                  variant="filled"
                  rounded="xl"
                  fixedPadding="3"
                  color="danger"
                />

                <Button
                  large
                  label={editingScrap ? "تحديث" : "إضافة"}
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

      {/* sell wasted product */}
      <Modal
        bgWhite
        open={sellModal}
        setOpen={(val) => {
          if (!val) setSellModal(null);
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            بيع المنتجات التالفة
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل بيع المنتجات التالفة أدناه.
          </div>
        </div>
        <Formik
          initialValues={initialSellFormValues}
          validationSchema={sellValidationSchema}
          onSubmit={handleSellSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
              <div className="space-y-4 p-2 rounded-lg">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    المنتج *
                  </label>
                  <CustomComboBox
                    onClear={() => setFieldValue("product", null)}
                    className="!py-2.5 !border !border-gray-300 !rounded-lg"
                    isLoading={false}
                    onChange={(value) => setFieldValue("product", value)}
                    byId={true}
                    currentSelected={values.product}
                    items={scraps.map((s) => ({
                      _id: s._id,
                      name: `${s.name} - ${s.size || ""}`,
                    }))}
                    placeholder={"اختر المنتج التالف"}
                  />
                  {errors?.product && touched?.product && (
                    <div className="mt-1 text-red-500 text-sm">
                      {errors.product}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    الكمية *
                  </label>
                  <Field
                    type="number"
                    name="quantity"
                    placeholder="أدخل الكمية"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                  {errors?.quantity && touched?.quantity && (
                    <div className="mt-1 text-red-500 text-sm">
                      {errors.quantity}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    السعر *
                  </label>
                  <Field
                    type="number"
                    name="price"
                    placeholder="أدخل السعر"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                  {errors?.price && touched?.price && (
                    <div className="mt-1 text-red-500 text-sm">
                      {errors.price}
                    </div>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <PaymentMethodSelect
                    value={values.paymentMethodId}
                    onChange={(id) => setFieldValue("paymentMethodId", id)}
                    label="وسيلة الدفع"
                  />
                </div>
              </div>

              <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                <Button
                  large
                  onClick={() => setSellModal(null)}
                  label={"إلغاء"}
                  variant="filled"
                  rounded="xl"
                  fixedPadding="3"
                  color="danger"
                />
                <Button
                  large
                  label={"بيع"}
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

      <DeleteModal
        deleteReqModal={deleteModal}
        setDeleteReqModal={setDeleteModal}
        name="المنتج التالف"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* العنوان */}
      <Title
        count={scraps?.length}
        title="الخردة "
        subTitle="إدارة جميع الخردة "
        button={
          <div className="flex justify-end items-center gap-2">
            {userRole === "admin" && (
              <Button
                Icon={PlusIcon}
                onClick={() => {
                  setEditingScrap(null);
                  setShowModal(true);
                }}
                label={"إضافة منتج تالف"}
                variant="filled"
                type="primary"
                rounded="xl"
                fixedPadding="3"
              />
            )}
            {userRole === "admin" && (
              <Button
                Icon={BanknotesIcon}
                onClick={() => {
                  setSellModal(true);
                }}
                label={"بيع المنتجات التالفة"}
                variant="filled"
                type="submit"
                rounded="xl"
                fixedPadding="3"
                color="indigo"
              />
            )}
          </div>
        }
      />

      {/* Filters */}
      <FiltersCombonent
        placeholder={"أبحث بالمنتج ..."}
        searchField
        search={search}
        setSearch={setSearch}
      />

      {/* جدول التوالف */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="">
          <ContentTable
            data={scraps.map((item) => {
              return {
                _id: item?._id,
                productName: `${item?.name || "منتج"} - ${item?.size || ""}`,
                stock: item?.stock,
              };
            })}
            nodata="منتجات تالفة"
            actions={
              userRole === "admin" && [
                {
                  label: null,
                  Icon: Edit,
                  action: (item) => {
                    const fullScrap = scraps.find((s) => s._id === item._id);
                    handleEdit(fullScrap);
                  },
                  props: {
                    color: "babyBlue",
                    variant: "filled",
                    rounded: "2xl",
                  },
                },
                {
                  label: null,
                  Icon: Trash2,
                  action: (item) => {
                    setDeleteModal(item?._id);
                  },
                  props: {
                    color: "danger",
                    variant: "filled",
                    rounded: "2xl",
                  },
                },
              ]
            }
            header={["id", "إسم المنتج", "الكمية"]}
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
