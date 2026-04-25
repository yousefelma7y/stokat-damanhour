"use client";

import { useEffect, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { PlusIcon } from "@heroicons/react/24/outline";
import * as Yup from "yup";
import Message from "@/components/Message";
import Title from "@/components/Title";
import Button from "@/components/Button";
import DeleteModal from "@/components/DeleteModal";
import ContentTable from "@/components/contentTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import FiltersCombonent from "@/components/FiltersCombonent";
import WeightProductsModal from "@/components/weight-products/WeightProductsModal";
import PermissionGate from "@/components/PermissionGate";
import ProtectedPage from "@/components/ProtectedPage";
import { usePermissions } from "@/hooks/usePermissions";
import axiosClient from "@/lib/axios-client";
import Cookies from "js-cookie";
import { useDebounce } from "use-debounce";

const validationSchema = Yup.object().shape({
  name: Yup.string().required("اسم الصنف مطلوب").min(2, "الاسم قصير جداً"),
  pricePerKg: Yup.number().required("سعر الكيلو مطلوب").min(0, "يجب أن يكون رقم موجب"),
});

export default function WeightProductsPage() {
  const [userRole, setUserRole] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [message, setMessage] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [searchValue] = useDebounce(search, 500);
  const { canPerformAction } = usePermissions();

  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data } = await axiosClient.get("/weight-products", {
          params: { page, limit, search: searchValue },
        });
        setProducts(data.data || []);
        setTotalPages(data.pages || 1);
      } catch (error) {
        setMessage({
          type: "error",
          message: error.response?.data?.message || "فشل تحميل أصناف الوزن",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, limit, searchValue, refresh]);

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      setLoadingBtn(true);
      const payload = {
        ...values,
        pricePerKg: Number(values.pricePerKg),
      };

      if (editingProduct) {
        await axiosClient.put(`/weight-products/${editingProduct._id}`, payload);
        setMessage({ type: "success", message: "تم تحديث صنف الوزن بنجاح" });
      } else {
        await axiosClient.post("/weight-products", payload);
        setMessage({ type: "success", message: "تم إضافة صنف الوزن بنجاح" });
      }

      resetForm();
      setEditingProduct(null);
      setShowModal(false);
      setRefresh((value) => !value);
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل حفظ صنف الوزن",
      });
    } finally {
      setLoadingBtn(false);
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      await axiosClient.delete(`/weight-products/${deleteModal}`);
      setMessage({ type: "success", message: "تم حذف صنف الوزن بنجاح" });
      setRefresh((value) => !value);
    } catch (error) {
      setMessage({
        type: "error",
        message: error.response?.data?.message || "فشل حذف صنف الوزن",
      });
    } finally {
      setDeleteModal(false);
      setLoadingBtn(false);
    }
  };

  return (
    <ProtectedPage page="weight-products">
      <div dir="rtl">
        <Message message={message} setMessage={setMessage} />

        <WeightProductsModal
          showModal={showModal}
          setShowModal={setShowModal}
          editingProduct={editingProduct}
          validationSchema={validationSchema}
          handleSubmit={handleSubmit}
          loadingBtn={loadingBtn}
        />

        <DeleteModal
          deleteReqModal={deleteModal}
          setDeleteReqModal={setDeleteModal}
          name="صنف الوزن"
          deleteHandler={handleDelete}
          isLoading={loadingBtn}
        />

        <Title
          count={products.length}
          title="الوزن"
          subTitle="إدارة الأصناف المباعة بالكيلو"
          button={
            userRole === "admin" && (
              <PermissionGate page="weight-products" action="create">
                <Button
                  Icon={PlusIcon}
                  onClick={() => {
                    setEditingProduct(null);
                    setShowModal(true);
                  }}
                  label="إضافة صنف وزن"
                  variant="filled"
                  rounded="xl"
                  fixedPadding="3"
                />
              </PermissionGate>
            )
          }
        />

        <FiltersCombonent
          placeholder="ابحث بالاسم أو الكود..."
          searchField
          search={search}
          setSearch={setSearch}
        />

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <ContentTable
            data={products.map((product) => ({
              _id: product._id,
              name: product.name,
              pricePerKg: `${product.pricePerKg} ج/كجم`,
            }))}
            nodata="أصناف الوزن"
            actions={[
              ...(canPerformAction("weight-products", "edit")
                ? [
                    {
                      label: null,
                      Icon: Edit,
                      action: (row) => {
                        const fullProduct = products.find((item) => item._id === row._id);
                        setEditingProduct(fullProduct);
                        setShowModal(true);
                      },
                      props: { color: "babyBlue", variant: "filled", rounded: "2xl" },
                    },
                  ]
                : []),
              ...(canPerformAction("weight-products", "delete")
                ? [
                    {
                      label: null,
                      Icon: Trash2,
                      action: (row) => setDeleteModal(row._id),
                      props: { color: "danger", variant: "filled", rounded: "2xl" },
                    },
                  ]
                : []),
            ]}
            header={["الكود", "الاسم", "سعر الكيلو"]}
            totalPages={totalPages}
            page={page}
            setPage={setPage}
            setLimit={setLimit}
            limit={limit}
          />
        )}
      </div>
    </ProtectedPage>
  );
}
