import React from "react";
import { SHOW_CREDITS } from "@/config/features";

export default function CreditInfoNote({
  text = "Each assessment consumes 10 credits",
}) {
  // Credits are hidden product-wide for now; this note is only about them.
  if (!SHOW_CREDITS) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 14,
        fontSize: 13,
        color: "#1D4ED8", // 🔵 info blue
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
          color: "#0f3053",
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
