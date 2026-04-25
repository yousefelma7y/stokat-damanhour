import React from "react";

const ActionButton = ({
    label,
    onClick,
    variant = "primary",
    disabled = false,
    loading = false,
    icon: Icon,
}) => {
    const baseClass =
        "w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary:
            "bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600",
        success:
            "bg-green-600 text-white hover:bg-green-700 disabled:hover:bg-green-600",
        warning:
            "bg-yellow-600 text-white hover:bg-yellow-700 disabled:hover:bg-yellow-600",
        danger: "bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600",
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClass} ${variants[variant]} cursor-pointer`}
        >
            {Icon && <Icon className="w-5 h-5" />}
            {loading ? "جاري المعالجة..." : label}
        </button>
    );
};

export default ActionButton;