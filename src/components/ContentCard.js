"use client";
import React from "react";
import NoData from "./NoData";
import { TrashIcon } from "@heroicons/react/20/solid";
import Pagination from "./Pagination";

const ContentCard = ({
  data,
  nodata,
  totalPages,
  setPage,
  setLimit,
  page,
  limit,
  content,
  membersPage = false,
  mainPage = false,
  teamPage = false,
  attendancePage = false,
  deleteHandler,
}) => {
  return (
    <>
      {" "}
      <div className="flex flex-col justify-start items-center space-y-4 p-4 w-full">
        {data && data.length > 0 ? (
          <>
            {data.map((item) => (
              <div
                key={item.id}
                className={`relative flex flex-col justify-start items-center space-y-2  shadow p-4 rounded-xl w-full ${
                  new Date(item["renewDate"]?.split("-").reverse().join("-")) <
                  new Date()
                    ? "hover:bg-red-300 bg-red-200"
                    : "hover:bg-gray-50 bg-white"
                }`}
              >
                {deleteHandler && (
                  <span
                    onClick={() => deleteHandler?.(item["id"])}
                    className="top-3 left-3 absolute bg-red-600 hover:bg-red-700 shadow p-2 rounded-full cursor-pointer"
                  >
                    <TrashIcon className="size-4 text-white" />
                  </span>
                )}

                {content.map((field, index) => (
                  <div
                    key={index}
                    className="flex justify-start items-center space-x-2 w-full font-semibold"
                  >
                    <span className={``}>{field.name} : </span>
                    {field.value == "name" ? (
                      <a
                        href={
                          membersPage
                            ? `members/${item["id"]}`
                            : mainPage
                            ? `dashboard/members/${item["id"]}`
                            : teamPage
                            ? `team/${item["id"]}`
                            : attendancePage
                            ? `team/${item["id"]}`
                            : ""
                        }
                        className="text-[#215fa2] underline"
                      >
                        {item[field.value] ?? "—"}
                      </a>
                    ) : (
                      <span className="text-[#215fa2]">
                        {item[field.value] ?? "—"}{" "}
                        {field.value == "salary" ||
                        field.value == "subscriptionPrice"
                          ? "ج"
                          : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {totalPages > 1 && (
              <Pagination
                currentPage={1}
                limit={limit}
                totalPages={10}
                onPageChange={(p) => setPage(p)}
                onLimitChange={(l) => setLimit(l)}
              />
            )}
          </>
        ) : (
          <div className="pt-20">
            <NoData data={nodata} />
          </div>
        )}
      </div>
    </>
  );
};

export default ContentCard;
