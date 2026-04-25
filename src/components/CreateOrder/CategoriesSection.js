import React from "react";
import NoData from "../NoData";
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/scrollbar";
import "swiper/css/navigation";

const CategoriesSection = ({
    categoryLoading = true,
    categories = [],
    selectedCategory,
    setSelectedCategory,
}) => {
    return (
        <div className="space-y-4 lg:col-span-2 bg-white shadow-sm p-6 rounded-xl">
            {/* header */}
            <div className="flex justify-between items-center space-x-4 w-full">
                <div className="flex justify-start items-center space-x-3 w-1/2">
                    <div className="gap-0.5 grid grid-cols-2 translate-y-1">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="bg-green-500 rounded-full size-2" />
                        ))}
                    </div>
                    <h1 className="w-fit font-bold text-gray-900 text-2xl">جميع الفئات</h1>
                </div>
            </div>

            {/* skeleton or categories */}
            {categoryLoading ? (
                // 🟢 Skeleton Loader
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <div
                            key={index}
                            className="animate-pulse bg-gray-200 rounded-full w-full h-[80px]"
                        />
                    ))}
                </div>
            ) : categories && categories.length > 0 ? (
                // 🟢 Categories List
                <div className="relative">
                    <Swiper
                        slidesPerView={8}
                        spaceBetween={20}
                        loop={true}
                        className="w-full !p-4 category-swiper !mx-auto"
                        breakpoints={{
                            320: { slidesPerView: 3, spaceBetween: 10 },
                            480: { slidesPerView: 3, spaceBetween: 15 },
                            640: { slidesPerView: 4, spaceBetween: 15 },
                            768: { slidesPerView: 5, spaceBetween: 20 },
                            1024: { slidesPerView: 5, spaceBetween: 20 },
                            1280: { slidesPerView: 6, spaceBetween: 20 },
                            1480: { slidesPerView: 8, spaceBetween: 20 },
                        }}
                    >
                        {categories.map((category) => (
                            <SwiperSlide key={category._id}>
                                <div
                                    onClick={() =>
                                        selectedCategory === category._id
                                            ? setSelectedCategory(null)
                                            : setSelectedCategory(category._id)
                                    }
                                    className={`${selectedCategory === category._id
                                        ? "border border-green-500"
                                        : "border border-gray-200 hover:border-gray-400"
                                        } cursor-pointer rounded-full bg-gray-200 w-full text-center flex justify-center items-center !h-[80px] p-2 font-semibold text-black transition-all duration-300 hover:transform hover:scale-105`}
                                >
                                    {category.name}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            ) : (
                // 🟢 No Data
                <div>
                    <NoData data="فئات" />
                </div>
            )}
        </div>
    );
};

export default CategoriesSection;
