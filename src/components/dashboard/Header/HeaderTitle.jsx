import React from "react";

export default function HeaderTitle({ title, description }) {
  return (
    <div className="px-2 pt-4 pb-3 lg:px-7 lg:pt-6 lg:pb-4">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-lg lg:text-2xl font-semibold text-primary leading-tight truncate">
          {title}
        </h1>
        <p className="text-xs lg:text-sm text-muted-foreground mt-1 hidden sm:block">{description}</p>
      </div>
    </div>
  );
}
