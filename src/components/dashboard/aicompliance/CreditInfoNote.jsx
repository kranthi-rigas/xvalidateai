import React from "react";

export default function CreditInfoNote({
  text = "Each assessment consumes 10 credits",
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 14,
        fontSize: 13,
        color: "#1E40AF", // 🔵 info blue
      }}
    >
      {/* Info icon */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#DBEAFE", // soft blue bg
          color: "#1E3A8A",
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        i
      </span>

      <span>{text}</span>
    </div>
  );
}
