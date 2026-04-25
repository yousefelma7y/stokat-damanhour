"use client";
import { useEffect, useRef, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
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
  name: Yup.string().required("اسم الخدمة مطلوب"),
  price: Yup.number().required("السعر مطلوب").typeError("يجب أن يكون رقم"),
  description: Yup.string(),
});

// Initial form values
const initialFormValues = {
  name: "",
  price: "",
  description: "",
};

export default function Services() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  const [services, setServices] = useState([]);
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
        const { data } = await axiosClient.get(`/services`, { params });

        setServices(data.data);
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
      if (editingService) {
        try {
          setLoadingBtn(true);
          const { data } = await axiosClient.put(
            `/services/${editingService._id}`,
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
          const { data } = await axiosClient.post(`/services`, values);

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
      setEditingService(null);
    } catch (error) {
      console.error("Error submitting service:", error);
    } finally {
      setShowModal(false);
      setSubmitting(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(`/services/${deleteModal}`);

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

      {/*edit and add service modal */}
      <Modal
        bgWhite
        open={showModal}
        setOpen={(val) => {
          if (!val) setShowModal(null);
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            {editingService ? "تعديل الخدمة" : "إضافة خدمة جديدة"}
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل الخدمة أدناه ثم اضغط حفظ.
          </div>
        </div>
        <Formik
          initialValues={
            editingService
              ? {
                  name: editingService?.name,
                  price: editingService?.price,
                  description: editingService?.description || "",
                }
              : initialFormValues
          }
          validationSchema={ValidationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, isSubmitting, setFieldValue }) => (
            <Form className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto">
              {/* Service Information */}
              <div className="space-y-4 p-2 rounded-lg">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      إسم الخدمة *
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
                    placeholder="أدخل إسم الخدمة"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      سعر الخدمة *
                    </label>
                    {errors?.price && touched?.price && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.price}
                      </div>
                    )}
                  </div>
                  <Field
                    type="number"
                    name="price"
                    placeholder="أدخل سعر الخدمة"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      الوصف
                    </label>
                    {errors?.description && touched?.description && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.description}
                      </div>
                    )}
                  </div>
                  <Field
                    as="textarea"
                    name="description"
                    placeholder="أدخل وصف الخدمة"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>
              </div>

              <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                <Button
                  large
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                  }}
                  label={"إلغاء"}
                  variant="filled"
                  rounded="xl"
                  fixedPadding="3"
                  color="danger"
                />

                <Button
                  large
                  label={editingService ? "تحديث" : "إضافة"}
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
        name="الخدمة"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* العنوان */}
      <Title
        count={services?.length}
        title="الخدمات"
        subTitle="إدارة جميع الخدمات"
        button={
          userRole === "admin" && (
            <div className="flex justify-end items-center gap-2">
              <Button
                Icon={PlusIcon}
                onClick={() => {
                  setEditingService(null);
                  setShowModal(true);
                }}
                label={"إضافة خدمة"}
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
        placeholder={"أبحث بالإسم ..."}
        searchField
        search={search}
        setSearch={setSearch}
      />

      {/* جدول الخدمات */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="">
          <ContentTable
            data={services.map((service) => {
              return {
                _id: service?._id,
                name: service?.name,
                price: service?.price || "0",
                description: service?.description || "لا يوجد",
              };
            })}
            nodata="خدمات"
            actions={
              userRole === "admin"
                ? [
                    {
                      label: null,
                      Icon: Edit,
                      action: (service) => {
                        const fullService = services.find(
                          (s) => s._id === service._id,
                        );
                        handleEdit(fullService);
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
                      action: (service) => {
                        setDeleteModal(service?._id);
                      },
                      props: {
                        color: "danger",
                        variant: "filled",
                        rounded: "2xl",
                      },
                    },
                  ]
                : []
            }
            header={["id", "إسم الخدمة", "سعر الخدمة", "الوصف"]}
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
