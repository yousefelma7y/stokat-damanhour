"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import Message from "@/components/Message";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axios-client";

const highlights = [
  {
    title: "واجهة واضحة وسريعة",
    description:
      "تجربة تسجيل دخول مرتبة تعمل بسلاسة على الجوال والشاشات الكبيرة.",
  },
  {
    title: "وصول آمن للحساب",
    description:
      "تم تصميم الصفحة لتوجيه المستخدم مباشرة إلى لوحة التحكم بعد التحقق.",
  },
  {
    title: "تنظيم أفضل للفريق",
    description:
      "نقطة دخول احترافية تساعد فريق العمل على بدء يومه بسرعة ووضوح.",
  },
];

const stats = [
  { value: "24/7", label: "جاهزية للوصول" },
  { value: "100%", label: "تصميم متجاوب" },
  { value: "Secure", label: "حماية الجلسة" },
];

export default function SignIn() {
  const initialValues = {
    userName: "",
    password: "",
  };

  const validationSchema = Yup.object({
    userName: Yup.string().required("اسم المستخدم مطلوب"),
    password: Yup.string().required("كلمة السر مطلوبة"),
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);
      setMessage(null);

      const { data } = await axiosClient.post("/auth/login", {
        userName: values.userName,
        password: values.password,
      });

      Cookies.set("user", JSON.stringify(data.user), {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      Cookies.set("role", data.user.role, {
        expires: 7,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      if (error.response?.data?.message) {
        setMessage({
          type: "error",
          message: error.response.data.message,
        });
      } else {
        setMessage({
          type: "error",
          message: "حدث خطأ أثناء تسجيل الدخول",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="relative bg-slate-950 min-h-screen overflow-hidden text-slate-100"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(245,158,11,0.14),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#082f49_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="-top-24 -right-12 absolute bg-sky-400/20 blur-3xl rounded-full w-72 sm:w-96 h-72 sm:h-96" />
      <div className="-bottom-24 -left-8 absolute bg-amber-300/15 blur-3xl rounded-full w-72 sm:w-[28rem] h-72 sm:h-[28rem]" />

      <Message message={message} setMessage={setMessage} />

      <div className="z-10 relative flex items-center mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl min-h-screen">
       
          <section className="relative bg-white shadow-lg shadow-slate-900/10 mx-auto p-5 sm:p-8 lg:p-10 rounded-3xl w-full max-w-2xl text-slate-900">
            <div className="z-10 relative mx-auto w-full max-w-xl">
              <div className="mb-8 sm:mb-10">
                <span className="inline-flex items-center bg-slate-950 px-4 py-2 border border-white/10 rounded-full font-semibold text-[11px] text-sky-100 sm:text-xs tracking-[0.2em]">
                  STOKAT DAMANHOUR
                </span>
                <h2 className="mt-6 font-black text-slate-950 text-3xl sm:text-4xl">
                  أهلاً بعودتك
                </h2>
                <p className="mt-3 font-medium text-slate-500 text-sm sm:text-base leading-7">
                  أدخل بياناتك للوصول إلى لوحة التحكم، وتمتع بتجربة تسجيل دخول
                  أوضح وأكثر احترافية.
                </p>
              </div>

              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {() => (
                  <Form className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-3">
                        <label
                          htmlFor="userName"
                          className="font-bold text-slate-700 text-sm"
                        >
                          اسم المستخدم
                        </label>
                        <ErrorMessage
                          name="userName"
                          component="div"
                          className="font-semibold text-rose-500 text-xs"
                        />
                      </div>

                      <div className="group relative">
                        <div className="right-4 absolute inset-y-0 flex items-center text-slate-400 group-focus-within:text-sky-600 transition-colors pointer-events-none">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7c-3.314 0-6 2.015-6 4.5V20h12v-1.5c0-2.485-2.686-4.5-6-4.5z"
                            />
                          </svg>
                        </div>
                        <Field
                          id="userName"
                          dir="rtl"
                          name="userName"
                          type="text"
                          suppressHydrationWarning
                          className="bg-slate-50 focus:bg-white shadow-sm px-4 pr-12 border border-slate-200 focus:border-sky-500 rounded-2xl outline-none focus:ring-4 focus:ring-sky-100 w-full h-14 text-slate-900 placeholder:text-slate-400 text-right transition duration-200"
                          placeholder="أدخل اسم المستخدم"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center gap-3">
                        <label
                          htmlFor="password"
                          className="font-bold text-slate-700 text-sm"
                        >
                          كلمة السر
                        </label>
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="font-semibold text-rose-500 text-xs"
                        />
                      </div>

                      <div className="group relative">
                        <div className="right-4 absolute inset-y-0 flex items-center text-slate-400 group-focus-within:text-sky-600 transition-colors pointer-events-none">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M8 10V7a4 4 0 118 0v3m-9 0h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1z"
                            />
                          </svg>
                        </div>

                        <Field
                          id="password"
                          dir="rtl"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          suppressHydrationWarning
                          className="bg-slate-50 focus:bg-white shadow-sm px-4 pr-12 pl-20 border border-slate-200 focus:border-sky-500 rounded-2xl outline-none focus:ring-4 focus:ring-sky-100 w-full h-14 text-slate-900 placeholder:text-slate-400 text-right transition duration-200"
                          placeholder="أدخل كلمة السر"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="left-3 absolute inset-y-0 flex items-center px-3 rounded-xl font-bold text-slate-500 hover:text-sky-700 text-xs transition"
                          aria-label={
                            showPassword ? "إخفاء كلمة السر" : "إظهار كلمة السر"
                          }
                        >
                          {showPassword ? "إخفاء" : "إظهار"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50/80 p-4 border border-slate-200 rounded-3xl text-slate-600 text-sm leading-7">
                      سيتم توجيهك مباشرة إلى لوحة التحكم بعد التحقق من بيانات
                      الدخول الخاصة بك.
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex justify-center items-center gap-2 bg-slate-950 hover:bg-sky-700 disabled:bg-slate-400 shadow-lg shadow-slate-900/10 px-4 py-4 rounded-2xl w-full font-bold text-white text-sm sm:text-base transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isLoading && (
                        <svg
                          className="w-5 h-5 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeOpacity="0.25"
                            strokeWidth="4"
                          />
                          <path
                            d="M22 12a10 10 0 00-10-10"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                      <span>
                        {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                      </span>
                    </button>
                  </Form>
                )}
              </Formik>

              <div className="mt-8 pt-5 border-slate-200 border-t text-center">
                <p className="font-medium text-slate-500 text-xs sm:text-sm">
                  Copyright © 2025 - Developed by{" "}
                  <span className="font-bold text-slate-800">
                    Eng. Yousef Elmahy
                  </span>
                </p>
                <a
                  href="tel:01022361568"
                  className="inline-flex items-center gap-2 mt-2 font-bold text-sky-700 hover:text-slate-950 text-sm transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 5a2 2 0 012-2h2.8a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.2 1.1a11.05 11.05 0 005.5 5.5l1.1-2.2a1 1 0 011.2-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z"
                    />
                  </svg>
                  01022361568
                </a>
              </div>
            </div>
          </section>
   
      </div>
    </div>
  );
}
