"use client";
import Sidebar from "../../components/sideBar";
import { useEffect, useState } from "react";

const DashboardLayout = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // if (!mounted || isLoading) {
  //   return <LoadingSpinner />;
  // }

  return (
    <div dir="rtl" className="relative flex w-full min-h-screen">
      <Sidebar role={"admin"} />
      <div className="flex-1 h-screen overflow-auto">{children}</div>
    </div>
  );
};

export default DashboardLayout;
