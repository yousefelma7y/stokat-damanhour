import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

const DeleteModal = ({
  deleteReqModal,
  setDeleteReqModal,
  name,
  deleteHandler,
  isLoading,
  OrdersPage = false
}) => {

  const open = !!deleteReqModal;
  return (
    <Modal open={open}
      setOpen={(val) => {
        if (!val) setDeleteReqModal(null);
      }}
      maxWidth="lg" bgWhite>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex justify-center bg-[#FFE0E3] p-3 rounded-full">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 7H20"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11V17"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11V17"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7"
              stroke="#DC3545"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7"
              stroke="#DC3545"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="font-bold text-black text-xl"> {OrdersPage ? "إلغاء" : "حذف"} {name} ؟ </h1>
        <h1 className="text-gray-600 text-lg">
          هل أنت متأكد من {OrdersPage ? "إلغاء" : "حذف"} {name == "الخدمة" ? "هذة" : "هذا"} {name} ؟{" "}
        </h1>
        <div className="flex justify-between pt-6 w-full">
          <div className="ml-2 w-1/2">
            <Button
              large
              onClick={() => deleteHandler(deleteReqModal)}
              isLoading={isLoading}
              label={"نعم أنا متأكد"}
              color={"danger"}
              variant={"filled"}
              rounded="2xl"
            />
          </div>
          <div className="w-1/2">
            <Button
              large
              rounded="2xl"
              onClick={() => setDeleteReqModal && setDeleteReqModal(null)}
              label={"لا"}
              color={"info"}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
