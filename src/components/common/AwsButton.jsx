import React, { useState } from "react";
import { COLORS } from "@/styles/colors";

export default function AwsButton({
  label,
  disabled = false,
  onClick,
  children,
  variant = "primary", // "primary" or "secondary"
  type = "button", // "button" or "submit"
}) {
  const [hover, setHover] = useState(false);

  const isSuccess = variant === "success";
  const isDanger = variant === "danger";
  const isOutlineDanger = variant === "outlineDanger";
  // Design system colors
  const primaryBg = "#0F3053";
  const primaryHoverBg = "#007d79";

  // Secondary (outline) button colors
  const secondaryBg = "transparent";
  const secondaryHoverBg = "#007d79"; // becomes solid on hover
  const secondaryBorder = "#0F3053";
  const secondaryText = "#0F3053";

  const isPrimary = variant === "primary";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="lh-1 tool-assessment-btn"
      style={{
        padding: "14px 28px",
        minHeight: 50,
        fontSize: "16px",
        fontWeight: 500,
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",

        // Background
        background: disabled
          ? COLORS.bgSecondary
          : isPrimary
            ? hover
              ? primaryHoverBg
              : primaryBg
            : isSuccess
              ? hover
                ? primaryHoverBg
                : primaryBg
              : isDanger
                ? hover
                  ? "#b91c1c"
                  : "#dc2626"
                : isOutlineDanger
                  ? hover
                    ? "#dc2626"
                    : "transparent"
                  : hover
                    ? secondaryHoverBg // 👈 solid on hover
                    : secondaryBg,

        color: disabled
          ? COLORS.textMuted
          : isPrimary || isSuccess || isDanger
            ? COLORS.white
            : isOutlineDanger && hover
              ? COLORS.white
              : hover
                ? COLORS.white // 👈 secondary text becomes white on hover
                : secondaryText,

        border: `1px solid ${
          disabled
            ? COLORS.borderLight
            : isPrimary
              ? hover
                ? primaryHoverBg
                : primaryBg
              : isSuccess
                ? hover
                  ? primaryHoverBg
                  : primaryBg
                : isDanger
                  ? hover
                    ? "#b91c1c"
                    : "#dc2626"
                  : isOutlineDanger
                    ? "#dc2626"
                    : secondaryBorder
        }`,
      }}
    >
      {children && <span style={{ display: "flex" }}>{children}</span>}
      {label}
    </button>
  );
}
