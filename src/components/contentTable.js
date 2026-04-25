"use client";
import React, { useEffect, useState } from "react";
import NoData from "./NoData";
import { NumericFormat } from "react-number-format";
import Button from "./Button";
import Pagination from "./Pagination";
import { XCircleIcon, Clock, AlertCircle, CheckCircle, TrendingUp, Calendar, User, Zap, Activity, DollarSign, Package, Tag, Info } from "lucide-react";

const ContentTable = ({
  data,
  header,
  ignore,
  id,
  actions = [],
  actionsLoading = false,
  nodata,
  Nolinks = false,
  navigation = [],
  onNavigateChange = () => { },
  withBtn = false,
  btnProps = [],
  checkbox = false,
  onCheck = () => { },
  onAllCheck = () => { },
  problems = false,
  noLinks = false,
  totalPages,
  setPage,
  setLimit,
  page,
  limit,
  smallSection = false,
}) => {
  const [navigateFilter, setNavigateFilter] = useState(
    navigation[0]?.value || ""
  );

  useEffect(() => {
    onNavigateChange(navigateFilter);
  }, [navigateFilter, onNavigateChange]);

  let cols = header.length;
  if (checkbox) cols += 1;
  if (actions.length > 0) cols += 1;

  // Utility Functions
  const formatDate = (dateString) => {
    try {
      const [day, month, year] = dateString.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isDateExpired = (dateString) => {
    try {
      const [day, month, year] = dateString.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      return date < new Date();
    } catch {
      return false;
    }
  };

  const daysUntilRenewal = (dateString) => {
    try {
      const [day, month, year] = dateString.split('-');
      const date = new Date(`${year}-${month}-${day}`);
      const today = new Date();
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const getIconForKey = (key) => {
    if (key.toLowerCase() === 'subscriptionprice') return TrendingUp;
    if (key.toLowerCase() === 'renewdate') return Calendar;
    if (key.toLowerCase() === 'name') return User;
    return Zap;
  };

  // Mobile Card Content Section - Modern Grid Design
  const MobileCardContent = ({ row, headerLabels, ignoreKeys }) => {
    const visibleKeys = Object.keys(row).filter((key) => !ignoreKeys?.includes(key));

    const ICON_VARIANTS = [
      { icon: Zap, color: "from-blue-500 to-blue-600" },
      { icon: TrendingUp, color: "from-emerald-500 to-emerald-600" },
      { icon: Calendar, color: "from-amber-500 to-amber-600" },
      { icon: User, color: "from-purple-500 to-purple-600" },
      { icon: Activity, color: "from-rose-500 to-rose-600" },
      { icon: DollarSign, color: "from-cyan-500 to-cyan-600" },
      { icon: Package, color: "from-orange-500 to-orange-600" },
      { icon: Tag, color: "from-indigo-500 to-indigo-600" },
    ];

    return (
      <div className="px-2 py-2">
        <div className="space-y-2">
          {visibleKeys.map((key, idx) => {
            const headerLabel = headerLabels?.[idx] || key.replace(/([A-Z])/g, ' $1').trim();
            const lowerKey = key.toLowerCase();
            const isPrice = lowerKey.includes('price') || lowerKey.includes('cost') || lowerKey.includes('total') || lowerKey.includes('balance') || lowerKey.includes('amount');
            const isRenewal = lowerKey === 'renewdate';

            const variant = ICON_VARIANTS[idx % ICON_VARIANTS.length];
            const IconComponent = variant.icon;

            const getRawValue = (val) => {
              if (val === null || val === undefined) return "";
              if (typeof val === 'object' && !React.isValidElement(val)) {
                return val.name || val.label || val.value || val.title || val.cost || val.amount || "[بيانات معقدة]";
              }
              return val;
            };

            const rawValue = row[key];
            const displayValue = getRawValue(rawValue);
            const isReactElement = React.isValidElement(displayValue);

            return (
              <div
                key={key}
                className="group relative bg-gradient-to-r from-transparent to-gray-50 rounded-lg p-2 border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-0.5 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${variant.color} flex items-center justify-center text-white shadow-sm`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-start">
                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                      {headerLabel}
                    </span>

                    {/* Value */}
                    {isPrice && !isReactElement && typeof displayValue !== 'object' ? (
                      <div className="flex items-baseline justify-start gap-1">
                        <span className="text-lg font-bold text-gray-900">
                          {String(displayValue).replace(/[^0-9.]/g, '') ? (
                            <NumericFormat
                              value={String(displayValue).replace(/[^0-9.]/g, '')}
                              displayType={"text"}
                              thousandSeparator={true}
                            />
                          ) : (
                            displayValue
                          )}
                        </span>
                        {String(displayValue).replace(/[^0-9.]/g, '') && (
                          <span className="text-[10px] text-gray-500 font-bold">ج.م</span>
                        )}
                      </div>
                    ) : isRenewal && !isReactElement ? (
                      <div className="space-y-1 text-start">
                        <div className={`flex items-center justify-start gap-1.5 font-bold text-sm ${isDateExpired(displayValue)
                          ? 'text-red-600'
                          : 'text-emerald-600'
                          }`}>
                          {isDateExpired(displayValue) ? (
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span>{formatDate(displayValue)}</span>
                        </div>
                        {daysUntilRenewal(displayValue) !== null && (
                          <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>
                              {isDateExpired(displayValue)
                                ? `منتهي منذ ${Math.abs(daysUntilRenewal(displayValue))} يوم`
                                : daysUntilRenewal(displayValue) === 0
                                  ? 'اليوم'
                                  : `${daysUntilRenewal(displayValue)} يوم`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-900 font-semibold text-sm block break-words leading-tight text-start">
                        {displayValue}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 w-full">
      {data && data.length > 0 ? (
        <>
          {/* TABLE VIEW (for md and larger) */}
          <div
            dir="rtl"
            className={`hidden md:block w-full overflow-x-auto ${smallSection ? "" : "min-h-[70vh]"
              }`}
          >
            <table className="w-full text-gray-700 lg:text-md text-sm text-center rtl:text-center border-collapse">
              <thead className="text-sm lg:text-md text-black uppercase bg-gray-200 font-bold">
                <tr>
                  {checkbox && (
                    <th className="p-4 w-14">
                      <input
                        type="checkbox"
                        onChange={(e) => onAllCheck(e.target.checked)}
                      />
                    </th>
                  )}
                  {header.map((head) => (
                    <th key={head} className="px-6 py-4 whitespace-nowrap">
                      {head}
                    </th>
                  ))}
                  {actions.length > 0 && <th className="px-6 py-4"></th>}
                </tr>
              </thead>

              <tbody>
                {data.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className={`${new Date(
                      row["renewDate"]?.split("-").reverse().join("-")
                    ) < new Date()
                      ? "hover:bg-red-300 bg-red-200"
                      : "hover:bg-gray-50 bg-white"
                      } border-b border-gray-200 ${(row["statusValue"] == "cancelled" || row["stock"] == 0) && "!bg-red-100 hover:!bg-red-200"}`}
                  >
                    {checkbox && (
                      <td className="p-3 w-14">
                        <input
                          type="checkbox"
                          checked={row["readed"]}
                          onChange={(e) => onCheck(e.target.checked, row.id)}
                        />
                      </td>
                    )}
                    {id && (
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {row.id}
                      </td>
                    )}
                    {Object.keys(row)
                      .filter((key) => !ignore?.includes(key))
                      .map((key, idx) => (
                        <td
                          key={idx}
                          className="px-6 py-4 truncate max-w-[200px] whitespace-nowrap text-start md:text-center"
                        >
                          {key.toLowerCase() === "subscriptionprice" ? (
                            <NumericFormat
                              value={row["subscriptionPrice"]}
                              displayType={"text"}
                              thousandSeparator={true}
                              prefix={"ج "}
                            />
                          ) : key.toLowerCase() === "renewdate" ? (
                            <span
                              className={`font-semibold ${new Date(
                                row["renewDate"]?.split("-").reverse().join("-")
                              ) < new Date()
                                ? "text-red-600"
                                : "text-green-600"
                                }`}
                            >
                              {row["renewDate"]}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-800">
                              {row[key]}
                            </span>
                          )}
                        </td>
                      ))}
                    {actions.length > 0 && (
                      <td>
                        {row["role"] != "مدير" &&
                          <div className="flex justify-center items-center p-2 w-full h-full">
                            {actions.map((action, idx) => {
                              // console.log(!action);
                              if (!action) return null;
                              return (
                                <div key={idx} className="ml-2">
                                  <Button
                                    disabled={(row["statusValue"] == "cancelled" && action.Icon == XCircleIcon) ||
                                      actionsLoading ||
                                      (action.disabled && action.disabled(row.id))
                                    }
                                    color={action.color}
                                    Icon={action.Icon || null}
                                    label={action.label || null}
                                    onClick={() => action.action(row, idx)}
                                    {...action.props}
                                  />
                                </div>
                              )
                            })}
                          </div>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARD VIEW (for small screens) - UPGRADED WITH PREMIUM DESIGN */}
          <div className="md:hidden bg-gradient-to-br  min-h-screen p-3 space-y-3">
            {data.map((row, index) => {
              const isAdmin = row['role'] === 'admin';

              return (
                <div
                  key={index}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:border-gray-300"
                >

                  {/* ============ ADMIN BADGE ============ */}
                  {isAdmin && (
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200 px-4 py-2 flex justify-center">
                      <span className="inline-block px-8 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">
                        Admin
                      </span>
                    </div>
                  )}

                  {/* ============ ACTIONS SECTION ============ */}
                  {row["role"] !== "مدير" && actions.length > 0 && (
                    <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex gap-2 justify-start flex-wrap rtl:flex-row-reverse">
                      {actions.map((action, idx) => {
                        if (!action) return null;

                        const isDisabled = actionsLoading ||
                          (action.disabled && action.disabled(row.id)) ||
                          (row["statusValue"] === "cancelled" && action.Icon === XCircleIcon);
                        return (
                          <div key={idx} className=" ">
                            <Button
                              fixedPadding="3"
                              disabled={isDisabled}
                              color={action.color}
                              Icon={action.Icon || null}
                              label={action.label || null}
                              onClick={() => action.action(row, idx)}
                              small
                              variant="filled"
                              rounded="lg"
                              {...(action.props || {})}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ============ CONTENT SECTION (MODERN GRID DESIGN) ============ */}
                  <MobileCardContent
                    row={row}
                    headerLabels={header}
                    ignoreKeys={ignore}
                  />



                </div>
              );
            })}
          </div>

          {!smallSection && totalPages > 1 && (
            <Pagination
              currentPage={page}
              limit={limit}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => setLimit(l)}
            />
          )}
        </>
      ) : (
        <div className="p-20">
          <NoData data={nodata} />
        </div>
      )}
    </div>
  );
};

export default ContentTable;