"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, QrCode, X } from "lucide-react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import Button from "../../../components/Button";
import { PlusIcon } from "@heroicons/react/24/outline";
import ContentTable from "../../../components/contentTable";
import Title from "../../../components/Title";
import DeleteModal from "../../../components/DeleteModal";
import JsBarcode from "jsbarcode";
import axiosClient from "../../../lib/axios-client";
import LoadingSpinner from "../../../components/LoadingSpinner";
import Message from "../../../components/Message";
import FiltersCombonent from "../../../components/FiltersCombonent";
import { useDebounce } from "use-debounce";
import Cookies from "js-cookie";
import ProtectedPage from "../../../components/ProtectedPage";
import PermissionGate from "../../../components/PermissionGate";
import { usePermissions } from "../../../hooks/usePermissions";

import ProductsModal from "../../../components/products/ProductsModal";

// Validation Schema
const productValidationSchema = Yup.object().shape({
  name: Yup.string().required("اسم المنتج مطلوب").min(3, "الاسم قصير جداً"),
  price: Yup.number().required("سعر البيع مطلوب").typeError("يجب أن يكون رقم"),
  stock: Yup.number().required("الكمية مطلوبة").typeError("يجب أن يكون رقم"),
});

// Initial form values
const initialFormValues = {
  name: "",
  model: "",
  size: "",
  price: "",
  stock: "",
};

export default function Products() {
  const [userRole, setUserRole] = useState(null);
  useEffect(() => {
    setUserRole(Cookies.get("role"));
  }, []);

  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [stockStatus, setStockStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [refetsh, setRefetsh] = useState(true);
  const [message, setMessage] = useState(false);

  const { canPerformAction } = usePermissions();

  useEffect(() => {
    setPage(1);
    setRefetsh(!refetsh);
  }, [limit, searchValue, stockStatus]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {
          page: page,
          limit: limit,
          search: searchValue,
          stockStatus: stockStatus,
        };
        setIsLoading(true);
        const { data } = await axiosClient.get(`/products`, { params });
        setProducts(data.data);
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
      const productData = {
        ...values,
        price: Number(values.price),
        stock: Number(values.stock),
      };

      if (editingProduct) {
        try {
          setLoadingBtn(true);
          const { data } = await axiosClient.put(
            `/products/${editingProduct._id}`,
            productData,
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
          const { data } = await axiosClient.post(`/products`, productData);
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
      }

      resetForm();
      setEditingProduct(null);
    } catch (error) {
      console.error("Error submitting product:", error);
    } finally {
      setShowModal(false);
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      setLoadingBtn(true);
      const { data } = await axiosClient.delete(`/products/${deleteModal}`);
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
      setDeleteModal(false);
      setLoadingBtn(false);
    }
  };

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[char] || char;
    });

  const printProductLabel = (product) => {
    const cleanValue = (value) => {
      const text = String(value || "").trim();
      return text && text !== "-" ? text : "";
    };

    const barcodeValue = String(product?.barcode || product?._id || "").trim();
    const primaryLine = [cleanValue(product?.name), cleanValue(product?.size)]
      .filter(Boolean)
      .join(" / ");

    if (!barcodeValue) {
      setMessage({
        type: "error",
        message: "لا يوجد باركود صالح للطباعة لهذا المنتج",
      });
      return;
    }

    const barcodeSvg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

    JsBarcode(barcodeSvg, barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 10,
      margin: 0,
      background: "#ffffff",
      lineColor: "#000000",
    });

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>Print Barcode - ${escapeHtml(primaryLine || product?.name || "Product")}</title>
        <style>
          @page {
            size: 57mm 40mm;
            margin: 0;
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          html, body {
            width: 57mm !important;
            height: 40mm !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff;
          }

          .label-container {
            width: 57mm;
            height: 40mm;
            position: absolute;
            top: 0;
            left: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 1mm 1.5mm;
            gap: 1.5mm;
          }

          .line-primary {
            font-size: 13pt;
            font-weight: bold;
            font-family: 'Arial', sans-serif;
            text-align: center;
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
          }

          .barcode-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .barcode-svg {
            display: block;
            width: 100%;
            height: 22mm;
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="line-primary">${escapeHtml(primaryLine)}</div>
          <div class="barcode-wrapper">
            ${barcodeSvg.outerHTML.replace("<svg", '<svg class="barcode-svg"')}
          </div>
        </div>
      </body>
      </html>
    `);
    iframeDoc.close();

    const cleanup = () => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    };

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      iframe.contentWindow.onafterprint = cleanup;
      setTimeout(cleanup, 1000);
    }, 250);
  };

  return (
    <ProtectedPage page="products">
      <div className="" dir="rtl">
        <Message message={message} setMessage={setMessage} />

        {/* Add/Edit Product Modal */}
        <ProductsModal
          showModal={showModal}
          setShowModal={setShowModal}
          editingProduct={editingProduct}
          productValidationSchema={productValidationSchema}
          handleSubmit={handleSubmit}
          setEditingProduct={setEditingProduct}
          loadingBtn={loadingBtn}
          initialFormValues={initialFormValues}
          isLoading={isLoading}
        />

        <DeleteModal
          deleteReqModal={deleteModal}
          setDeleteReqModal={setDeleteModal}
          name="المنتج"
          deleteHandler={handleDelete}
          isLoading={loadingBtn}
        />

        {/* Title */}
        <Title
          count={products?.length}
          title="المنتجات"
          subTitle="إدارة جميع منتجات المتجر"
          button={
            userRole === "admin" && (
              <PermissionGate page="products" action="create">
                <Button
                  Icon={PlusIcon}
                  onClick={() => {
                    setEditingProduct(null);
                    setShowModal(true);
                  }}
                  label={"إضافة منتج"}
                  variant="filled"
                  type="submit"
                  rounded="xl"
                  fixedPadding="3"
                />
              </PermissionGate>
            )
          }
        />

        {/* Filters */}
        <FiltersCombonent
          placeholder={"أبحث بالإسم او بالنوع او بكود المنتج ..."}
          searchField
          search={search}
          setSearch={setSearch}
          comboBoxes={[
            {
              placeholder: "حالة المخزون",
              value:
                stockStatus === "all"
                  ? "الكل"
                  : stockStatus === "inStock"
                    ? "متوفر"
                    : stockStatus === "outOfStock"
                      ? "نفذت الكمية"
                      : stockStatus,
              onChange: (val) => {
                if (val === "الكل") setStockStatus("all");
                else if (val === "متوفر") setStockStatus("inStock");
                else if (val === "نفذت الكمية") setStockStatus("outOfStock");
                else setStockStatus("all");
              },
              items: ["الكل", "متوفر", "نفذت الكمية"],
            },
          ]}
        />

        {/* Products Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="">
            <ContentTable
              data={products.map((product) => {
                return {
                  _id: product?._id,
                  name: product?.name,
                  model: product?.model || "-",
                  size: product?.size || "-",
                  barcode: product?.barcode || "",
                  stock: product?.stock,
                  pricePreview: (
                    <div className="flex justify-start md:justify-center items-center space-x-1">
                      <span className="font-semibold text-green-600">
                        {product?.price || 0}
                      </span>
                      <span className="font-semibold text-green-600">ج</span>
                    </div>
                  ),
                  price: product?.price,
                };
              })}
              ignore={["price", "barcode"]}
              nodata="منتجات"
              actions={[
                {
                  label: null,
                  Icon: QrCode,
                  action: (product) => printProductLabel(product),
                  props: {
                    variant: "filled",
                    rounded: "2xl",
                  },
                },
                // Conditionally add edit action if user has permission
                ...(canPerformAction("products", "edit")
                  ? [
                    userRole === "admin" && {
                      label: null,
                      Icon: Edit,
                      action: (product) => {
                        const fullProduct = products.find(
                          (p) => p._id === product._id,
                        );
                        handleEdit(fullProduct);
                      },
                      props: {
                        color: "babyBlue",
                        variant: "filled",
                        rounded: "2xl",
                      },
                    },
                  ]
                  : []),
                // Conditionally add delete action if user has permission
                ...(canPerformAction("products", "delete")
                  ? [
                    userRole === "admin" && {
                      label: null,
                      Icon: Trash2,
                      action: (product) => {
                        setDeleteModal(product?._id);
                      },
                      props: {
                        color: "danger",
                        variant: "filled",
                        rounded: "2xl",
                      },
                    },
                  ]
                  : []),
              ]}
              header={[
                "id",
                "إسم المنتج",
                "النوع",
                "المقاس",
                "الكمية",
                "سعر البيع",
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
    </ProtectedPage>
  );
}
