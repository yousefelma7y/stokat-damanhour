"use client";

import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect } from "react";



const Message = ({ message, setMessage }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, setMessage]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ x: 350, opacity: 0 }}
          animate={{ x: -20, opacity: 1 }}
          exit={{ x: 350, opacity: 0 }}
          transition={{ type: "easeInOut", duration: 0.4 }}
          style={{ zIndex: 99999999 }}
          className="top-10 right-1 fixed"
        >
          <div
            dir="ltr"
            className={`relative border-2 ${
              message.type === "success" ? "border-green-400" : "border-red-500"
            } 
            flex items-center justify-around gap-4 w-[330px] h-[80px] p-3 bg-white rounded-xl shadow-md overflow-hidden`}
          >
            <svg
              className={`absolute transform -rotate-90 right-[-31px] top-[32px] w-[80px] 
              ${
                message.type === "success" ? "fill-green-300" : "fill-red-300"
              }`}
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L0,320Z" />
            </svg>

            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full text-gray-600 
              ${message.type === "success" ? "bg-green-100" : "bg-red-100"}`}
            >
              {message.type === "success" ? (
                <CheckCircleIcon className="size-6" />
              ) : (
                <ExclamationTriangleIcon className="size-6" />
              )}
            </div>

            <div className="flex flex-col flex-grow justify-center items-center">
              <p
                className={`${
                  message.type === "success" ? "text-green-500" : "text-red-500"
                } capitalize font-bold text-lg`}
              >
                {message.type === "success" ? "نجاح" : "فشل"}
              </p>
              <p className="text-gray-500 text-md">
                {message.message}
              </p>
            </div>

            <svg
              onClick={() => setMessage(null)}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 15 15"
              className="w-4 h-4 text-gray-600 cursor-pointer"
            >
              <path
                fill="currentColor"
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                clipRule="evenodd"
                fillRule="evenodd"
              />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Message;
