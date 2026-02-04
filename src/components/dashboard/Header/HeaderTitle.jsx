import React from "react";

export default function HeaderTitle({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}