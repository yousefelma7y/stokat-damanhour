"use client";
import React from "react";
import { Formik, Form, Field } from "formik";
import { PlayCircle, StopCircle, AlertCircle } from "lucide-react";
import Modal from "../../../components/Modal";
import Button from "../../../components/Button";
import { NumericFormat } from "react-number-format";

export default function ShiftModal({
  mode = "open", // 'open' | 'close'
  open,
  setOpen,
  users = [],
  paymentMethods = [],
  selectedShift = null,
  initialValues = {},
  validationSchema,
  onSubmit,
  loadingBtn = false,
}) {
  const isOpenMode = mode === "open";

  const Title = () => (
    <div className="flex items-center gap-3 mb-6">
      <div
        className={`${isOpenMode ? "bg-green-100" : "bg-red-100"} p-2 md:p-3 rounded-xl`}
      >
        {isOpenMode ? (
          <PlayCircle className="w-5 md:w-6 h-5 md:h-6 text-green-600" />
        ) : (
          <StopCircle className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
        )}
      </div>
      <h2 className="font-bold text-gray-900 text-xl md:text-2xl">
        {isOpenMode ? "فتح وردية جديدة" : "إغلاق الوردية"}
      </h2>
    </div>
  );

  return (
    <Modal bgWhite open={open} setOpen={setOpen}>
      <div className="p-4 md:p-6">
        <Title />

        {/** optional summary for close mode */}
        {!isOpenMode && selectedShift && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 mb-6 p-3 md:p-4 rounded-xl">
            <div className="gap-3 md:gap-4 grid grid-cols-2 text-xs md:text-sm">
              <div>
                <p className="mb-1 text-gray-600">الموظف</p>
                <p className="font-semibold text-gray-900">
                  {selectedShift.user?.userName || selectedShift.user}
                </p>
              </div>
              <div>
                <p className="mb-1 text-gray-600">الرصيد الإفتتاحي</p>
                <p className="font-semibold text-green-600">
                  <NumericFormat
                    value={selectedShift.startingBalance}
                    displayType="text"
                    thousandSeparator
                    suffix=" EGP"
                  />
                </p>
              </div>
              <div>
                <p className="mb-1 text-gray-600">وقت البداية</p>
                <p className="font-semibold text-gray-900">
                  {new Date(selectedShift.startTime).toLocaleTimeString(
                    "ar-EG",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </p>
              </div>
              <div>
                <p className="mb-1 text-gray-600">إجمالي المبيعات</p>
                <p className="font-semibold text-blue-600">
                  <NumericFormat
                    value={selectedShift.totalSales || 0}
                    displayType="text"
                    thousandSeparator
                    suffix=" EGP"
                  />
                </p>
              </div>
            </div>
          </div>
        )}

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {({ errors, touched, isSubmitting, values }) => (
            <Form className="space-y-4 md:space-y-5">
              {isOpenMode && (
                <div>
                  <label className="block mb-2 font-semibold text-gray-700 text-sm">
                    الموظف
                  </label>
                  <Field
                    as="select"
                    name="user"
                    className="px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-xl w-full text-sm md:text-base"
                  >
                    <option value="">اختر الموظف</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.userName} - {u.location || "غير محدد"}
                      </option>
                    ))}
                  </Field>
                  {errors.user && touched.user && (
                    <p className="mt-1 text-red-500 text-xs md:text-sm">
                      {errors.user}
                    </p>
                  )}
                </div>
              )}

              {/* per-wallet inputs */}
              {paymentMethods.length > 0 && (
                <div>
                  <p className="mb-2 font-semibold text-gray-700 text-sm">
                    {isOpenMode
                      ? "أرصدة المحافظ عند الفتح"
                      : "أرصدة المحافظ عند الإغلاق"}
                  </p>
                  <div className="gap-3 grid grid-cols-1 md:grid-cols-2">
                    {paymentMethods.map((pm, idx) => (
                      <div key={pm._id}>
                        <label className="block mb-1 text-gray-600 text-sm">
                          {pm.name}
                        </label>
                        <div className="flex gap-2">
                          <Field
                            name={`${isOpenMode ? "startWallets" : "closeWallets"}.${idx}.amount`}
                            type="number"
                            placeholder="0"
                            className="px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-xl w-full text-sm"
                          />
                          <Field
                            type="hidden"
                            name={`${isOpenMode ? "startWallets" : "closeWallets"}.${idx}.paymentMethodId`}
                            value={pm._id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-sm">
                  ملاحظات (اختياري)
                </label>
                <Field
                  as="textarea"
                  name="notes"
                  rows="3"
                  placeholder={
                    isOpenMode
                      ? "أي ملاحظات عن الوردية..."
                      : "أي ملاحظات عن إغلاق الوردية..."
                  }
                  className="px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-xl w-full text-sm md:text-base resize-none"
                />
              </div>

              <div className="flex gap-2 md:gap-3 pt-4">
                <Button
                  large
                  type="submit"
                  label={
                    loadingBtn
                      ? isOpenMode
                        ? "جاري الفتح..."
                        : "جاري الإغلاق..."
                      : isOpenMode
                        ? "فتح الوردية"
                        : "إغلاق الوردية"
                  }
                  variant="filled"
                  color={isOpenMode ? "success" : "danger"}
                  rounded="xl"
                  fixedPadding="3"
                  disabled={loadingBtn || isSubmitting}
                  className="flex-1 text-sm md:text-base"
                />
                <Button
                  large
                  type="button"
                  onClick={() => setOpen(false)}
                  label="إلغاء"
                  variant="outlined"
                  color="danger"
                  rounded="xl"
                  fixedPadding="3"
                  className="flex-1 text-sm md:text-base"
                />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </Modal>
  );
}
