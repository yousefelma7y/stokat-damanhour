import Button from "../Button";
import { Minus, Plus, Trash2, AlertCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { NumericFormat } from "react-number-format";

const CartItem = ({
    item,
    onQuantityIncrement,
    onQuantityDecrement,
    onPriceChange,
    onDelete,
    orderType
}) => {

    const getInitialPrice = () => {
        if (item.price !== undefined && item.price !== null && item.price > 0) {
            return item.price;
        }
        return item.price || 0;
    };

    const [localPrice, setLocalPrice] = useState(getInitialPrice());
    const [priceError, setPriceError] = useState(false);

    useEffect(() => {
        if (item.price !== undefined && item.price !== null) {
            setLocalPrice(item.price);
            setPriceError(orderType === 'exchange' ? false : item.price <= 0);
        }
    }, [item.price, orderType]);

    // ✅ UPDATED: Pass size and itemType parameters to onPriceChange
    const handlePriceChange = useCallback((e) => {
        const value = e.target.value;

        if (value === "") {
            setLocalPrice("");
            setPriceError(true);
            return;
        }

        const numValue = parseFloat(value);
        setLocalPrice(value);

        if (isNaN(numValue) || numValue < 0) {
            setPriceError(true);
        } else if (numValue === 0) {
            setPriceError(true);
            onPriceChange(item._id, item.size, 0, item.itemType);
        } else {
            setPriceError(false);
            onPriceChange(item._id, item.size, numValue, item.itemType);
        }
    }, [item._id, item.size, item.itemType, onPriceChange]);

    // ✅ UPDATED: Pass size and itemType parameters to onPriceChange
    const handlePriceBlur = useCallback(() => {
        if (localPrice === "" || isNaN(parseFloat(localPrice)) || parseFloat(localPrice) <= 0) {
            const initialPrice = getInitialPrice();
            setLocalPrice(initialPrice);
            onPriceChange(item._id, item.size, initialPrice, item.itemType);
            setPriceError(initialPrice <= 0);
        }
    }, [localPrice, item._id, item.size, item.itemType, onPriceChange]);

    const itemTotal = (parseFloat(localPrice) || 0) * item.quantity;
    const isAtMinQuantity = item.quantity <= 1;
    const isAtMaxQuantity = item.quantity >= (item.stock || 0);
    const isLowStock = item.stock && item.stock <= 5;

    // ✅ NEW: Check if this is a scrap item
    const isScrapItem = item.isScrap || item.itemType === 'scrap';

    return (
        <div className={`flex w-full gap-3 rounded-xl p-3 shadow-md border-2 transition-all hover:shadow-lg ${isScrapItem
            ? 'bg-orange-50 border-orange-300'
            : priceError
                ? 'bg-gray-200 border-red-300'
                : 'bg-gray-200 border-gray-100'
            }`}>
            {/* Left Section - Product Info */}
            <div className="flex flex-1 flex-col justify-between space-y-2">
                {/* Product Name with Size Badge and Scrap Badge */}
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="line-clamp-2 font-bold text-gray-900 text-sm leading-tight capitalize">
                            {item.name}
                        </h1>
                        {/* ✅ NEW: Scrap Badge */}
                        {isScrapItem && (
                            <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                تالف
                            </span>
                        )}
                    </div>
                    {/* ✅ Size Badge - Always show if size exists */}
                    {item.size && (
                        <div className="mt-1 inline-block bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            مقاس {item.size}
                        </div>
                    )}
                </div>
                {/* Price input with validation - Hidden/Disabled for exchange */}
                {!isScrapItem && orderType !== 'exchange' && <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                disabled
                                type="number"
                                className={`w-full rounded-lg border-2 px-3 py-2 text-sm font-semibold focus:outline-none transition-all ${priceError
                                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50'
                                    : isScrapItem
                                        ? 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white'
                                        : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                                    }`}
                                value={localPrice}
                                onChange={handlePriceChange}
                                onBlur={handlePriceBlur}
                                min="0"
                                step="0.01"
                                placeholder="السعر"
                            />
                            {priceError && (
                                <AlertCircle className="absolute left-2 top-1/2 -translate-y-1/2 text-red-500 size-4" />
                            )}
                        </div>
                        <span className="text-xs text-gray-700 font-bold whitespace-nowrap">
                            EGP
                        </span>
                    </div>
                    {priceError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="size-3" />
                            أدخل سعر صحيح
                        </p>
                    )}
                </div>}

                {/* Show 0 price label for exchange */}
                {orderType === 'exchange' && !isScrapItem && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <span className="text-blue-700 font-bold text-sm">استبدال مجاني (0 EGP)</span>
                    </div>
                )}

                {/* Item total */}
                {!isScrapItem && <div className={`rounded-lg px-3 py-2 border ${isScrapItem
                    ? 'bg-orange-100 border-orange-300'
                    : 'bg-green-50 border-green-200'
                    }`}>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 font-medium">الإجمالي:</span>
                        <span className={`text-sm font-bold ${isScrapItem ? 'text-orange-700' : 'text-green-700'
                            }`}>
                            {itemTotal.toFixed(2)} EGP
                        </span>
                    </div>
                </div>}
            </div>

            {/* Right Section - Controls */}
            <div className="flex flex-col justify-between items-end space-y-2 min-w-[90px]">
                {/* Quantity controls - ✅ UPDATED: Pass size and itemType parameters */}
                {orderType != "replacement" && <div className="w-full">
                    <div className={`flex items-center justify-center rounded-xl border-2 px-2 py-1.5 ${isScrapItem
                        ? 'bg-orange-100 border-orange-300'
                        : 'bg-green-50 border-green-200'
                        }`}>
                        <Button
                            small
                            color="info"
                            disabled={isAtMinQuantity}
                            onClick={() => onQuantityDecrement(item._id, item.size, item.itemType)}
                            Icon={Minus}
                            rounded={"full"}
                        />
                        <p className={`flex-1 text-center font-bold text-base min-w-[30px] ${isScrapItem ? 'text-orange-800' : 'text-green-800'
                            }`}>
                            {item.quantity}
                        </p>
                        <Button
                            small
                            color="info"
                            disabled={isAtMaxQuantity}
                            onClick={() => onQuantityIncrement(item._id, item.size, item.itemType)}
                            Icon={Plus}
                            rounded={"full"}
                        />
                    </div>
                </div>}

                {/* Stock indicator */}
                {!isScrapItem && item.stock && (
                    <div className={`text-xs text-center px-2 py-1 rounded-lg font-semibold ${isLowStock
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                        متاح: {item.stock}
                    </div>
                )}

                {/* Delete button - ✅ UPDATED: Pass size and itemType parameters */}
                <Button
                    small
                    color="danger"
                    variant="filled"
                    onClick={() => onDelete(item._id, item.size, item.itemType)}
                    Icon={Trash2}
                    rounded={"full"}
                />
            </div>
        </div>
    );
};

export default CartItem;
