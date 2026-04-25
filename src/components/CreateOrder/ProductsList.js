import React from "react";
import { ShoppingBag, Search } from "lucide-react";
import Button from "../Button";
import NoData from "../NoData";
import Pagination from "../Pagination";

const ProductsList = ({
    setProductSearch,
    productSearch,
    productsLoading = true,
    products = [],
    addToCart,
    cart = [],
    totalPages,
    setPage,
    setLimit,
    page,
    limit,
}) => {
    // Helper function to get total quantity of a product in cart (all sizes)
    const getProductQuantityInCart = (productId) => {
        return cart
            .filter(item => item._id === productId)
            .reduce((sum, item) => sum + item.quantity, 0);
    };

    // Helper function to check if any size is available
    const hasAvailableStock = (product) => {
        return product.sizes?.some(size => size.stock > 0) || false;
    };


    return (
        <div className={`space-y-4 lg:col-span-2 bg-white shadow-sm rounded-xl ${products.length > 0 ? "pt-6 px-6 pb-2" : "p-6"}`}>
            {/* Header and Search */}
            <div className="md:flex md:justify-between md:items-center md:space-x-4 space-y-2 md:space-y-0 w-full">
                <div className="flex justify-start items-center space-x-3 w-full md:w-1/2">
                    <ShoppingBag className="text-green-500" />
                    <h1 className="w-fit font-bold text-gray-900 text-2xl">جميع المنتجات</h1>
                </div>
                <div className="relative w-full md:w-1/3">
                    <Search className="top-1/2 left-2 absolute text-gray-500 -translate-y-1/2" />
                    <input
                        type="search"
                        placeholder="أبحث عن المنتج ..."
                        className="p-3 !pl-10 border-2 border-gray-200 rounded-2xl w-full"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Products or Skeleton */}
            {productsLoading ? (
                // 🟢 Skeleton Loading
                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="p-4 justify-between flex flex-col border border-gray-200 rounded-lg animate-pulse space-y-4 h-[320px]"
                        >
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="flex justify-between items-start">
                                <div className="h-3 bg-gray-200 rounded w-1/3" />
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
                            </div>
                            <div className="flex space-x-2 items-center">
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
                            </div>
                            <div className="h-8 bg-gray-200 rounded w-full mt-3" />
                        </div>
                    ))}
                </div>
            ) : products && products.length > 0 ? (
                // 🟢 Product Cards
                <div>
                    <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                        {products.map((product) => {
                            const hasStock = hasAvailableStock(product);
                            const totalInCart = getProductQuantityInCart(product._id);

                            return (
                                <div
                                    key={product._id}
                                    className={`p-4 ${!hasStock
                                            ? "border border-red-200 hover:border-red-400 bg-red-50/30"
                                            : "border border-gray-200 hover:border-indigo-300"
                                        } rounded-lg transition`}
                                >
                                    <div className="space-y-2">
                                        {/* Product Name */}
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-gray-900 capitalize text-lg">
                                                {product.name}
                                            </h3>
                                            {totalInCart > 0 && (
                                                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-semibold">
                                                    في العربة: {totalInCart}
                                                </span>
                                            )}
                                        </div>

                                        {/* Color */}
                                        <div className="flex justify-start items-center gap-2">
                                            <span className="text-gray-600 text-sm">اللون:</span>
                                            <span className="font-medium text-gray-900 text-sm">{product.color}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 text-sm">سعر البيع:</span>
                                                <span className="text-green-600 font-bold text-lg">
                                                    {product.price} ج
                                                </span>
                                            </div>
                                        </div>

                                        {/* Available Sizes */}
                                        <div className="pt-2 border-t border-gray-200">
                                            <p className="text-gray-600 text-xs mb-1">المقاسات المتاحة:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {product.sizes && product.sizes.length > 0 ? (
                                                    product.sizes.map((sizeObj) => (
                                                        <span
                                                            key={sizeObj.size}
                                                            className={`text-xs px-2 py-1 rounded ${sizeObj.stock > 0
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-100 text-gray-400 line-through"
                                                                }`}
                                                        >
                                                            {sizeObj.size} ({sizeObj.stock})
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400 text-xs">لا توجد مقاسات</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Total Stock */}
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-600 text-sm">إجمالي المتاح:</span>
                                            <span className={`font-semibold ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                                                {product.totalStock || 0} قطعة
                                            </span>
                                        </div>

                                        {/* Add to Cart Button */}
                                        <Button
                                            large
                                            disabled={!hasStock}
                                            onClick={() => addToCart(product)}
                                            color={!hasStock ? "danger" : "babyBlue"}
                                            label={!hasStock ? "نفذ المخزون" : "أضف للطلب"}
                                            rounded={"lg"}
                                            variant="filled"
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination
                        currentPage={page}
                        limit={limit}
                        totalPages={totalPages}
                        onPageChange={(p) => setPage(p)}
                        onLimitChange={(l) => setLimit(l)}
                    />
                </div>
            ) : (
                // 🟢 No Data
                <div>
                    <NoData data="منتجات" />
                </div>
            )}
        </div>
    );
};

export default ProductsList;
