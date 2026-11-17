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

// Validation Schema (password is only required when creating a new user)
const getValidationSchema = (isEdit) =>
  Yup.object().shape({
    userName: Yup.string()
      .trim()
      .required("اسم المستخدم مطلوب")
      .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
    phone: Yup.string()
      .required("رقم الهاتف مطلوب")
      .matches(/^01[0-9]{9}$/, "رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01"),
    role: Yup.string().required("الوظيفة مطلوبة"),
    location: Yup.string().trim().required("العنوان مطلوب"),
    salary: Yup.number()
      .typeError("الراتب يجب أن يكون رقم")
      .required("الراتب مطلوب")
      .min(0, "الراتب لا يمكن أن يكون سالب"),
    password: isEdit
      ? Yup.string()
      : Yup.string()
          .required("كلمة المرور مطلوبة")
          .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  });

const FIELD_LABELS = {
  userName: "إسم المستخدم",
  phone: "رقم الهاتف",
  role: "الوظيفة",
  location: "العنوان",
  salary: "الراتب",
  password: "كلمة المرور",
};

const inputClass = (hasError) =>
  `px-4 py-2 border rounded-lg outline-none focus:ring-2 w-full ${
    hasError
      ? "border-red-500 bg-red-50 focus:ring-red-400"
      : "border-gray-300 focus:ring-indigo-500"
  }`;

const FieldError = ({ name, errors, touched, submitCount }) => {
  const show = errors?.[name] && (touched?.[name] || submitCount > 0);
  if (!show) return null;
  return <div className="mt-1 text-red-500 text-sm">{errors[name]}</div>;
};

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

  const handleSubmit = async (
    values,
    { setSubmitting, resetForm, setErrors, setStatus },
  ) => {
    setStatus(null);
    setLoadingBtn(true);
    try {
      const payload = { ...values, salary: Number(values.salary) };
      if (editingCustomer && !payload.password) delete payload.password;

      const { data } = editingCustomer
        ? await axiosClient.put(`/users/${editingCustomer._id}`, payload)
        : await axiosClient.post(`/users`, payload);

      setMessage({ type: "success", message: data.message });
      resetForm();
      setEditingCustomer(null);
      setShowModal(false);
      setRefetsh((prev) => !prev);
    } catch (error) {
      console.log(error);
      const res = error?.response?.data;
      // Show field-level errors returned by the server (e.g. duplicate username)
      if (res?.errors) setErrors(res.errors);
      const msg = res?.message || error?.message || "حدث خطأ غير متوقع";
      setStatus({ serverError: res?.errors ? null : msg });
      setMessage({ type: "error", message: msg });
      // keep the modal open so the user can fix the errors
    } finally {
      setLoadingBtn(false);
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
          if (!val) {
            setShowModal(false);
            setEditingCustomer(null);
          }
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
                  userName: editingCustomer?.userName ?? "",
                  phone: editingCustomer?.phone ?? "",
                  role: editingCustomer?.role ?? "",
                  location: editingCustomer?.location ?? "",
                  salary: editingCustomer?.salary ?? "",
                  password: "",
                }
              : initialFormValues
          }
          validationSchema={getValidationSchema(!!editingCustomer)}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ errors, touched, submitCount, status }) => {
            const errProps = { errors, touched, submitCount };
            const hasErr = (name) =>
              !!errors?.[name] && (!!touched?.[name] || submitCount > 0);
            const errorEntries = Object.entries(errors || {}).filter(
              ([, v]) => typeof v === "string",
            );
            return (
              <Form
                noValidate
                className="space-y-4 mt-4 px-1 max-h-[80vh] overflow-y-auto"
              >
                {/* Errors summary */}
                {(submitCount > 0 && errorEntries.length > 0) ||
                status?.serverError ? (
                  <div className="bg-red-50 p-3 border border-red-300 rounded-lg text-red-700 text-sm">
                    <div className="mb-1 font-bold">
                      يرجى تصحيح الأخطاء التالية:
                    </div>
                    <ul className="space-y-1 pr-5 list-disc">
                      {status?.serverError && <li>{status.serverError}</li>}
                      {submitCount > 0 &&
                        errorEntries.map(([field, msg]) => (
                          <li key={field}>
                            <span className="font-semibold">
                              {FIELD_LABELS[field] || field}:
                            </span>{" "}
                            {msg}
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}

                {/* Customer Information */}
                <div className="space-y-4 p-2 rounded-lg">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block font-medium text-gray-700 text-sm">
                        إسم المستخدم *
                      </label>
                      <FieldError name="userName" {...errProps} />
                    </div>

                    <Field
                      type="text"
                      name="userName"
                      placeholder="أدخل إسم المستخدم"
                      className={inputClass(hasErr("userName"))}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block font-medium text-gray-700 text-sm">
                        رقم الهاتف *
                      </label>
                      <FieldError name="phone" {...errProps} />
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
                          maxLength={11}
                          className={`${inputClass(hasErr("phone"))} !text-end`}
                        />
                      )}
                    </Field>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block font-medium text-gray-700 text-sm">
                        الوظيفة *
                      </label>
                      <FieldError name="role" {...errProps} />
                    </div>
                    <Field
                      as="select"
                      name={`role`}
                      className={inputClass(hasErr("role"))}
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
                      <FieldError name="location" {...errProps} />
                    </div>

                    <Field
                      type="text"
                      name="location"
                      placeholder="أدخل عنوان المستخدم"
                      className={inputClass(hasErr("location"))}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block font-medium text-gray-700 text-sm">
                        الراتب *
                      </label>
                      <FieldError name="salary" {...errProps} />
                    </div>

                    <Field
                      type="number"
                      name="salary"
                      placeholder="أدخل الراتب "
                      min="0"
                      className={inputClass(hasErr("salary"))}
                    />
                  </div>

                  {!editingCustomer && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block font-medium text-gray-700 text-sm">
                          كلمة المرور *
                        </label>
                        <FieldError name="password" {...errProps} />
                      </div>

                      <Field
                        type="password"
                        name="password"
                        placeholder="6 أحرف على الأقل"
                        className={inputClass(hasErr("password"))}
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
            );
          }}
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
