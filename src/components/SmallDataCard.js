import React from "react";
import Button from "./Button";
import {
    Edit,
    Plus,
    PlusIcon,
    Trash2,
    Layers3,
    Tag,
    Package,
    Store,
} from "lucide-react";

const SmallDataCard = ({
    data = [],
    handleEdit,
    setDeleteModal,
    nodata = "",
    addItem,
    type = "brand",
    role = "",
}) => {
    const getIcon = () => {
        switch (type) {
            case "category":
                return <Layers3 size={22} className="text-indigo-600" />;
            case "product":
                return <Package size={22} className="text-green-600" />;
            case "store":
                return <Store size={22} className="text-amber-600" />;
            default:
                return <Tag size={22} className="text-blue-600" />;
        }
    };

    return (
        <div className="p-6">
            {/* Data Grid */}
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {data.map((item) => (
                    <div
                        key={item._id}
                        className="group relative flex flex-col justify-between bg-white border border-gray-200/70 hover:border-indigo-200 shadow-sm hover:shadow-lg p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                        {/* Icon + Name */}
                        <div className="flex items-start gap-3">
                            <div className="flex justify-center items-center w-12 h-12 bg-indigo-50 group-hover:bg-indigo-100 rounded-xl transition-colors">
                                {getIcon()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-gray-900 text-lg capitalize truncate">
                                    {item.name}
                                </h2>
                                {item.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                        {item.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Bottom Section */}
                        <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-100">
                            <span className="text-sm text-gray-500">
                                آخر تحديث:{" "}
                                <span className="text-gray-700 font-medium">
                                    {item.updatedAt
                                        ? new Date(item.updatedAt).toLocaleDateString("ar-EG")
                                        : "—"}
                                </span>
                            </span>

                            {role === "admin" && <div className="flex items-center gap-2">
                                <Button
                                    onClick={() => handleEdit(item)}
                                    variant="filled"
                                    Icon={Edit}
                                    rounded="full"
                                    color="babyBlue"
                                    tooltip="تعديل"
                                />
                                <Button
                                    onClick={() => setDeleteModal(item._id)}
                                    variant="filled"
                                    Icon={Trash2}
                                    rounded="full"
                                    color="danger"
                                    tooltip="حذف"
                                />
                            </div>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {data.length === 0 && (
                <div className="flex flex-col justify-center items-center mt-16 bg-gradient-to-br from-gray-50 to-white border border-gray-100 py-20 rounded-3xl shadow-sm text-center">
                    <div className="flex justify-center items-center mb-5 w-20 h-20 bg-indigo-50 rounded-2xl">
                        <Plus size={40} className="text-indigo-500" />
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 text-2xl">
                        لا توجد {nodata}
                    </h3>
                    <p className="mb-8 text-gray-500 text-sm">
                        قم بإضافة {nodata} جديد لتوسيع متجرك بسهولة
                    </p>
                    <Button
                        Icon={PlusIcon}
                        onClick={addItem}
                        label={`إضافة ${nodata}`}
                        variant="filled"
                        rounded="xl"
                        fixedPadding="4"
                    />
                </div>
            )}
        </div>
    );
};

export default SmallDataCard;
