// FILE LOCATION: app/pages/signin/page.tsx

"use client";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import Button from "@/components/Button";
import { useState } from "react";
import Message from "@/components/Message";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axios-client";

export default function SignIn() {
  const initialValues = {
    userName: "",
    password: "",
  };

  const validationSchema = Yup.object({
    userName: Yup.string().required("إسم المستخدم مطلوب"),
    password: Yup.string().required("كلمة السر مطلوبة"),
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);

      // Call login API
      const { data } = await axiosClient.post("/auth/login", {
        userName: values.userName,
        password: values.password,
      });

      // Store user data in regular cookie (token is in HTTP-only cookie)
      Cookies.set("user", JSON.stringify(data.user), {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      // Store role for easy access
      Cookies.set("role", data.user.role, {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      // Show error message
      if (error.response?.data?.message) {
        setMessage({
          type: "error",
          message: error.response.data.message,
        });
      } else {
        setMessage({
          type: "error",
          message: "حدث خطأ في تسجيل الدخول",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex justify-center items-center min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 bg-red-500 opacity-20 blur-3xl rounded-full w-96 h-96 animate-pulse"></div>
          <div
            className="absolute bottom-0 -right-4 bg-purple-500 opacity-20 blur-3xl rounded-full w-96 h-96 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 border-white/20 border rounded-lg w-20 h-20 rotate-12"></div>
        <div className="absolute bottom-32 right-20 border-white/20 border-2 rounded-full w-32 h-32"></div>
        <div className="absolute top-1/2 left-1/4 border-white/20 border rounded-lg w-16 h-16 -rotate-12"></div>
      </div>

      <Message message={message} setMessage={setMessage} />

      {/* Main Container */}
      <div className="relative z-10 px-4 py-8 w-full max-w-2xl">
        {/* Glass Card */}
        <div className="relative backdrop-blur-xl bg-white/10 shadow-2xl border-white/20 p-8 md:p-10 border rounded-3xl overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form className="relative z-10 space-y-6">
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex justify-center items-center bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50 rounded-2xl w-16 h-16">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h1 className="mb-2 font-bold text-5xl text-white md:text-6xl">
                    أهلا بك
                  </h1>
                  <p className="font-medium text-red-100/80 text-base">
                    سجّل دخولك للوصول إلى حسابك
                  </p>
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <div dir="rtl" className="flex justify-between items-center">
                    <label
                      htmlFor="userName"
                      className="font-semibold text-sm text-white"
                    >
                      إسم المستخدم
                    </label>
                    <ErrorMessage
                      name="userName"
                      component="div"
                      className="font-semibold text-black text-xs"
                    />
                  </div>
                  <div className="relative">
                    <div className="right-3 absolute inset-y-0 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-red-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <Field
                      dir="rtl"
                      name="userName"
                      type="text"
                      suppressHydrationWarning={true}
                      className="backdrop-blur-sm bg-white/10 hover:bg-white/15 shadow-lg px-4 pr-10 py-3.5 border border-white/20 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-400/50 focus:outline-none w-full text-white transition-all duration-200 placeholder:text-red-200/50"
                      placeholder="أدخل اسم المستخدم"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div dir="rtl" className="flex justify-between items-center">
                    <label
                      htmlFor="password"
                      className="font-semibold text-sm text-white"
                    >
                      كلمة السر
                    </label>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="font-semibold text-black text-xs"
                    />
                  </div>
                  <div className="relative">
                    <div className="right-3 absolute inset-y-0 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-red-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <Field
                      dir="rtl"
                      name="password"
                      type="password"
                      suppressHydrationWarning={true}
                      className="backdrop-blur-sm bg-white/10 hover:bg-white/15 shadow-lg px-4 pr-10 py-3.5 border border-white/20 rounded-xl focus:border-red-400 focus:ring-2 focus:ring-red-400/50 focus:outline-none w-full text-white transition-all duration-200 placeholder:text-red-200/50"
                      placeholder="أدخل كلمة السر"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    isLoading={isLoading}
                    large
                    label={"تسجيل الدخول"}
                    variant="filled"
                    type="submit"
                    color="danger"
                    rounded="xl"
                    fixedPadding="3"
                  />
                </div>
              </Form>
            )}
          </Formik>
        </div>

        {/* Footer Text */}
        <div className="mt-6 space-y-2 text-center">
          <div className="pt-4 border-t border-white/10">
            <p className="flex justify-center items-center gap-1 font-medium text-red-200/80 text-xs">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zm0-10a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 018 11V7a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Copyright © 2025 - Developed by{" "}
              <span className="text-red-300 font-semibold">
                Eng. Yousef Elmahy
              </span>
            </p>
            <a
              href="tel:01022361568"
              className="inline-flex items-center gap-1.5 mt-1.5 font-semibold text-red-300 text-xs hover:text-red-200 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              01022361568
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
