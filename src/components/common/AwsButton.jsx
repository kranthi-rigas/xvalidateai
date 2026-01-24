import React, { useState } from "react";

export default function AwsButton({ label, disabled = false, onClick, children }) {
  const [hover, setHover] = useState(false);

  // Purple styles for default background button
  const purpleBg = "#2F5FD9";
  const purpleBorder = "##2F5FD9";

  // AWS hover colors
  const hoverBg = "rgb(242,248,253)";
  const darkText = "rgb(15,38,70)";
  const darkBorder = "rgb(15,38,70)";

  return (
    <button
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="lh-1"
      style={{
        padding: "6px 16px",
        minHeight: 32,
        fontSize: "clamp(11px, 2.5vw, 13px)",
        fontWeight: 600,
        fontFamily: "Amazon Ember, sans-serif",
        borderRadius: 24,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 160ms ease",
        whiteSpace: "nowrap",

        // Background
        background: disabled
          ? "#E5E7EB"
          : hover
          ? hoverBg
          : purpleBg,

        // Text color
        color: disabled
          ? "#9CA3AF"
          : hover
          ? darkText
          : "#FFFFFF",

        // Border
        border: `1px solid ${
          disabled ? "#D1D5DB"
          : hover ? darkBorder
          : purpleBorder
        }`,
      }}
    >
      {children && <span style={{ display: "flex" }}>{children}</span>}
      {label}
    </button>
  );
}
