"use client";
import { useEffect, useRef, useState } from "react";
import { Edit, Eye, Trash2 } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import { PlusIcon } from "@heroicons/react/24/outline";
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
import Cookies from "js-cookie";

// Validation Schema
const ValidationSchema = Yup.object().shape({
  name: Yup.string().required("اسم العميل مطلوب"),
  phone: Yup.string().required("رقم الهاتف مطلوب"),
  location: Yup.string().required("العنوان مطلوب"),
});

// Initial form values
const initialFormValues = {
  name: "",
  phone: "",
  location: "",
};

export default function Customers() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [customers, setCustomers] = useState([]);
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
        const { data } = await axiosClient.get(`/customers`, { params });

        setCustomers(data.data);
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
      if (editingCustomer) {
        try {
          setLoadingBtn(true);
          const { data } = await axiosClient.put(
            `/customers/${editingCustomer._id}`,
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
          const { data } = await axiosClient.post(`/customers`, values);

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
      setEditingCustomer(null);
    } catch (error) {
      console.error("Error submitting customer:", error);
    } finally {
      setShowModal(false);
      setSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(`/customers/${deleteModal}`);

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

  return (
    <div className="" dir="rtl">
      <Message message={message} setMessage={setMessage} />

      {/*edit and add customer modal */}
      <Modal
        bgWhite
        open={showModal}
        setOpen={(val) => {
          if (!val) setShowModal(null);
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            {editingCustomer ? "تعديل العميل" : "إضافة عميل جديد"}
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل العميل أدناه ثم اضغط حفظ.
          </div>
        </div>
        <Formik
          initialValues={
            editingCustomer
              ? {
                  name: editingCustomer?.name,
                  phone: editingCustomer?.phone,
                  location: editingCustomer?.location,
                }
              : initialFormValues
          }
          validationSchema={ValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
              {/* Customer Information */}
              <div className="space-y-4 p-2 rounded-lg">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      إسم العميل *
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
                    placeholder="أدخل إسم العميل"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      رقم الهاتف *
                    </label>
                    {errors?.phone && touched?.phone && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.phone}
                      </div>
                    )}
                  </div>
                  <Field name="phone">
                    {({ field, form }) => (
                      <input
                        {...field}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="أدخل رقم الهاتف"
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          form.setFieldValue(field.name, value);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full !text-end"
                      />
                    )}
                  </Field>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      العنوان *
                    </label>
                    {errors?.location && touched?.location && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.location}
                      </div>
                    )}
                  </div>

                  <Field
                    type="text"
                    name="location"
                    placeholder="أدخل عنوان العميل"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>
              </div>

              <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                <Button
                  large
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                  }}
                  label={"إلغاء"}
                  variant="filled"
                  rounded="xl"
                  fixedPadding="3"
                  color="danger"
                />

                <Button
                  large
                  label={editingCustomer ? "تحديث" : "إضافة"}
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
        name="العميل"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* العنوان */}
      <Title
        count={customers?.length}
        title="العملاء"
        subTitle="إدارة جميع عملاء المتجر"
        button={
          (userRole === "admin" || userRole === "cashier") && (
            <Button
              Icon={PlusIcon}
              onClick={() => {
                setEditingCustomer(null);
                setShowModal(true);
              }}
              label={"إضافة عميل"}
              variant="filled"
              type="submit"
              rounded="xl"
              fixedPadding="3"
            />
          )
        }
      />

      {/* Filters */}
      <FiltersCombonent
        placeholder={"أبحث بالإسم او برقم الهاتف ..."}
        searchField
        search={search}
        setSearch={setSearch}
      />

      {/* جدول العملاء */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="">
          <ContentTable
            data={customers.map((customer) => {
              return userRole === "admin"
                ? {
                    _id: customer?._id,
                    name: customer?.name,
                    phone: customer?.phone,
                    location: customer?.location || "لا يوجد",
                    completedOrders: customer?.completedOrders?.length || 0,
                    totalPayments: customer?.totalPayments || 0,
                  }
                : {
                    _id: customer?._id,
                    name: customer?.name,
                    phone: customer?.phone,
                    location: customer?.location || "لا يوجد",
                  };
            })}
            nodata="عملاء"
            actions={[
              (userRole === "admin" || userRole === "cashier") && {
                label: null,
                Icon: Edit,
                action: (customer) => {
                  const fullCustomer = customers.find(
                    (c) => c._id === customer._id,
                  );
                  handleEdit(fullCustomer);
                },
                props: {
                  color: "babyBlue",
                  variant: "filled",
                  rounded: "2xl",
                },
              },
              (userRole === "admin" || userRole === "accountant") && {
                label: null,
                Icon: Eye,
                action: (customer) => {
                  window.location.href = `/dashboard/customers/${customer._id}`;
                },
                props: {
                  color: "green",
                  variant: "filled",
                  rounded: "2xl",
                },
              },
              userRole === "admin" && {
                label: null,
                Icon: Trash2,
                action: (customer) => {
                  setDeleteModal(customer?._id);
                },
                props: {
                  color: "danger",
                  variant: "filled",
                  rounded: "2xl",
                },
              },
            ]}
            header={
              userRole === "admin"
                ? [
                    "id",
                    "إسم العميل",
                    "رقم الهاتف",
                    "العنوان",
                    "عدد الطلبات",
                    "المدفوعات",
                  ]
                : ["id", "إسم العميل", "رقم الهاتف", "العنوان"]
            }
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
