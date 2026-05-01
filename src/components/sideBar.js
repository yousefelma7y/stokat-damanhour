"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GoSignIn } from "react-icons/go";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/20/solid";
import { usePathname } from "next/navigation";
import {
  ArchiveBoxXMarkIcon,
  BriefcaseIcon,
  Cog8ToothIcon,
  CreditCardIcon,
  CubeTransparentIcon,
  DocumentChartBarIcon,
  FingerPrintIcon,
  FolderPlusIcon,
  InboxStackIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TagIcon,
  UserCircleIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Cookies from "js-cookie";
import { Activity, BadgeX, Banknote, FactoryIcon, FolderOpenDot, HandCoins, Landmark, NotebookPen, Scale, Wallet } from "lucide-react";
import axiosClient from "@/lib/axios-client";
import { canAccessPage } from "@/lib/permissions";

const Sidebar = ({ }) => {
  const [active, setActive] = useState("dashboard");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedRole = Cookies.get("role");
    const storedUser = Cookies.get("user");

    setRole(storedRole || null);

    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const displayName = currentUser?.userName || currentUser?.brandName || "المستخدم";
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

  const userInitials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  useEffect(() => {
    if (pathname == "/dashboard") {
      setActive("dashboard");
    } else {
      setActive(pathname.split("/")[2]);
    }
    setIsOpen(false);
  }, [pathname]);

  const adminNavs = [
    {
      id: 1,
      label: "التقارير",
      icon: DocumentChartBarIcon,
      active: "dashboard",
      href: "/dashboard",
    },
    {
      id: 2,
      label: "إضافة طلب",
      icon: FolderPlusIcon,
      active: "create-order",
      href: "/dashboard/create-order",
    },
    {
      id: 3,
      label: "جميع الطلبات",
      icon: ShoppingCartIcon,
      active: "orders",
      href: "/dashboard/orders",
    },

    {
      id: 18,
      label: "الوزن",
      icon: Scale,
      active: "weight-products",
      href: "/dashboard/weight-products",
    },
    {
      id: 4,
      label: "المنتجات",
      icon: CubeTransparentIcon,
      active: "products",
      href: "/dashboard/products",
    },
    // {
    //   id: 17,
    //   label: "جرد الورديات",
    //   icon: NotebookPen,
    //   active: "shift-summary",
    //   href: "/dashboard/shift-summary",
    // },
    // {
    //   id: 5,
    //   label: "الورديات",
    //   icon: FingerPrintIcon,
    //   active: "shifts-page",
    //   href: "/dashboard/shifts-page",
    // },
    // {
    //   id: 6,
    //   label: "مرتجع شركة",
    //   icon: ArchiveBoxXMarkIcon,
    //   active: "wasted-products",
    //   href: "/dashboard/wasted-products",
    // },
    // {
    //   id: 7,
    //   label: "الخردة",
    //   icon: BadgeX,
    //   active: "scrap",
    //   href: "/dashboard/scrap",
    // },
    // {
    //   id: 8,
    //   label: "مصنع",
    //   icon: FactoryIcon,
    //   active: "factory",
    //   href: "/dashboard/factory",
    // },
    // {
    //   id: 9,
    //   label: "الخدمات",
    //   icon: BriefcaseIcon,
    //   active: "services",
    //   href: "/dashboard/services",
    // },
    {
      id: 10,
      label: "العملاء",
      icon: UsersIcon,
      active: "customers",
      href: "/dashboard/customers",
    },
    // {
    //   id: 11,
    //   label: "التجار",
    //   icon: UserGroupIcon,
    //   active: "suppliers",
    //   href: "/dashboard/suppliers",
    // },
    {
      id: 12,
      label: "المستخدمين",
      icon: UserCircleIcon,
      active: "users",
      href: "/dashboard/users",
    },

    {
      id: 15,
      label: "وسائل الدفع",
      icon: Wallet,
      active: "payment-methods",
      href: "/dashboard/payment-methods",
    },
    {
      id: 19,
      label: "المديونية",
      icon: HandCoins,
      active: "debts",
      href: "/dashboard/debts",
    },
    {
      id: 13,
      label: "الحسابات",
      icon: CreditCardIcon,
      active: "accounting",
      href: "/dashboard/accounting",
    },
    // {
    //   id: 14,
    //   label: "النشاطات",
    //   icon: Activity,
    //   active: "activities",
    //   href: "/dashboard/activities",
    // },
    {
      id: 16,
      label: "الإعدادات",
      icon: Cog8ToothIcon,
      active: "settings",
      href: "/dashboard/settings",
    },
  ];


  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Call logout API
      await axiosClient.post("/auth/logout", {});

      // Clear cookies
      Cookies.remove("user");
      Cookies.remove("role");
      Cookies.remove("token");

      // Redirect to login
      // router.push("/signin");
      window.location.href = "/signin";
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if API fails
      Cookies.remove("user");
      Cookies.remove("role");
      Cookies.remove("token");
      // router.push("/signin");
      window.location.href = "/signin";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <div
        className={`${isOpen ? "hidden " : "static sm:hidden"
          } w-0 h-0 p-0 m-0 `}
      >
        <button
          suppressHydrationWarning={true}
          className={`p-2 hover:shadow absolute right-2 top-2 text-black  transition-all duration-300 ease-in-out
                          hover:bg-white bg-white/70 md:bg-white/50 rounded-full z-50! cursor-pointer `}
          onClick={() => {
            setIsSidebarVisible(!isSidebarVisible);
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? (
            <ChevronDoubleRightIcon className="size-6" />
          ) : (
            <ChevronDoubleLeftIcon className="size-6" />
          )}
        </button>
      </div>
      <div
        className={`transition-all duration-150 sm:border-l-2 sm:border-[#E5E7EB] ease-in-out bg-bgColor min-h-screen z-30 
                ${isOpen
            ? "w-full sm:w-80 block"
            : "w-16 lg:w-20 hidden sm:block"
          }`}
      >
        <div
          className={`h-full relative flex flex-col items-center justify-between space-y-2 font-bold text-center`}
        >
          {/* Toggle button for small screens */}
          <button
            suppressHydrationWarning={true}
            className={`p-2 justify-center text-black  transition-all duration-150 ease-in-out z-50! 
                       hover:bg-white bg-white md:bg-white/50 rounded-full hover:shadow-xl cursor-pointer
                    relative ${isOpen ? "left-40 sm:right-40 top-4" : "right-10 top-9"
              }`}
            onClick={() => {
              setIsSidebarVisible(!isSidebarVisible);
              setIsOpen(!isOpen);
            }}
          >
            {isOpen ? (
              <ChevronDoubleRightIcon className="size-5" />
            ) : (
              <ChevronDoubleLeftIcon className="size-5" />
            )}
          </button>
          {/* Logo section */}
          <div className="absolute top-2 z-20! flex w-full flex-col items-center justify-center border-b border-gray-200 pb-3">
            <Link href="/dashboard" className="w-full px-2">
              <div
                className={`mx-auto flex items-center transition-all duration-300 ${isOpen
                  ? "w-full max-w-[220px] gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                  : "w-fit rounded-2xl bg-transparent p-1"
                  }`}
              >
                <div className={`relative shrink-0 rounded-2xl bg-gradient-to-br ${roleMeta.accent} p-[2px] shadow-lg ${roleMeta.glow}`}>
                  <div
                    className={`flex items-center justify-center rounded-[14px] bg-white font-black text-slate-900 ${isOpen ? "size-12 text-sm" : "size-10 text-xs lg:size-11"
                      }`}
                  >
                    {userInitials}
                  </div>
                  <span className="absolute -right-1 -bottom-1 flex size-3 rounded-full border-2 border-white bg-emerald-400" />
                </div>

                {isOpen && (
                  <div className="min-w-0 flex-1 text-right">
                    <p className="truncate font-extrabold text-sm text-slate-900">
                      {displayName}
                    </p>
                    <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${roleMeta.badge}`}>
                      {roleMeta.label}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          </div>
          {/* Sidebar Navigation */}
          <div
            className={`space-y-3 text-black w-full ${isOpen ? "p-4 pt-8" : "p-2 pt-4"
              } flex  justify-center flex-col items-center h-full  `}
          >
            {adminNavs.map((nav) => {
              // Only render links once role is determined to avoid admin modules "flickering" for cashiers
              if (!role) return null;

              // Check if user has permission to access this page
              if (!canAccessPage(role, nav.active)) {
                return null;
              }
              return (
                <Link
                  key={nav.id}
                  href={nav.href}
                  className={` py-2 relative  w-full flex justify-center flex-col items-center text-black 
                                transition-all duration-300 ease-in-out  ${isOpen ? "rounded-xl" : "rounded-xl"} 
                                 ${active == nav.active
                      ? " bg-white shadow "
                      : " hover:bg-[#ffffffcf]   hover:shadow"
                    }`}
                >
                  <div
                    className={`flex ${isOpen
                      ? " lg:pr-12 pr-[28%] md:justify-start"
                      : "justify-center"
                      } space-x-2 w-full items-center`}
                  >
                    <nav.icon className="size-5" />
                    {isOpen && <span>{isOpen && nav.label}</span>}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col justify-center items-center w-full h-1/8">
            <hr className="bg-white border-none w-[80%] h-0.5" />
            <div className={`text-black w-full p-2`}>
              <button
                suppressHydrationWarning={true}
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`py-3 w-full flex justify-center text-black hover:bg-white hover:text-red-700 hover:rounded-3xl
                                  hover:shadow-lg  transition-all duration-300 ease-in-out cursor-pointer`}
              >
                <div
                  className={`flex  space-x-2 w-full items-center 
                                    ${isOpen
                      ? " lg:pr-12 pr-[28%] md:justify-start"
                      : "md:justify-center"
                    }`}
                >
                  <GoSignIn className="size-5" />
                  <span>{isOpen && "تسجيل الخروج"}</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Sidebar;
