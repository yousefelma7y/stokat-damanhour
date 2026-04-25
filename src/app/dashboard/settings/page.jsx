"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Store,
  MapPin,
  Phone,
  Lock,
  Camera,
  Save,
  X,
  Check,
  AlertCircle,
  PencilIcon,
} from "lucide-react";
import Title from "../../../components/Title";
import Button from "../../../components/Button";
import Cookies from "js-cookie";

import Image from "next/image";

export default function SettingsPage() {
  const [role, setRole] = useState(null);
  useEffect(() => {
    setRole(Cookies.get("role"));
  }, []);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [logoPreview, setLogoPreview] = useState("");

  // Store settings state
  const [storeEditing, setStoreEditing] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    storeName: "",
    storePhone: "",
    storeLocation: "",
  });
  const [storeFormData, setStoreFormData] = useState({
    storeName: "",
    storePhone: "",
    storeLocation: "",
  });

  const [formData, setFormData] = useState({
    userName: "",
    brandName: "",
    location: "",
    phone: "",
    logo: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profileDisplayName =
    userData?.userName || userData?.brandName || "المستخدم";
  const storeDisplayName =
    userData?.brandName || userData?.userName || "Stockat Damanhour";
  const roleMeta = {
    admin: {
      label: "مدير النظام",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accent: "from-emerald-500 via-sky-500 to-slate-900",
      glow: "shadow-emerald-200/70",
    },
    cashier: {
      label: "كاشير",
      badge: "bg-sky-50 text-sky-700 border-sky-200",
      accent: "from-sky-500 via-cyan-400 to-slate-900",
      glow: "shadow-sky-200/70",
    },
    accountant: {
      label: "محاسب",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      accent: "from-amber-500 via-orange-400 to-slate-900",
      glow: "shadow-amber-200/70",
    },
    default: {
      label: "مستخدم",
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      accent: "from-slate-500 via-slate-400 to-slate-900",
      glow: "shadow-slate-200/70",
    },
  }[role || "default"];
  const profileInitials =
    profileDisplayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U";

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchStoreSettings();
    }
  }, [role]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user="));

      if (userCookie) {
        const user = JSON.parse(decodeURIComponent(userCookie.split("=")[1]));
        const response = await fetch(`/api/users/${user._id}`);
        const result = await response.json();

        if (result.success) {
          setUserData(result.data);
          setFormData({
            userName: result.data.userName,
            brandName: result.data.brandName,
            location: result.data.location,
            phone: result.data.phone,
            logo: result.data.logo || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
          setLogoPreview(result.data.logo || "");
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showMessage("error", "فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreSettings = async () => {
    try {
      const response = await fetch("/api/store-settings");
      const result = await response.json();
      if (result.success) {
        setStoreSettings(result.data);
        setStoreFormData({
          storeName: result.data.storeName || "",
          storePhone: result.data.storePhone || "",
          storeLocation: result.data.storeLocation || "",
        });
      }
    } catch (error) {
      console.error("Error fetching store settings:", error);
    }
  };

  const handleStoreInputChange = (e) => {
    const { name, value } = e.target;
    setStoreFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoreSubmit = async () => {
    try {
      setStoreSaving(true);
      const response = await fetch("/api/store-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeFormData),
      });
      const result = await response.json();
      if (result.success) {
        setStoreSettings(result.data);
        setStoreEditing(false);
        showMessage("success", "تم تحديث بيانات المتجر بنجاح");
      } else {
        showMessage("error", result.message || "فشل في تحديث بيانات المتجر");
      }
    } catch (error) {
      console.error("Error updating store settings:", error);
      showMessage("error", "حدث خطأ أثناء تحديث بيانات المتجر");
    } finally {
      setStoreSaving(false);
    }
  };

  const cancelStoreEdit = () => {
    setStoreEditing(false);
    setStoreFormData({
      storeName: storeSettings.storeName || "",
      storePhone: storeSettings.storePhone || "",
      storeLocation: storeSettings.storeLocation || "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage("error", "حجم الصورة يجب أن يكون أقل من 2 ميجابايت");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData((prev) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleSubmit = async () => {
    if (formData.newPassword) {
      // if (formData.newPassword.length < 6) {
      //   showMessage("error", "كلمة السر الجديدة يجب أن تكون 6 أحرف على الأقل");
      //   return;
      // }
      if (formData.newPassword !== formData.confirmPassword) {
        showMessage("error", "كلمة السر الجديدة غير متطابقة");
        return;
      }
      // if (!formData.currentPassword) {
      //   showMessage("error", "يرجى إدخال كلمة السر الحالية");
      //   return;
      // }
    }

    try {
      setSaving(true);

      const updateData = {
        userName: formData.userName,
        brandName: formData.brandName,
        location: formData.location,
        phone: formData.phone,
        logo: formData.logo,
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const response = await fetch(`/api/users/${userData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        const updatedUser = { ...userData, ...updateData };
        delete updatedUser.password;
        document.cookie = `user=${JSON.stringify(
          updatedUser,
        )}; path=/; max-age=604800`;

        setUserData(result.data);
        setEditing(false);
        showMessage("success", "تم تحديث البيانات بنجاح");

        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        showMessage("error", result.message || "فشل في تحديث البيانات");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      showMessage("error", "حدث خطأ أثناء التحديث");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    if (userData) {
      setFormData({
        userName: userData.userName,
        brandName: userData.brandName,
        location: userData.location,
        phone: userData.phone,
        logo: userData.logo || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLogoPreview(userData.logo || "");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="border-blue-600 border-b-2 rounded-full w-12 h-12 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="" dir="rtl">
      {/* العنوان */}
      <Title
        withoutCount
        button={
          <Button
            Icon={PencilIcon}
            onClick={() => setEditing(true)}
            label={"تعديل"}
            variant="filled"
            type="submit"
            rounded="xl"
            fixedPadding="3"
          />
        }
        settings
        title="الإعدادات"
        subTitle="إدارة معلومات الحساب والمتجر"
      />

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white m-4 md:m-6 lg:m-8 p-6 rounded-xl">
        <div className="mb-6 flex items-center gap-4 border-gray-200 border-b pb-6">
          <div className={`relative rounded-[28px] bg-gradient-to-br ${roleMeta.accent} p-[2px] shadow-xl ${roleMeta.glow}`}>
            <div className="flex justify-center items-center bg-white rounded-[26px] w-24 h-24 overflow-hidden">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt={`${storeDisplayName} logo`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-black text-slate-900 text-2xl">
                  {profileInitials}
                </span>
              )}
            </div>
            <span className="right-1 bottom-1 absolute border-2 border-white rounded-full w-3.5 h-3.5 bg-emerald-400" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex sm:flex-row flex-col sm:items-center gap-2 sm:gap-3">
              <h3 className="truncate font-extrabold text-slate-900 text-xl">
                {profileDisplayName}
              </h3>
              <span className={`inline-flex w-fit rounded-full border px-3 py-1 font-bold text-[11px] ${roleMeta.badge}`}>
                {roleMeta.label}
              </span>
            </div>
            <p className="mt-2 font-medium text-slate-500 text-sm">
              {storeDisplayName}
            </p>
            <p className="mt-1 text-slate-400 text-xs">
              ملف الحساب والإعدادات العامة
            </p>
          </div>
        </div>

        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          <div className="col-span-1">
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              <User className="inline ml-2 w-4 h-4" />
              اسم المستخدم
            </label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleInputChange}
              disabled={!editing}
              className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              <Phone className="inline ml-2 w-4 h-4" />
              رقم الهاتف
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!editing}
              className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500 text-end"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              <Store className="inline ml-2 w-4 h-4" />
              الوظيفة
            </label>
              <input
                type="text"
                name="role"
                value={
                  role == "admin"
                    ? "مدير"
                    : role == "cashier"
                      ? "بائع"
                      : "مستخدم"
                }
                onChange={handleInputChange}
                disabled={true}
                className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500"
              />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              <Store className="inline ml-2 w-4 h-4" />
              اسم المتجر
            </label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleInputChange}
              disabled={role !== "admin" || !editing}
              className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              <MapPin className="inline ml-2 w-4 h-4" />
              الموقع
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              disabled={!editing}
              className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Store Settings Section — Admin Only */}
      {role === "admin" && (
        <div className="bg-white shadow-sm m-4 md:m-6 lg:m-8 p-6 border border-gray-100 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900 text-xl">
                معلومات المتجر (للفاتورة)
              </h2>
            </div>
            {!storeEditing && (
              <Button
                Icon={PencilIcon}
                onClick={() => setStoreEditing(true)}
                label={"تعديل"}
                variant="filled"
                type="button"
                rounded="xl"
                fixedPadding="3"
              />
            )}
          </div>
          <p className="mb-4 text-gray-500 text-sm">
            هذه البيانات ستظهر في رأس فاتورة الطلب بدلاً من بيانات المستخدم
          </p>

          <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                <Store className="inline ml-2 w-4 h-4" />
                اسم المتجر
              </label>
              <input
                type="text"
                name="storeName"
                value={storeFormData.storeName}
                onChange={handleStoreInputChange}
                disabled={!storeEditing}
                placeholder="مثال: ستوكات دمنهور"
                className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                <Phone className="inline ml-2 w-4 h-4" />
                رقم هاتف المتجر
              </label>
              <input
                type="tel"
                name="storePhone"
                value={storeFormData.storePhone}
                onChange={handleStoreInputChange}
                disabled={!storeEditing}
                placeholder="مثال: 01234567890"
                className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500 text-end"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                <MapPin className="inline ml-2 w-4 h-4" />
                عنوان المتجر
              </label>
              <input
                type="text"
                name="storeLocation"
                value={storeFormData.storeLocation}
                onChange={handleStoreInputChange}
                disabled={!storeEditing}
                placeholder="مثال: شارع الرئيسي - المنصورة"
                className="disabled:bg-gray-50 px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full disabled:text-gray-500"
              />
            </div>
          </div>

          {storeEditing && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleStoreSubmit}
                disabled={storeSaving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {storeSaving ? (
                  <>
                    <div className="border-white border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    حفظ بيانات المتجر
                  </>
                )}
              </button>
              <button
                onClick={cancelStoreEdit}
                disabled={storeSaving}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 px-6 py-2 rounded-lg text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                إلغاء
              </button>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="bg-white shadow-sm m-4 md:m-6 lg:m-8 p-6 border border-gray-100 rounded-xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900 text-xl">
              تغيير كلمة السر
            </h2>
          </div>
          <p className="mb-4 text-gray-600 text-sm">
            اترك الحقول فارغة إذا كنت لا تريد تغيير كلمة السر
          </p>

          <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
            {/* <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                كلمة السر الحالية
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="••••••••"
              />
            </div> */}

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                كلمة السر الجديدة
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium text-gray-700 text-sm">
                تأكيد كلمة السر
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="px-4 py-2 border border-gray-300 focus:border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 w-full"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="flex justify-center gap-4 m-8">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="border-white border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </>
            )}
          </button>
          <button
            onClick={cancelEdit}
            disabled={saving}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 px-6 py-2 rounded-lg text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
            إلغاء
          </button>
        </div>
      )}
    </div>
  );
}
