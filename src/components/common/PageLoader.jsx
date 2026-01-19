import React from "react";

export default function PageLoader({ loading, minHeight = "60vh" }) {
  if (!loading) return null;

  return (
    <div
      style={{
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="table-spinner" />
    </div>
  );
}
