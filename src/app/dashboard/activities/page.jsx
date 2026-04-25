"use client";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Package,
  DollarSign,
  Settings,
  Trash2,
  Edit,
  UserPlus,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  LogIn,
  LogOut,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import axiosClient from "@/lib/axios-client";

import Title from "../../../components/Title";
import Message from "../../../components/Message";
import LoadingSpinner from "../../../components/LoadingSpinner";
import FiltersCombonent from "../../../components/FiltersCombonent";

// Icon mapping for different action types
const getActionIcon = (type, severity) => {
  const iconProps = { className: "w-5 h-5" };

  switch (type) {
    case "user_added":
      return <UserPlus {...iconProps} />;
    case "product_updated":
      return <Package {...iconProps} />;
    case "order_created":
      return <ShoppingCart {...iconProps} />;
    case "payment_failed":
      return <XCircle {...iconProps} />;
    case "stock_warning":
      return <AlertCircle {...iconProps} />;
    case "category_deleted":
      return <Trash2 {...iconProps} />;
    case "user_login":
      return <LogIn {...iconProps} />;
    case "user_logout":
      return <LogOut {...iconProps} />;
    default:
      return <Settings {...iconProps} />;
  }
};

// Color mapping for severity levels
const getSeverityStyles = (severity) => {
  switch (severity) {
    case "success":
      return {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "bg-green-100 text-green-600",
        dot: "bg-green-500",
      };
    case "error":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "bg-red-100 text-red-600",
        dot: "bg-red-500",
      };
    case "warning":
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        icon: "bg-yellow-100 text-yellow-600",
        dot: "bg-yellow-500",
      };
    default:
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "bg-blue-100 text-blue-600",
        dot: "bg-blue-500",
      };
  }
};

// Format date helper
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  // If less than 24 hours, show relative time
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `منذ ${minutes} دقيقة`;
  } else if (diffInHours < 24) {
    return `منذ ${Math.floor(diffInHours)} ساعة`;
  } else if (diffInDays < 7) {
    return `منذ ${Math.floor(diffInDays)} يوم`;
  }

  // Otherwise show formatted date
  return date.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Group activities by date
const groupActivitiesByDate = (activities) => {
  const groups = {};

  activities.forEach((activity) => {
    const date = new Date(activity.createdAt);
    const dateKey = date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });

  return groups;
};

export default function Activities() {
  const [deleteModal, setDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Filters
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchValue] = useDebounce(search, 1000);
  const [selectedUser, setSelectedUser] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [message, setMessage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setUsersLoading(true);
        const { data } = await axiosClient.get(`/users`);
        setUsers(data.data);
      } catch (error) {
        console.log(error);
        if (error.response) {
          setMessage({ type: "error", message: error.response.data.message });
        } else {
          setMessage({ type: "error", message: error.message });
        }
      } finally {
        setUsersLoading(false);
      }
    };
    fetchData();
  }, []);

  // Intersection Observer Ref
  const loadMoreRef = useRef(null);

  // Fetch activities from API
  const fetchActivities = async (currentPage = 1, append = false) => {
    try {
      if (append) setIsFetchingMore(true);
      else setIsLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      console.log(selectedUser);

      if (searchValue) params.append("search", searchValue);
      if (selectedUser) params.append("createdBy", selectedUser);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await axiosClient.get(`/activities?${params}`);

      if (response?.data?.success) {
        const newActivities = response?.data?.data || [];
        const { total = 0, pages = 1 } = response.data;

        if (append) {
          setActivities((prev) => [...prev, ...newActivities]);
        } else {
          setActivities(newActivities);
        }

        setTotal(total);
        setTotalPages(pages);
        setHasMore(currentPage < pages);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      setMessage({
        type: "error",
        text: "فشل في تحميل الأنشطة. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  // Initial fetch/Reset
  useEffect(() => {
    setPage(1);
    setActivities([]);
    fetchActivities(1, false);
  }, [searchValue, selectedUser, startDate, endDate]);

  // Load more when page changes (not really, we change page when we scroll)
  const handleLoadMore = () => {
    if (hasMore && !isFetchingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchActivities(nextPage, true);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetchingMore &&
          !isLoading
        ) {
          handleLoadMore();
        }
      },
      { threshold: 1.0 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isFetchingMore, isLoading, page]);

  const handleClearDateRange = () => {
    setStartDate("");
    setEndDate("");
  };

  const groupedActivities = groupActivitiesByDate(activities);

  console.log(groupedActivities);

  return (
    <div className="" dir="rtl">
      <Message message={message} setMessage={setMessage} />

      {/* العنوان */}
      <Title
        count={activities?.length}
        title="الأنشطة"
        subTitle="إدارة جميع أنشطة المتجر"
      />

      {/* Filters */}
      <FiltersCombonent
        placeholder={"أبحث بالنشاط ..."}
        searchField
        search={search}
        setSearch={setSearch}
        dateRange={true}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        onClearDateRange={handleClearDateRange}
        comboboxsLoading={filtersLoading}
        comboBoxes={[
          {
            placeholder: "اختر المستخدم",
            value: selectedUser,
            onChange: (value) => setSelectedUser(value),
            items: users.map((user) => ({
              _id: user.userName,
              name: user.userName,
            })),
            byId: true,
            isLoading: usersLoading,
          },
        ]}
      />

      {/* Activities Timeline */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="px-4 pb-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    إجمالي الأنشطة
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {total}
                  </p>
                </div>
                <div className="bg-blue-500 rounded-xl p-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">نجحت</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {activities.filter((a) => a.severity === "success").length}
                  </p>
                </div>
                <div className="bg-green-500 rounded-xl p-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">تحذيرات</p>
                  <p className="text-2xl font-bold text-yellow-900 mt-1">
                    {activities.filter((a) => a.severity === "warning").length}
                  </p>
                </div>
                <div className="bg-yellow-500 rounded-xl p-3">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">أخطاء</p>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {activities.filter((a) => a.severity === "error").length}
                  </p>
                </div>
                <div className="bg-red-500 rounded-xl p-3">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Activities Timeline */}
          {activities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gray-100 rounded-full p-6 mb-4">
                  <Clock className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  لا توجد أنشطة
                </h3>
                <p className="text-gray-500">
                  لم يتم العثور على أي أنشطة تطابق معايير البحث
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(
                ([date, dayActivities]) => (
                  <div key={date} className="relative">
                    {/* Date Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-semibold text-gray-700">
                          {date}
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* Activities for this date */}
                    <div className="space-y-3 mr-8">
                      {dayActivities.map((activity, index) => {
                        const styles = getSeverityStyles(activity.severity);
                        return (
                          <div key={activity._id} className="relative group">
                            {/* Timeline dot */}
                            <div
                              className={`absolute -right-10 top-6 w-4 h-4 rounded-full ${styles.dot} ring-4 ring-white`}
                            ></div>

                            {/* Timeline line */}
                            {index < dayActivities.length - 1 && (
                              <div className="absolute -right-8 top-10 w-0.5 h-full bg-gray-200"></div>
                            )}

                            {/* Activity Card */}
                            <div
                              className={`${styles.bg} ${styles.border} border rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.01]`}
                            >
                              <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div
                                  className={`${styles.icon} rounded-xl p-3 flex-shrink-0`}
                                >
                                  {getActionIcon(
                                    activity.actionType,
                                    activity.severity,
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-2">
                                    <h4 className="text-base font-semibold text-gray-900">
                                      {activity.action}
                                    </h4>
                                    <span className="text-sm text-gray-500 whitespace-nowrap">
                                      {formatDateTime(activity.createdAt)}
                                    </span>
                                  </div>

                                  <p className="text-sm text-gray-600 mb-2">
                                    {activity.details}
                                  </p>

                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <User className="w-3 h-3" />
                                    <span>بواسطة: {activity.createdBy}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          <div
            ref={loadMoreRef}
            className="flex justify-center p-4 min-h-[50px] items-center"
          >
            {isFetchingMore && <LoadingSpinner small />}
            {!hasMore && activities.length > 0 && (
              <p className="text-gray-400 text-sm italic">
                تم تحميل جميع الأنشطة
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
