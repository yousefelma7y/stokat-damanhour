"use client";

import { Form, Formik } from "formik";
import CustomComboBox from "./ComboBox";

import lightAddImage from "../../../pubilc/assets/lightAddImage.png"
import DarkAddImage from "../../../pubilc/assets/darkAddImage.png"

import Image from "next/image";
import { useRef, useState } from "react";
import { XCircleIcon, XMarkIcon } from "@heroicons/react/24/solid";
import instance from "../../app/axios";
import { CldImage } from "next-cloudinary";

export default function DashboardForm({
    isLoading = false,
    initialValues,
    validationSchema,
    onSubmit,
    btnLable,
    inputs,
    mainForm = false,
    textArea = false,
    AddPlaygrounds = false,
    combobox1,
    combobox2,
    combobox3,
    Role = false,
    previewImage,
    setPreviewImage,
}) {

    const imageRef = useRef();
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e, formik) => {
        const file = e.target.files[0];
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
            uploadToCloudinary(file, formik); // ✅ Ensure formik is passed
        }
    };
    const uploadToCloudinary = async (file, formik) => {
        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            try {
                const body = JSON.stringify({ image: reader.result });

                const { data } = await instance.post("/upload", body, {
                    headers: { "Content-Type": "application/json" },
                });

                setUploading(false);
                formik.setFieldValue("image", data.url); // ✅ Now it can access Formik
            } catch (error) {
                setUploading(false);
                console.error("Upload error:", error);
                alert("Upload failed: " + (error.response?.data?.error || error.message));
            }
        };
    };





    return (
        <section
            className={`bg-gradient-to-r ${mainForm ? `from-primary dark:from-darkThirdColor 
      to-secondary dark:to-darkSecoundary` : `from-error dark:from-darkred 
      to-lightRed dark:to-error`} rounded-3xl text-right `}
        >
            <div className="border-8 border-transparent  rounded-xl bg-white dark:bg-[#1a475b]  shadow-xl p-4 py-4 m-2 space-y-4">
                {/* Form */}
                <Formik
                    enableReinitialize
                    validationSchema={validationSchema}
                    initialValues={initialValues}
                    onSubmit={onSubmit}
                >
                    {(formik) => (
                        <Form
                            dir="rtl"
                            onSubmit={formik.handleSubmit}
                            className={`${mainForm && "p-4"}  space-y-4 md:text-md xl:text-lg`}
                        >
                            <div
                                className={`space-y-4 `}
                            >
                                {/* comboBoxes */}
                                {AddPlaygrounds && <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="owner"
                                            className={`block mb-2 ${formik.touched["owner"] &&
                                                formik.errors["owner"]
                                                ? "text-sm md:text-lg "
                                                : "text-lg "
                                                }   text-lg font-medium shadowText dark:text-white text-gray-700`}
                                        >
                                            <span> صاحب الملعب:</span>
                                            {formik.touched["owner"] &&
                                                formik.errors["owner"] && (
                                                    <span className="text-error dark:text-darkred font-bold text-sm">
                                                        {" "}
                                                        {formik.errors["owner"]}{" "}
                                                    </span>
                                                )}
                                        </label>
                                        <CustomComboBox byId isLoading={isLoading} error={formik.errors["owner"]} formik={formik} fieldName={"owner"} dashboardForm items={combobox1} placeholder="أختر صاحب ملعب" />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="governorate"
                                            className={`block mb-2 ${formik.touched["governorate"] &&
                                                formik.errors["governorate"]
                                                ? "text-sm md:text-lg "
                                                : "text-lg "
                                                }   text-lg font-medium shadowText dark:text-white text-gray-700`}
                                        >
                                            <span> المحافظة:</span>
                                            {formik.touched["governorate"] &&
                                                formik.errors["governorate"] && (
                                                    <span className="text-error dark:text-darkred font-bold text-sm">
                                                        {" "}
                                                        {formik.errors["governorate"]}{" "}
                                                    </span>
                                                )}
                                        </label>
                                        <CustomComboBox isLoading={isLoading} error={formik.errors["governorate"]} formik={formik} fieldName={"governorate"} dashboardForm items={combobox2} placeholder="أختر المحافظة" />
                                    </div>
                                </div>}
                                {/* Inputs */}
                                <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
                                    {inputs &&
                                        inputs.map((input) => (
                                            <div key={input.name} className="">
                                                <label
                                                    htmlFor={input.name}
                                                    className={`block mb-2 ${formik.touched[input.name] &&
                                                        formik.errors[input.name]
                                                        ? "text-sm md:text-lg "
                                                        : "text-lg "
                                                        }   text-lg font-medium shadowText dark:text-white text-gray-700`}
                                                >
                                                    <span> {input.label}:</span>
                                                    {formik.touched[input.name] &&
                                                        formik.errors[input.name] && (
                                                            <span className="text-error dark:text-darkred font-bold text-sm">
                                                                {" "}
                                                                {formik.errors[input.name]}{" "}
                                                            </span>
                                                        )}
                                                </label>
                                                <input
                                                    id={input.name}
                                                    className={`dark:bg-[#122f3c] p-3 shadow ${formik.touched[input.name] &&
                                                        formik.errors[input.name]
                                                        ? " border-error focus:border-error dark:border-darkred dark:focus:border-darkred border-2"
                                                        : `border-gray-300 ${mainForm ? `dark:border-darkThirdColor
                                                        focus:border-primary dark:ring-darkThirdColor 
                                                        focus:ring-primary` : `dark:border-darkred
                                                        focus:border-error dark:ring-darkred 
                                                        focus:ring-error`}  border`} !outline-none  rounded-lg w-full focus:ring-2
                                                        transition transform  duration-300 text-right `}
                                                    type={input.type}
                                                    placeholder={input.placeholder}
                                                    {...formik.getFieldProps(input.name)}
                                                    onInput={(e) => {
                                                        if (input.name === "phone") {
                                                            e.target.value = e.target.value.replace(/[^0-9]/g, ""); // Only allow numbers for phone input
                                                        }
                                                    }}
                                                />
                                            </div>
                                        ))}
                                </div>
                                {/* Role */}
                                {Role &&
                                    <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="role"
                                                className={`block mb-2 
                                                    ${formik.touched["role"] && formik.errors["role"] ? "text-sm md:text-lg " : "text-lg "}   
                                                    text-lg font-medium shadowText dark:text-white text-gray-700`}
                                            >
                                                <span> وظيفتة:</span>
                                                {formik.touched["role"] &&
                                                    formik.errors["role"] && (
                                                        <span className="text-error dark:text-darkred font-bold text-sm">
                                                            {" "}
                                                            {formik.errors["role"]}{" "}
                                                        </span>
                                                    )}
                                            </label>
                                            <CustomComboBox
                                                byValue
                                                error={formik.touched["role"] && formik.errors["role"]}
                                                formik={formik}
                                                fieldName="role"
                                                dashboardForm
                                                items={combobox1}
                                                placeholder="أختر وظيفتة"
                                                onChange={(value) => formik.setFieldValue("role", value)}
                                            />
                                        </div>
                                    </div>

                                }

                                {/* date and combobox */}
                                {AddPlaygrounds && <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
                                    <div>
                                        <label
                                            htmlFor="owner"
                                            className={`block mb-2 ${formik.touched["plan"] &&
                                                formik.errors["plan"]
                                                ? "text-sm md:text-lg "
                                                : "text-lg "
                                                }   text-lg font-medium shadowText dark:text-white text-gray-700`}
                                        >
                                            <span> خطة الدفع:</span>
                                            {formik.touched["plan"] &&
                                                formik.errors["plan"] && (
                                                    <span className="text-error dark:text-darkred font-bold text-sm">
                                                        {" "}
                                                        {formik.errors["plan"]}{" "}
                                                    </span>
                                                )}
                                        </label>
                                        <CustomComboBox
                                            byId
                                            isLoading={isLoading}
                                            error={formik.errors["plan"]}
                                            formik={formik} fieldName={"plan"}
                                            dashboardForm items={combobox3}
                                            placeholder="أختر خطة الدفع" />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="paymentDate"
                                            className={`block mb-2 ${formik.touched["paymentDate"] &&
                                                formik.errors["paymentDate"]
                                                ? "text-sm md:text-lg "
                                                : "text-lg "
                                                }   text-lg font-medium shadowText dark:text-white text-gray-700`}
                                        >
                                            <span> معاد الدفع:</span>
                                            {formik.touched["paymentDate"] &&
                                                formik.errors["paymentDate"] && (
                                                    <span className="text-error dark:text-darkred font-bold text-sm">
                                                        {" "}
                                                        {formik.errors["paymentDate"]}{" "}
                                                    </span>
                                                )}
                                        </label>
                                        <input
                                            id="paymentDate"
                                            className={`dark:bg-[#122f3c] text-gray-500 dark:text-gray-500 
                                            dark:placeholder-gray-500 p-3 shadow 
                                            ${formik.touched["paymentDate"] && formik.errors["paymentDate"]
                                                    ? "border-error focus:border-error dark:border-darkred dark:focus:border-darkred border-2"
                                                    : `border-gray-300 ${mainForm
                                                        ? `dark:border-darkThirdColor focus:border-primary dark:ring-darkThirdColor focus:ring-primary`
                                                        : `dark:border-darkred focus:border-error dark:ring-darkred focus:ring-error`} border`}
                                            appearance-none outline-none rounded-lg w-full focus:ring-2
                                            transition transform duration-300 text-right`}
                                            type="date"
                                            placeholder="اختر معاد الدفع"
                                            {...formik.getFieldProps("paymentDate")}
                                        />

                                    </div>
                                </div>}
                                {AddPlaygrounds &&
                                    /* Image Input */
                                    <div>
                                        <label
                                            htmlFor="image"
                                            className={`block mb-2 ${formik.touched.image && formik.errors.image
                                                ? "text-sm md:text-lg"
                                                : "text-lg"
                                                } text-lg font-medium text-gray-700 dark:text-white`}
                                        >
                                            <span>صورة الملعب:</span>
                                            {formik.touched.image && formik.errors.image && (
                                                <span className="text-error dark:text-darkred font-bold text-sm">
                                                    {" "}
                                                    {formik.errors.image}{" "}
                                                </span>
                                            )}
                                        </label>
                                        <div
                                            onClick={() => imageRef.current.click()}
                                            className={`dark:bg-[#122f3c]shadow border-2 ${formik.touched["image"] && formik.errors["image"]
                                                ? " border-error focus:border-error dark:border-darkred dark:focus:border-darkred border-2"
                                                : `border-gray-300 hover:border-secondary dark:hover:border-darkSecoundary border-dashed ${mainForm
                                                    ? `dark:border-darkThirdColor focus:border-primary dark:ring-darkThirdColor focus:ring-primary`
                                                    : `dark:border-darkred focus:border-error dark:ring-darkred  focus:ring-error`
                                                }`
                                                } !outline-none rounded-lg w-full focus:ring-2 transition transform duration-300 text-right flex justify-center p-8 cursor-pointer`}
                                        >

                                            {previewImage ? (
                                                <div className="relative w-86 h-60 ">
                                                    <CldImage
                                                        src={previewImage} // Use the uploaded image URL from Cloudinary
                                                        className="w-full h-full object-fill"
                                                        width={128}
                                                        height={128}
                                                        alt="Uploaded Image"
                                                    />
                                                    <span className="absolute -right-2 -top-3">
                                                        <XCircleIcon
                                                            onClick={() => setPreviewImage(null)}
                                                            className="size-8 fill-error" />
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Image
                                                        src={lightAddImage}
                                                        priority
                                                        alt="logo"
                                                        className="dark:hidden d-block h-32 w-32 bg-contain"
                                                    />
                                                    <Image
                                                        src={DarkAddImage}
                                                        priority
                                                        alt="logo"
                                                        className="dark:block hidden h-32 w-32 bg-contain"
                                                    />
                                                </>
                                            )}
                                        </div>
                                        <input
                                            ref={imageRef}
                                            id="image"
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(e, formik)}
                                            className="hidden"
                                        />

                                    </div>
                                }
                                {/* Text Area */}
                                {textArea && (
                                    <div>
                                        <label
                                            htmlFor="message"
                                            className={`block mb-2 ${formik.touched.message && formik.errors.message
                                                ? "text-sm md:text-lg"
                                                : "text-lg"
                                                }   text-lg font-medium  text-gray-700 dark:text-white`}
                                        >
                                            <span>رسالتك :</span>
                                            {formik.touched.message && formik.errors.message && (
                                                <span className="text-error font-bold text-sm">
                                                    {" "}
                                                    {formik.errors.message}{" "}
                                                </span>
                                            )}
                                        </label>
                                        <textarea
                                            rows="3"
                                            id="message"
                                            className={`border p-3 shadow-md rounded-lg w-full focus:ring-2 duration-300 text-right
                                            ${formik.touched.message && formik.errors.message
                                                    ? " border-error focus:border-error border-2 dark:border-darkred dark:focus:border-darkred"
                                                    : `border-gray-300 ${mainForm ? `dark:border-darkThirdColor focus:border-primary dark:ring-darkThirdColor 
                                            focus:ring-primary` : `dark:border-darkred focus:border-error dark:ring-darkred focus:ring-error`} border`} 
                                            focus:ring-lightRed transition transform hover:scale-105 `}
                                            type="text"
                                            placeholder="اكتب رسالتك هنا ..."
                                            {...formik.getFieldProps("message")}
                                        />
                                    </div>
                                )}
                                {/* Submit Button*/}
                                <button
                                    className={`w-full shadowText p-3 text-white bg-gradient-to-r
                                    ${mainForm ? ` from-primary dark:from-darkThirdColor to-secondary dark:to-darkSecoundary `
                                            : `from-error dark:from-darkred to-lightRed dark:to-error`}
                                    rounded-lg hover:scale-105 transition transform duration-300 shadow-lg 
                                    focus:outline-none focus:ring-2 focus:primary`}
                                    type="submit"
                                >
                                    {btnLable}
                                </button>
                            </div>
                        </Form>
                    )
                    }
                </Formik >
            </div >
        </section >
    );
}
