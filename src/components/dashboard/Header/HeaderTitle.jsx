import React from "react";

export default function HeaderTitle({ title, description }) {
  return (
    <div className="px-7 pt-6 pb-4">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-2xl font-semibold text-primary leading-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
