import React, { useState } from "react";
import { COLORS } from "@/styles/colors";
import ButtonLoader from "./ButtonLoader";

export default function AwsButton({
  label,
  disabled = false,
  loading = false, // ✅ NEW
  onClick,
  children,
  variant = "primary",
  type = "button",
  size = "md", // ✅ NEW - "sm" | "md" | "lg"
  fullWidth = false, // ✅ stretch to the container, for stacked dialog actions
}) {
  const [hover, setHover] = useState(false);

  const isSuccess = variant === "success";
  const isDanger = variant === "danger";
  const isOutlineDanger = variant === "outlineDanger";
  const isPrimary = variant === "primary";

  const primaryBg = "#0F3053";
  const primaryHoverBg = "#007d79";

  const secondaryBg = "transparent";
  const secondaryHoverBg = "#007d79";
  const secondaryBorder = "#0F3053";
  const secondaryText = "#0F3053";

  // ✅ Size configurations
  const sizeConfig = {
    sm: { padding: "6px 16px", minHeight: 32, fontSize: "12px" },
    md: { padding: "8px 20px", minHeight: 36, fontSize: "14px" },
    lg: { padding: "14px 32px", minHeight: 48, fontSize: "16px" },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  const isDisabled = disabled || loading; // ✅ auto-disable while loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="lh-1 tool-assessment-btn"
      style={{
        ...currentSize,
        ...(fullWidth ? { width: "100%" } : {}),
        fontWeight: 500,
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",

        background: isDisabled
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
                    ? secondaryHoverBg
                    : secondaryBg,

        color: isDisabled
          ? COLORS.textMuted
          : isPrimary || isSuccess || isDanger
            ? COLORS.white
            : isOutlineDanger && hover
              ? COLORS.white
              : hover
                ? COLORS.white
                : secondaryText,

        border: `1px solid ${
          isDisabled
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
      {/* ✅ Spinner shows only when loading */}
      {loading && <ButtonLoader />}

      {/* ✅ Hide icon while loading */}
      {!loading && children && (
        // Children share this wrapper, so the button's own gap can't separate
        // them — an icon sat flush against its label. The gap belongs here.
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {children}
        </span>
      )}

      {label}
    </button>
  );
}
