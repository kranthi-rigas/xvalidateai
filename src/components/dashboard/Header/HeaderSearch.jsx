import React from "react";

export default function HeaderSearch({ placeholder = "Search tools, vendors..." }) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 bg-muted border border-transparent focus:border-primary focus:bg-white rounded-lg text-sm w-64 transition-all outline-none"
      />
      <i className="fa-solid fa-search absolute left-3 top-2.5 text-muted-foreground text-sm"></i>
    </div>
  );
}