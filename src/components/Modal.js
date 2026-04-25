import { X } from "lucide-react";
import React, { ReactNode, Dispatch, SetStateAction } from "react";



const Modal = ({
  children,
  open,
  setOpen,
  title,
  maxWidth = "lg",
  loading = false,
  bgWhite = false,
}) => {
  const getMaxWidth = () => {
    switch (maxWidth) {
      case "sm":
        return "w-[90%] md:max-w-sm";
      case "md":
        return "w-[90%] md:max-w-md";
      case "lg":
        return "w-[90%] md:max-w-lg";
      case "xl":
        return "w-[90%] md:max-w-xl";
      case "2xl":
        return "w-[90%] md:max-w-2xl";
      case "3xl":
        return "w-[90%] md:max-w-3xl";
      case "4xl":
        return "w-[90%] md:max-w-4xl";
      default:
        return "w-[90%] md:max-w-lg";
    }
  };

  return (
    !!open && (
      <div
        style={{ zIndex: 9999999 }}
        className="fixed inset-0 overflow-y-auto  w-full"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >

        <div className="sm:block flex justify-center items-center w-full  h-full min-h-screen text-center">
          <div
            className="fixed inset-0 bg-[#99a1afd4] transition-opacity"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          ></div>
          <span
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          {loading ? (
            <div className={`align-center inline-block`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-10 animate-spin"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a7 7 0 017 7v1a1 1 0 11-2 0v-1a5 5 0 00-5-5 1 1 0 110-2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : (
            <div
              className={`inline-block ${getMaxWidth()} relative  transform overflow-visible rounded-lg  text-right align-bottom shadow-xl transition-all sm:my-8 sm:align-middle`}
            >
              <span className="absolute top-2 left-2  ">
                <X onClick={() => setOpen(false)} className="w-6 h-6 text-red-500 hover:text-red-600 cursor-pointer" />
              </span>
              <div
                className={`rounded-lg w-full ${bgWhite ? "!bg-white" : "!bg-[#b8d1ed]"
                  }  px-4 pb-4 pt-5 sm:p-6 sm:pb-4`}
              >
                <div className="relative flex items-center">
                  {title && (
                    <h3
                      className="mb-4 font-medium text-gray-700 text-xl leading-6"
                      id="modal-title"
                    >
                      {title}
                    </h3>
                  )}
                </div>
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default Modal;
