"use client";
import { useEffect, useRef, useState } from "react";
import { Edit, Eye, Trash2, Wallet } from "lucide-react";
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
  name: Yup.string().required("اسم التاجر مطلوب"),
  phone: Yup.string().required("رقم الهاتف مطلوب"),
  wallet: Yup.number().typeError("يجب أن يكون رقم").default(0),
});

// Initial form values
const initialFormValues = {
  name: "",
  phone: "",
  wallet: 0,
  note: "",
};

export default function Suppliers() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [suppliers, setSuppliers] = useState([]);
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
        const { data } = await axiosClient.get(`/suppliers`, { params });

        setSuppliers(data.data);
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
      if (editingSupplier) {
        try {
          setLoadingBtn(true);
          const { data } = await axiosClient.put(
            `/suppliers/${editingSupplier._id}`,
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
          const { data } = await axiosClient.post(`/suppliers`, values);

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
      setEditingSupplier(null);
    } catch (error) {
      console.error("Error submitting supplier:", error);
    } finally {
      setShowModal(false);
      setSubmitting(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(`/suppliers/${deleteModal}`);

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

      {/*edit and add supplier modal */}
      <Modal
        bgWhite
        open={showModal}
        setOpen={(val) => {
          if (!val) setShowModal(null);
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            {editingSupplier ? "تعديل التاجر" : "إضافة تاجر جديد"}
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل التاجر أدناه ثم اضغط حفظ.
          </div>
        </div>
        <Formik
          initialValues={
            editingSupplier
              ? {
                  name: editingSupplier?.name,
                  phone: editingSupplier?.phone,
                  wallet: editingSupplier?.wallet,
                  note: editingSupplier?.note,
                }
              : initialFormValues
          }
          validationSchema={ValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
              {/* Supplier Information */}
              <div className="space-y-4 p-2 rounded-lg">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      إسم التاجر *
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
                    placeholder="أدخل إسم التاجر"
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
                      المحفظة
                    </label>
                    {errors?.wallet && touched?.wallet && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.wallet}
                      </div>
                    )}
                  </div>
                  <Field
                    disabled={editingSupplier ? true : false}
                    type="number"
                    name="wallet"
                    placeholder="أدخل محفظة التاجر"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      ملاحظات
                    </label>
                    {errors?.note && touched?.note && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.note}
                      </div>
                    )}
                  </div>
                  <Field
                    type="text"
                    name="note"
                    placeholder="أدخل ملاحظات"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>
              </div>

              <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                <Button
                  large
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
                  }}
                  label={"إلغاء"}
                  variant="filled"
                  rounded="xl"
                  fixedPadding="3"
                  color="danger"
                />

                <Button
                  large
                  label={editingSupplier ? "تحديث" : "إضافة"}
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
        name="التاجر"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* العنوان */}
      <Title
        count={suppliers?.length}
        title="التجار"
        subTitle="إدارة جميع تجار المتجر"
        button={
          userRole === "admin" && (
            <Button
              Icon={PlusIcon}
              onClick={() => {
                setEditingSupplier(null);
                setShowModal(true);
              }}
              label={"إضافة تاجر"}
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

      {/* جدول التجار */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="">
          <ContentTable
            data={suppliers.map((supplier) => {
              return {
                _id: supplier?._id,
                name: supplier?.name,
                phone: supplier?.phone,
                wallet: supplier?.wallet,
                note: supplier?.note || "لا يوجد",
              };
            })}
            nodata="التجار"
            actions={[
              userRole === "admin" && {
                label: null,
                Icon: Edit,
                action: (supplier) => {
                  const fullSupplier = suppliers.find(
                    (s) => s._id === supplier._id,
                  );
                  handleEdit(fullSupplier);
                },
                props: {
                  color: "babyBlue",
                  variant: "filled",
                  rounded: "2xl",
                },
              },
              {
                label: null,
                Icon: Eye,
                action: (supplier) => {
                  window.location.href = `/dashboard/suppliers/${supplier._id}`;
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
                action: (supplier) => {
                  setDeleteModal(supplier?._id);
                },
                props: {
                  color: "danger",
                  variant: "filled",
                  rounded: "2xl",
                },
              },
            ]}
            header={["id", "إسم التاجر", "رقم الهاتف", "المحفظة", "ملاحظات"]}
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
