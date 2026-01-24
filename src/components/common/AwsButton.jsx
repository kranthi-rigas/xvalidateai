import React, { useState } from "react";

const SIZE_STYLES = {
  sm: {
    padding: "6px 16px",
    minHeight: 32,
    fontSize: "12px",
  },
  md: {
    padding: "10px 18px",
    minHeight: 40,
    fontSize: "14px",
  },
  lg: {
    padding: "14px 22px",
    minHeight: 48,
    fontSize: "15px",
  },
};

export default function AwsButton({
  label,
  disabled = false,
  onClick,
  children,
  fullWidth = false,
  size = "md",
  type = "button",
  isLoading = false,
  ...rest
}) {
  const [hover, setHover] = useState(false);

  const purpleBg = "#2F5FD9";
  const purpleBorder = "#2F5FD9";

  const hoverBg = "rgb(242,248,253)";
  const darkText = "rgb(15,38,70)";
  const darkBorder = "rgb(15,38,70)";

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.md;
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={!isDisabled ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
      style={{
        ...sizeStyle,
        fontWeight: 600,
        fontFamily: "Poppins",
        borderRadius: 8,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: isDisabled ? "not-allowed" : "pointer",
        transition: "all 160ms ease",
        whiteSpace: "nowrap",
        width: fullWidth ? "100%" : "auto",
        opacity: isDisabled ? 0.6 : 1,

        background: isDisabled ? "#E5E7EB" : hover ? hoverBg : purpleBg,

        color: isDisabled ? "#9CA3AF" : hover ? darkText : "#FFFFFF",

        border: `1px solid ${
          isDisabled ? "#D1D5DB" : hover ? darkBorder : purpleBorder
        }`,
      }}
    >
      {isLoading ? "Please wait..." : children}
      {!isLoading && label}
    </button>
  );
}
