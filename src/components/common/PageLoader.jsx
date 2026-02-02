import React from "react";

export default function PageLoader({
  loading,
  minHeight = "60vh",
  message = "Loading...",
}) {
  if (!loading) return null;

  return (
    <div
      style={{
        minHeight,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div className="page-spinner" />
      <div
        style={{
          color: "#001d6c",
          fontSize: "15px",
          fontWeight: 500,
          letterSpacing: "-0.24px",
        }}
      >
        {message}
      </div>
    </div>
  );
}
