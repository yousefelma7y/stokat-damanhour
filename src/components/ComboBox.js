"use client";
import React, { Fragment, useEffect, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { ThreeDots, useLoading } from "@agney/react-loading";
import { FormikProps } from "formik";
import { XCircleIcon } from "@heroicons/react/24/outline";



export default function CustomComboBox({
  items,
  placeholder = "",
  formik,
  fieldName,
  onChange = () => { },
  isCleared = false,
  onClear,
  isLoading = false,
  small = false,
  byId = false,
  byValue = false,
  disabled = false,
  error = false,
  errorMessage = "", // Default to empty string
  scale = false,
  currentSelected = false,
  className
}) {
  const [selected, setSelected] = useState(
    currentSelected ? (currentSelected) : null
  );
  const [query, setQuery] = useState("");
  const [touched, setTouched] = useState(false);

  const { containerProps, indicatorEl } = useLoading({
    loading: isLoading,
    indicator: <ThreeDots width="50" />,
  });

  useEffect(() => {
    if (currentSelected == null) {
      setSelected(null);
    }
  }, [currentSelected]);

  const filteredItems =
    query === ""
      ? items
      : items.filter((item) =>
        item.name
          .toLowerCase()
          .replace(/\s+/g, "")
          .includes(query.toLowerCase().replace(/\s+/g, ""))
      );

  useEffect(() => {
    if (!formik || !fieldName) return;
    const formikValue = formik.values[fieldName];

    const matched = items.find(
      (item) =>
        (byValue && item.value === formikValue) ||
        (byId && item._id === formikValue) ||
        item.name === formikValue
    );

    if (matched && matched !== selected) {
      setSelected(matched);
    }
  }, [formik?.values[fieldName ?? ""], items]);

  useEffect(() => {
    if (!selected) return;

    const computedValue =
      byValue && selected.value !== undefined
        ? selected.value
        : byId
          ? selected._id
          : selected.name;

    const currentFormikValue = formik?.values[fieldName ?? ""];

    if (computedValue !== currentFormikValue) {
      formik?.setFieldValue(fieldName ?? "", computedValue);
      onChange(computedValue);
    }
  }, [selected]);

  useEffect(() => {
    if (!items || items.length === 0) {
      setSelected(null);
    }
  }, [items]);

  // Get error message from formik if available and no specific errorMessage provided
  const displayErrorMessage =
    errorMessage ||
    (formik &&
      fieldName &&
      formik.touched[fieldName] &&
      formik.errors[fieldName]) ||
    "";

  // Determine if the field has an error (from props or formik)
  const hasError =
    error ||
    (formik &&
      fieldName &&
      formik.touched[fieldName] &&
      Boolean(formik.errors[fieldName]));

  const handleBlur = () => {
    setTouched(true);
    if (formik && fieldName) {
      formik.setFieldTouched(fieldName, true, true);
    }
  };
  // 
  return (
    <div className="w-full">
      <Combobox value={selected} onChange={setSelected} disabled={disabled}>
        {(api) => (
          <div
            className={`relative h-full ${small ? "w-3/4 sm:w-1/2" : "w-full"
              }  `}
          >
            <ComboboxButton
              onBlur={handleBlur}
              dir="rtl"
              className={`relative flex justify-between w-full items-center px-8   py-3 bg-white  rounded-lg text-sm
                ${scale &&
                "transition-all duration-300 transform hover:scale-105 "
                }
                ${hasError
                  ? "!border-red-500 !focus:border-red-500 !border-2"
                  : "border border-gray-300"
                } text-gray-400 ${className}`}
            >
              <span
              // className={`${hasError ? "text-red-500" : ""}`}
              >
                {api.value ? api.value?.name : placeholder}
              </span>
              {selected?.name ? (
                <XCircleIcon
                  className="left-2 absolute hover:bg-red-500 rounded-full size-5 text-red-500 hover:text-white cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent button click

                    setSelected(null);
                    if (onClear) onClear();
                    if (formik && fieldName) {
                      formik.setFieldValue(fieldName, "");
                      formik.setFieldTouched(fieldName, true, true);
                    }
                  }}
                />
              ) : (
                <ChevronUpDownIcon
                  className={`left-0.5 absolute size-5 text-gray-400
                  `}
                  aria-hidden="true"
                />
              )}
            </ComboboxButton>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery("")}
            >
              <div className="z-50 absolute w-full">
                <div className="relative bg-white mt-1 p-2 border border-gray-400 rounded-2xl">
                  <ComboboxInput
                    className={`z-50 mt-1 md:py-2 md:pr-10 md:pl-3 border-2 
                      border-gray-400
                     rounded-2xl w-full h-10 text-gray-800 text-sm text-right leading-5 placeholder-gray-800  `}
                    placeholder={placeholder}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={handleBlur}
                  />

                  <ComboboxOptions
                    modal={false}
                    className="z-50 bg-white shadow-lg mt-1 rounded-md ring-1 ring-black/5 w-full max-h-50 overflow-y-auto sm:text-sm text-base"
                  >
                    {isLoading ? (
                      <div className="flex justify-center items-center h-28">
                        {indicatorEl}
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="relative px-4 py-2 text-gray-700 cursor-default select-none">
                        Nothing found.
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <ComboboxOption
                          disabled={item?.disabled}
                          key={item?._id || item?.id || item}
                          className={({ active }) =>
                            `relative cursor-pointer select-none p-2 text-gray-900 text-center
                          ${active && " bg-green-50"}`
                          }
                          value={item}
                        >
                          {({ selected, disabled }) => (
                            <>
                              <span
                                className={`${disabled && "cursor-not-allowed text-gray-400"
                                  } block truncate ${selected ? "font-medium" : "font-normal"
                                  }`}
                              >
                                {item?.element || item?.name}
                              </span>
                              {selected && (
                                <span
                                  className={`absolute inset-y-0 right-0.5 flex items-center pl-3 text-green-500`}
                                >
                                  <CheckIcon
                                    className="w-5 h-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </>
                          )}
                        </ComboboxOption>
                      ))
                    )}
                  </ComboboxOptions>
                </div>
              </div>
            </Transition>
          </div>
        )}
      </Combobox>
    </div>
  );
}
