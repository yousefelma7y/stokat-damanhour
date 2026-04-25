import React from "react";
import noData from "../../public/no-data.svg";
import noitemsCart from "../../public/noitemsCart.png";
import Image from "next/image";

const NoData = ({ data = "data", size = "sm", cart = false }) => {
  const getSize = () => {
    switch (size) {
      case "sm":
        return "w-10 h-10";
      case "md":
        return "w-20 h-20";
      case "lg":
        return "w-32 h-32";
      default:
        return "w-10 h-10";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "sm":
        return "text-base";
      case "md":
        return "text-xl";
      case "lg":
        return "text-3xl";
      default:
        return "text-sm";
    }
  };

  return (
    <div className="flex flex-col w-full items-center justify-center space-y-4">
      <Image
        src={!cart ? noData : noitemsCart}
        alt="no-data"
        className={`w-20 md:h-20 lg:w-32 lg:h-32 object-contain`}
      />
      {cart ?
        <h1 className={`text-xl lg:text-3xl font-bold text-gray-500`}>{data} </h1>
        :
        <h1 className={`text-xl lg:text-3xl font-bold text-gray-500`}>
          لا يوجد {data} حتي الآن
        </h1>
      }
    </div>
  );
};

export default NoData;
