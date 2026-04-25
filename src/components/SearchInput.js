"use client";
import React from "react";

const SearchInput = ({ search, setSearch, placeholder }) => {
  return (
    <form className="relative flex items-center sm:space-x-2 w-full ">
      {/*  sm:w-[500px] lg:w-[800px] */}
      <button
        className="absolute left-2 -translate-y-1/2 top-1/2 p-3"
        type="button"
      >
        <svg
          width="20"
          height="20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-labelledby="search"
          className="w-5 h-5 text-primary dark:text-darkSecoundary"
        >
          <path
            d="M7.667 12.667A5.333 5.333 0 107.667 2a5.333 5.333 0 000 10.667zM14.334 14l-2.9-2.9"
            stroke="currentColor"
            strokeWidth="1.333"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <input
        className="text-right rounded-2xl  w-full px-8 py-3 border-2 border-transparent
        focus:outline-none focus:border-secondary bg-white
        placeholder-gray-400  transition-all duration-300 shadow-md"
        placeholder={placeholder}
        required
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button
        type="reset"
        className="absolute right-1 -translate-y-1/2 top-1/2 p-1"
        onClick={() => setSearch("")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-primary dark:text-darkSecoundary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </form>
  );
};

export default SearchInput;
