import { ShoppingCart, Package } from "lucide-react";

const NoData = ({ cart = false, data = "لا توجد بيانات" }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
                {cart ? (
                    <ShoppingCart className="w-16 h-16 text-gray-400" />
                ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                )}
            </div>
            <p className="text-gray-600 text-lg font-medium text-center">{data}</p>
            <p className="text-gray-400 text-sm mt-2 text-center">
                {cart ? "ابدأ بإضافة المنتجات من القائمة" : "لا توجد عناصر لعرضها"}
            </p>
        </div>
    );
};

export default NoData;