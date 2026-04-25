import Modal from "../Modal";
import Button from "../Button";
import { Field, Form, Formik } from "formik";

const WeightProductsModal = ({
  showModal,
  setShowModal,
  editingProduct,
  validationSchema,
  handleSubmit,
  loadingBtn,
}) => {
  return (
    <Modal
      bgWhite
      open={showModal}
      setOpen={(val) => {
        if (!val) setShowModal(false);
      }}
    >
      <div>
        <div className="font-bold text-gray-900 text-2xl">
          {editingProduct ? "تعديل صنف وزن" : "إضافة صنف وزن"}
        </div>
        <div className="text-gray-500">
          أدخل تفاصيل الصنف المباع بالوزن ثم اضغط حفظ.
        </div>
      </div>

      <Formik
        initialValues={{
          name: editingProduct?.name || "",
          pricePerKg: editingProduct?.pricePerKg || "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ errors, touched }) => (
          <Form className="space-y-4 mt-4">
            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                اسم الصنف
              </label>
              <Field
                type="text"
                name="name"
                className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              />
              {errors.name && touched.name && (
                <div className="mt-1 text-red-500 text-sm">{errors.name}</div>
              )}
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                سعر الكيلو
              </label>
              <Field
                type="number"
                step="0.01"
                name="pricePerKg"
                className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              />
              {errors.pricePerKg && touched.pricePerKg && (
                <div className="mt-1 text-red-500 text-sm">{errors.pricePerKg}</div>
              )}
            </div>

            <div dir="ltr" className="flex justify-between space-x-4 pt-4">
              <Button
                large
                onClick={() => setShowModal(false)}
                label="إلغاء"
                variant="filled"
                rounded="xl"
                fixedPadding="3"
                color="danger"
              />
              <Button
                large
                label={editingProduct ? "تحديث" : "إضافة"}
                isLoading={loadingBtn}
                variant="filled"
                type="submit"
                rounded="xl"
                fixedPadding="3"
                disabled={loadingBtn}
              />
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default WeightProductsModal;
