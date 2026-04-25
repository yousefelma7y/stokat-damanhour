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

import Image from "next/image";

const Sidebar = ({ }) => {
  const [active, setActive] = useState("dashboard");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    setRole(Cookies.get("role"));
  }, []);

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

    // {
    //   id: 15,
    //   label: "وسائل الدفع",
    //   icon: Wallet,
    //   active: "payment-methods",
    //   href: "/dashboard/payment-methods",
    // },
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
          <div className="flex flex-col justify-center items-center w-full  absolute top-2 z-20! pb-2 border-b border-gray-200">
            <Link href="/dashboard">
              <Image
                src="/maleAvatar.png"
                alt="Demo profile image"
                width={50}
                height={50}
                className={`rounded-full ${isOpen
                  ? "size-10 lg:size-12.5"
                  : "size-7.5 lg:size-10"
                  }`}
              />
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
