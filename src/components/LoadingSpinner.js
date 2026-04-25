import React, { useEffect } from "react";

const LoadingSpinner = () => {

    return (
        <div className="flex flex-col justify-center items-center py-12 relative">

            <div className="border-4 border-gray-200 border-t-[#5696DB] rounded-full w-16 h-16 animate-spin"></div>
            <div className="mt-4 text-gray-600 text-center">جاري التحميل...</div>

        </div>
    );
};

export default LoadingSpinner;