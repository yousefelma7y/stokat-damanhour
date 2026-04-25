import React from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onLimitChange,
  limit,
}) => {
  // Generate page numbers to display
  const pageNumbers = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust start if we're near the end
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div
      dir="ltr"
      className="flex flex-col md:flex-row justify-center items-center gap-4 p-2 md:p-4 bg-gray-50 border-t border-gray-200 w-full">


      {/* Page info */}
      <div className="text-sm font-medium text-gray-700 px-3 py-2 bg-white rounded-xl border border-gray-200">
        صفحة <span className="font-bold text-red-700">{currentPage}</span> من{" "}
        <span className="font-bold">{totalPages}</span>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1">
        {/* First page */}
        <button
          className="p-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-150 active:bg-gray-200"
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
          title="الصفحة الأولى"
        >
          <ChevronDoubleLeftIcon className="size-5 text-gray-700" />
        </button>

        {/* Previous page */}
        <button
          className="p-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-150 active:bg-gray-200"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="السابق"
        >
          <ChevronLeftIcon className="size-5 text-gray-700" />
        </button>

        {/* Show first page if not in range */}
        {startPage > 1 && (
          <>
            <button
              className="min-w-[40px] h-10 rounded-xl hover:bg-gray-100 transition-colors duration-150 font-medium text-gray-700"
              onClick={() => onPageChange(1)}
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-2 text-gray-500">...</span>
            )}
          </>
        )}

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`min-w-[40px] h-10 rounded-xl font-medium transition-all duration-150 ${pageNumber === currentPage
                ? "bg-red-700 text-white shadow-md hover:bg-red-800"
                : "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                }`}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        {/* Show last page if not in range */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            <button
              className="min-w-[40px] h-10 rounded-xl hover:bg-gray-100 transition-colors duration-150 font-medium text-gray-700"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next page */}
        <button
          className="p-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-150 active:bg-gray-200"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="التالي"
        >
          <ChevronRightIcon className="size-5 text-gray-700" />
        </button>

        {/* Last page */}
        <button
          className="p-2 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors duration-150 active:bg-gray-200"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="الصفحة الأخيرة"
        >
          <ChevronDoubleRightIcon className="size-5 text-gray-700" />
        </button>
      </div>



    </div>
  );
};

export default Pagination;