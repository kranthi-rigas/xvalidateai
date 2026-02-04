import React, { useState } from "react";
import { COLORS } from "@/styles/colors";

export default function AwsButton({
  label,
  disabled = false,
  onClick,
  children,
  variant = "primary" // "primary" or "secondary"
}) {
  const [hover, setHover] = useState(false);

  // Design system colors
  const primaryBg = COLORS.primary; // #0043ce Trust Blue
  const primaryHoverBg = COLORS.primaryDark; // #001d6c
  
  // Secondary (outline) button colors
  const secondaryBg = "transparent";
  const secondaryHoverBg = COLORS.bgSecondary; // #f4f4f4
  const secondaryBorder = COLORS.border; // #c6c6c6
  const secondaryText = COLORS.textPrimary; // #161616

  const isPrimary = variant === "primary";

  return (
    <button
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="lh-1"
      style={{
        padding: "8px 20px",
        minHeight: 36,
        fontSize: "14px",
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
          : hover
          ? secondaryHoverBg
          : secondaryBg,

        // Text color
        color: disabled
          ? COLORS.textMuted
          : isPrimary
          ? COLORS.white
          : secondaryText,

        // Border
        border: `1px solid ${
          disabled
            ? COLORS.borderLight
            : isPrimary
            ? hover
              ? primaryHoverBg
              : primaryBg
            : hover
            ? COLORS.borderDark
            : secondaryBorder
        }`,
      }}
    >
      {children && <span style={{ display: "flex" }}>{children}</span>}
      {label}
    </button>
  );
}
