import React, { ElementType } from "react";
import { IconType } from "react-icons"; // Import IconType if you're using react-icons

const Button = ({
  type = "button",
  isLoading = false,
  label,
  variant = "outlined",
  color = "default",
  Icon,
  disabled = false,
  onClick,
  leftRadiusNone = false,
  rounded,
  rightRadiusNone = false,
  dropshadow = false,
  border = true,
  onMouseEnter = () => { },
  onMouseLeave = () => { },
  fixedPadding,
  rightIcon = false,
  large = false,
  small = false
}) => {
  // ... rest of the existing implementation remains the same
  const getColorClass = () => {
    if (variant === "filled") {
      switch (color) {
        case "danger":
          return "border-red-700 bg-red-700 hover:bg-red-800 text-white";
        case "warning":
          return "border-amber-500 bg-amber-500 hover:bg-amber-600 text-white";
        case "blue":
          return "border-blue-500 bg-blue-500 hover:bg-blue-600 text-white";
        case "babyBlue":
          return "border-[#5696DB] bg-[#5696DB] hover:bg-[#468CD8] text-white";
        case "lightblue":
          return "border-blue-500 bg-blue-500 hover:bg-blue-600 text-white";
        case "indigo":
          return "border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white";
        case "yellow":
          return "border-yellow-600 bg-yellow-600 hover:bg-yellow-700 text-white";
        case "black":
          return "border-black bg-black hover:bg-black-400 text-white";
        case "info":
          return "border-gray-500  bg-gray-500 text-white hover:bg-gray-600";
        case "white":
          return "border-gray-200 bg-white text-green-700 hover:bg-green-700 hover:text-white";
        case "lightGreen":
          return "border-green-500 bg-green-500 text-white hover:bg-green-600 text-green-500 hover:text-white";
        case "Postage":
          return "border-[#10B981] bg-[#10B981] hover:bg-[#0c8d62] text-white hover:text-white";
        default:
          return "border-green-500 bg-green-700 text-white hover:bg-green-800 text-green-700 hover:text-white";
      }
    }
    switch (color) {
      case "danger":
        return "border-red-700 text-red-700 hover:bg-red-800 hover:text-white";
      case "warning":
        return "border-amber-500 hover:bg-amber-500 text-amber-500 hover:text-white";
      case "blue":
        return "border-blue-700 hover:bg-blue-700  text-blue-700 hover:text-white";
      case "lightblue":
        return "border-blue-500 hover:bg-blue-500  text-blue-600 hover:text-white";
      case "yellow":
        return "border-yellow-600 hover:bg-yellow-600  text-yellow-600 hover:text-white";
      case "info":
        return "border-gray-600 hover:bg-gray-200 text-gray-600 hover:text-gray-700";
      case "white":
        return "border-gray-200  text-white hover:bg-white hover:text-green-500 hover:border-green-500";
      case "lightGreen":
        return "border-green-500 border-2 text-green-500 hover:text-white hover:bg-green-500";
      default:
        return "border-green-700 hover:bg-green-800 text-green-700 hover:text-white";
    }
  };

  const getRoundedClass = () => {
    switch (rounded) {
      case "lg":
        return "rounded-lg";
      case "xl":
        return "rounded-xl";
      case "2xl":
        return "rounded-2xl";
      case "3xl":
        return "rounded-3xl";
      case "full":
        return "rounded-full";
      default:
        return "";
    }
  };

  const getPaddingClass = () => {
    switch (fixedPadding) {
      case "2":
        return "p-2";
      case "3":
        return "p-3";
      case "4":
        return "p-4";
      case "5":
        return "p-5";
      case "6":
        return "p-6";
      case "8":
        return "p-8";
      default:
        return "";
    }
  };

  return (
    <button
      suppressHydrationWarning
      dir="ltr"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`cursor-pointer ${getColorClass()} ${getRoundedClass()} ${leftRadiusNone && "rounded-l-none"
        } 
      ${rightRadiusNone && "rounded-r-none"} ${dropshadow && "drop-shadow"} 
      flex ${large && "w-full h-11"
        }  select-none items-center justify-center space-x-2 overflow-hidden text-center 
      ${border && "border"} ${small ? "p-1 px-2" : fixedPadding ? getPaddingClass() : "px-3 py-2"
        }  text-sm font-medium transition-all
      ${!disabled && "active:scale-95"
        } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {/* Show Icon if provided, and show loading spinner of loading */}
      {!rightIcon && isLoading ? (
        <span className={`${label && "mr-1"} `}>
          {/* Loading Spinner */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 animate-spin"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a7 7 0 017 7v1a1 1 0 11-2 0v-1a5 5 0 00-5-5 1 1 0 110-2z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      ) : (
        // Icon
        !rightIcon &&
        Icon && (
          <span className={`${label && "-mt-[1px] mr-1"}`}>
            <Icon className="size-5" />
          </span>
        )
      )}
      {label && <span className={`${Icon && ""}`}>{label}</span>}
      {rightIcon && isLoading ? (
        <span className={`${label && "mr-1"}`}>
          {/* Loading Spinner */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-5 animate-spin"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a7 7 0 017 7v1a1 1 0 11-2 0v-1a5 5 0 00-5-5 1 1 0 110-2z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      ) : (
        // Icon
        rightIcon &&
        Icon && (
          <span className={`${label && "-mt-[1px] mr-6"} `}>
            <Icon className="size-5" />
          </span>
        )
      )}
    </button>
  );
};

export default Button;
