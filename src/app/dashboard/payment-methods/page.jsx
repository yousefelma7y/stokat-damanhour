"use client";
import { useEffect, useState } from "react";
import {
  Edit,
  Trash2,
  CreditCard,
  Banknote,
  Wallet,
  LayoutGrid,
} from "lucide-react";
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
import { useDebounce } from "use-debounce";
import ProtectedPage from "../../../components/ProtectedPage";
import FiltersComponent from "../../../components/FiltersCombonent";

// Validation Schema
const ValidationSchema = Yup.object().shape({
  name: Yup.string().required("اسم وسيلة الدفع مطلوب"),
  type: Yup.string()
    .oneOf(["cash", "bank", "wallet", "other"], "نوع غير صالح")
    .required("نوع وسيلة الدفع مطلوب"),
  balance: Yup.number()
    .min(0, "الرصيد لا يمكن أن يكون أقل من صفر")
    .required("الرصيد مطلوب"),
});

// Initial form values
const initialFormValues = {
  name: "",
  type: "cash",
  balance: 0,
};

const getMethodIcon = (type) => {
  switch (type) {
    case "cash":
      return <Banknote className="w-4 h-4" />;
    case "bank":
      return <CreditCard className="w-4 h-4" />;
    case "wallet":
      return <Wallet className="w-4 h-4" />;
    default:
      return <LayoutGrid className="w-4 h-4" />;
  }
};

const methodTypes = [
  { value: "cash", label: "كاش", icon: Banknote },
  { value: "bank", label: "بنك", icon: CreditCard },
  { value: "wallet", label: "محفظة الكترونية", icon: Wallet },
  { value: "other", label: "أخرى", icon: LayoutGrid },
];

export default function PaymentMethods() {
  const [mounted, setMounted] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [asOfDate, setAsOfDate] = useState("");

  const [methods, setMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [message, setMessage] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const fetchData = async () => {
      try {
        const params = {
          search: searchValue,
        };
        if (asOfDate) {
          params.asOf = asOfDate;
        }
        setIsLoading(true);
        const { data } = await axiosClient.get(`/payment-methods`, { params });
        setMethods(data.data);
      } catch (error) {
        console.error(error);
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
  }, [searchValue, asOfDate, refresh, mounted]);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoadingBtn(true);
      if (editingMethod) {
        const { data } = await axiosClient.put(
          `/payment-methods/${editingMethod._id}`,
          values,
        );
        setMessage({ type: "success", message: data.message });
      } else {
        const { data } = await axiosClient.post(`/payment-methods`, values);
        setMessage({ type: "success", message: data.message });
      }
      resetForm();
      setEditingMethod(null);
      setShowModal(false);
      setRefresh(!refresh);
    } catch (error) {
      console.error(error);
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

  const handleEdit = (method) => {
    setEditingMethod(method);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(
        `/payment-methods/${deleteModal}`,
      );
      setMessage({ type: "success", message: data.message });
      setDeleteModal(false);
      setRefresh(!refresh);
    } catch (error) {
      console.error(error);
      if (error.response) {
        setMessage({ type: "error", message: error.response.data.message });
      } else {
        setMessage({ type: "error", message: error.message });
      }
    } finally {
      setLoadingBtn(false);
    }
  };

  if (!mounted) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedPage page="payment-methods">
      <div className="" dir="rtl">
        <Message message={message} setMessage={setMessage} />

        <Modal
          bgWhite
          open={showModal}
          setOpen={(val) => {
            if (!val) {
              setShowModal(false);
              setEditingMethod(null);
            }
          }}
        >
          <div>
            <div className="font-bold text-gray-900 text-2xl">
              {editingMethod ? "تعديل وسيلة الدفع" : "إضافة وسيلة دفع جديدة"}
            </div>
            <div className="text-gray-500">
              أدخل تفاصيل وسيلة الدفع (المحفظة) أدناه.
            </div>
          </div>
          <Formik
            initialValues={
              editingMethod
                ? {
                    name: editingMethod?.name,
                    type: editingMethod?.type,
                    balance: editingMethod?.balance,
                  }
                : initialFormValues
            }
            validationSchema={ValidationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ values, errors, touched, setFieldValue }) => (
              <Form className="space-y-4 mt-4 px-1">
                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    اسم الوسيلة *
                  </label>
                  <Field
                    type="text"
                    name="name"
                    placeholder="مثال: كاش، فودافون كاش، بنك مصر"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                  />
                  {errors.name && touched.name && (
                    <div className="mt-1 text-red-500 text-xs">
                      {errors.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    النوع *
                  </label>
                  <div className="gap-2 grid grid-cols-2">
                    {methodTypes.map((type) => (
                      <div
                        key={type.value}
                        onClick={() => setFieldValue("type", type.value)}
                        className={`cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${
                          values.type === type.value
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <Field
                          type="radio"
                          name="type"
                          value={type.value}
                          className="hidden"
                        />
                        <type.icon className="w-5 h-5" />
                        <span className="font-medium text-sm">
                          {type.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium text-gray-700 text-sm">
                    {editingMethod ? "الرصيد الحالي" : "الرصيد الافتتاحي"} *
                  </label>
                  <Field
                    disabled={editingMethod}
                    type="number"
                    name="balance"
                    className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full !text-end"
                  />
                  {errors.balance && touched.balance && (
                    <div className="mt-1 text-red-500 text-xs">
                      {errors.balance}
                    </div>
                  )}
                </div>

                <div dir="ltr" className="flex justify-between space-x-4 pt-4">
                  <Button
                    large
                    onClick={() => setShowModal(false)}
                    label={"إلغاء"}
                    variant="filled"
                    rounded="xl"
                    fixedPadding="3"
                    color="danger"
                  />
                  <Button
                    large
                    label={editingMethod ? "تحديث" : "إضافة"}
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
          name="وسيلة الدفع"
          deleteHandler={handleDelete}
          isLoading={loadingBtn}
        />

        <Title
          count={methods?.length}
          title="وسائل الدفع"
          subTitle="إدارة محافظ النظام وحسابات البنوك"
          button={
            <Button
              Icon={PlusIcon}
              onClick={() => {
                setEditingMethod(null);
                setShowModal(true);
              }}
              label={"إضافة وسيلة"}
              variant="filled"
              rounded="xl"
              fixedPadding="3"
            />
          }
        />

        <FiltersComponent
          placeholder={"أبحث باسـم وسيلة الدفع ..."}
          searchField
          search={search}
          setSearch={setSearch}
          asOfDate
          asOfDateValue={asOfDate}
          setAsOfDateValue={setAsOfDate}
        />

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="">
            <ContentTable
              data={methods.map((method) => ({
                _id: method._id,
                name: (
                  <div className="flex justify-center items-center gap-2">
                    {getMethodIcon(method.type)}
                    <span>{method.name}</span>
                  </div>
                ),
                type:
                  methodTypes.find((t) => t.value === method.type)?.label ||
                  method.type,
                balance: (
                  <span
                    className={`font-bold ${asOfDate ? "text-amber-600" : "text-indigo-600"}`}
                  >
                    {Number(
                      asOfDate && method.balanceAtDate !== undefined
                        ? method.balanceAtDate
                        : method.balance,
                    ).toLocaleString()}{" "}
                    {"\u062c.\u0645"}
                  </span>
                ),
                createdAt: new Date(method.createdAt).toLocaleDateString(
                  "ar-EG",
                ),
              }))}
              nodata="وسائل دفع"
              actions={[
                {
                  label: null,
                  Icon: Edit,
                  action: (method) =>
                    handleEdit(methods.find((m) => m._id === method._id)),
                  props: {
                    color: "babyBlue",
                    variant: "filled",
                    rounded: "2xl",
                  },
                },
                {
                  label: null,
                  Icon: Trash2,
                  action: (method) => setDeleteModal(method._id),
                  props: { color: "danger", variant: "filled", rounded: "2xl" },
                },
              ]}
              header={[
                "id",
                "\u0627\u0644\u0627\u0633\u0645",
                "\u0627\u0644\u0646\u0648\u0639",
                asOfDate
                  ? "\u0627\u0644\u0631\u0635\u064a\u062f (\u062d\u062a\u0649 \u0627\u0644\u062a\u0627\u0631\u064a\u062e)"
                  : "\u0627\u0644\u0631\u0635\u064a\u062f",
                "\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0636\u0627\u0641\u0629",
              ]}
              hidePagination={true}
            />
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
