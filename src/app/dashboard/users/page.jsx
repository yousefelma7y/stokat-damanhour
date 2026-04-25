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

// Validation Schema
const ValidationSchema = Yup.object().shape({
  userName: Yup.string().required("اسم العميل مطلوب"),
  phone: Yup.string().required("رقم الهاتف مطلوب"),
  role: Yup.string().required("الوظيفة مطلوبة"),
  location: Yup.string().required("الموقع مطلوب"),
  salary: Yup.string().required("الراتب مطلوب"),
  // password: Yup.string().required("كلمة المرور مطلوبة"),
});

// Initial form values
const initialFormValues = {
  userName: "",
  phone: "",
  role: "",
  brandName: "Stockat Damanhour",
  logo: "",
  location: "",
  salary: "",
  password: "",
};

export default function Users() {
  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const dateInputRef = useRef(null);

  // filters
  const [filtersLoading, setFiltersLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [roleFilter, setRoleFilter] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [refetsh, setRefetsh] = useState(false);
  const [message, setMessage] = useState(false);

  useEffect(() => {
    setPage(1);
    setRefetsh(!refetsh);
  }, [limit, searchValue, roleFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {
          page: page,
          limit: limit,
          search: searchValue,
          role: roleFilter,
        };
        setIsLoading(true);
        const { data } = await axiosClient.get(`/users`, { params });
        console.log(data.data);
        setUsers(data.data);
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
    console.log(values, editingCustomer);
    try {
      if (editingCustomer) {
        try {
          setLoadingBtn(true);
          const { data } = await axiosClient.put(
            `/users/${editingCustomer._id}`,
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
          const { data } = await axiosClient.post(`/users`, values);

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
      console.error("Error submitting order:", error);
    } finally {
      setShowModal(false);
      setSubmitting(false);
    }
  };

  const handleEdit = (order) => {
    setEditingCustomer(order);
    setShowModal(true);
  };

  const handleDelete = async () => {
    // Handle delete logic here
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(`/users/${deleteModal}`);

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

      {/*edit and add order modal */}
      <Modal
        bgWhite
        open={showModal}
        setOpen={(val) => {
          if (!val) setShowModal(null);
        }}
      >
        <div>
          <div className="font-bold text-gray-900 text-2xl">
            {editingCustomer ? "تعديل المستخدم" : "إضافة مستخدم جديد"}
          </div>
          <div className="text-gray-500">
            أدخل تفاصيل المستخدم أدناه ثم اضغط حفظ.
          </div>
        </div>
        <Formik
          initialValues={
            editingCustomer
              ? {
                  userName: editingCustomer?.userName,
                  phone: editingCustomer?.phone,
                  role: editingCustomer?.role,
                  location: editingCustomer?.location,
                  salary: editingCustomer?.salary,
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
                      إسم المستخدم *
                    </label>
                    {errors?.userName && touched?.userName && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.userName}
                      </div>
                    )}
                  </div>

                  <Field
                    type="text"
                    name="userName"
                    placeholder="أدخل إسم المستخدم"
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
                        placeholder="أدخل رقم الهاتف "
                        onChange={(e) => {
                          // Allow only numbers
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
                      الوظيفة *
                    </label>
                    {errors?.role && touched?.role && (
                      <div className="mt-1 text-red-500 text-sm">
                        {errors.role}
                      </div>
                    )}
                  </div>
                  <Field
                    as="select"
                    name={`role`}
                    className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  >
                    <option value="">اختر الوظيفة</option>
                    <option value="admin">مدير</option>
                    <option value="cashier">بائع</option>
                  </Field>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      عنوان المستخدم *
                    </label>
                  </div>

                  <Field
                    type="text"
                    name="location"
                    placeholder="أدخل عنوان المستخدم"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-medium text-gray-700 text-sm">
                      الراتب *
                    </label>
                  </div>

                  <Field
                    type="number"
                    name="salary"
                    placeholder="أدخل الراتب "
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                </div>

                {!editingCustomer && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block font-medium text-gray-700 text-sm">
                        كلمة المرور *
                      </label>
                      {errors?.password && touched?.password && (
                        <div className="mt-1 text-red-500 text-sm">
                          {errors.password}
                        </div>
                      )}
                    </div>

                    <Field
                      type="password"
                      name="password"
                      className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                    />
                  </div>
                )}
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
        name="المستخدم"
        deleteHandler={handleDelete}
        isLoading={loadingBtn}
      />

      {/* العنوان */}
      <Title
        count={users?.length}
        title="المستخدمين"
        subTitle="إدارة جميع مستخدمين المتجر"
        button={
          <Button
            Icon={PlusIcon}
            onClick={() => {
              setEditingCustomer(null);
              setShowModal(true);
            }}
            label={"إضافة مستخدم"}
            variant="filled"
            type="submit"
            rounded="xl"
            fixedPadding="3"
          />
        }
      />

      {/* Filters */}
      <FiltersCombonent
        placeholder={"أبحث بالإسم او برقم الهاتف ..."}
        searchField
        search={search}
        setSearch={setSearch}
        comboboxsLoading={filtersLoading}
        comboBoxes={[
          {
            placeholder: "اختر الوظيفة",
            value: roleFilter,
            onChange: setRoleFilter,
            items: [
              {
                _id: "admin",
                name: "مدير",
              },
              {
                _id: "cashier",
                name: "بائع",
              },
            ],
            byId: true,
          },
        ]}
      />

      {/* جدول العملاء */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="">
          <ContentTable
            data={users.map((user) => {
              return {
                _id: user?._id,
                username: user?.userName,
                phone: user?.phone,
                role:
                  user?.role == "admin"
                    ? "مدير"
                    : user?.role == "cashier"
                      ? "بائع"
                      : "مستخدم قديم",
                location: user?.location,
                salary: user?.salary,
              };
            })}
            nodata="مستخدمين"
            actions={[
              {
                label: null,
                Icon: Edit,
                action: (customer) => {
                  // Find the full order object from the orders array
                  const fullOrder = users.find((o) => o._id === customer._id);
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
            // ignore={["_id"]}
            header={[
              "id",
              "إسم المستخدم",
              "رقم الهاتف",
              "الوظيفة",
              "ألعنوان",
              "الراتب",
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
