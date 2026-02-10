import React from "react";

export default function HeaderTitle({ title, description }) {
  return (
    <div className="px-6 mb-6">
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
