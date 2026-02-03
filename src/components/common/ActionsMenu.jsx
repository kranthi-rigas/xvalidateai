import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "../../styles/colors";

export default function ActionsMenu({
  items = [],
  disabled = false,
  onSelect = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [hoverKey, setHoverKey] = useState(null);
  const ref = useRef(null);

  /* ---------- CLOSE ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open]);

  /* ---------- BUTTON STYLES ---------- */
  const buttonStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 20px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 600,
    transition: "all 0.15s ease",
    cursor: disabled ? "not-allowed" : "pointer",
    border: `1px solid ${COLORS.borderLight || "#E5E7EB"}`,
    background: disabled
      ? COLORS.bgTertiary || "#F3F4F6"
      : open
        ? COLORS.surfaceLight || "#F9FAFB"
        : COLORS.bgPrimary || "#FFFFFF",
    color: disabled
      ? COLORS.textDisabled || "#9CA3AF"
      : COLORS.textPrimary || "#111827",
    opacity: disabled ? 0.6 : 1,
  };

  const buttonHoverStyle =
    !disabled && !open
      ? {
          background: COLORS.surfaceLight || "#F9FAFB",
        }
      : {};

  /* ---------- DROPDOWN STYLES ---------- */
  const dropdownStyle = {
    position: "absolute",
    right: 0,
    marginTop: "8px",
    zIndex: 50,
    background: COLORS.bgPrimary || "#FFFFFF",
    border: `1px solid ${COLORS.borderLight || "#E5E7EB"}`,
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
    minWidth: "180px",
    overflow: "hidden",
  };

  /* ---------- ITEM STYLES ---------- */
  const getItemStyle = (item, isHovered) => {
    const isDisabled = !!item.disabled;

    return {
      display: "flex",
      alignItems: "center",
      padding: "10px 16px",
      fontSize: "14px",
      fontWeight: 500,
      userSelect: "none",
      transition: "all 0.15s ease",
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.5 : 1,
      background: isDisabled
        ? "transparent"
        : item.danger
          ? isHovered
            ? "#FEE2E2"
            : "transparent"
          : isHovered
            ? COLORS.surfaceLight || "#F9FAFB"
            : "transparent",
      color: isDisabled
        ? COLORS.textDisabled || "#9CA3AF"
        : item.danger
          ? COLORS.error || "#DC2626"
          : COLORS.textPrimary || "#111827",
    };
  };

  /* ---------- CARET ICON STYLES ---------- */
  const caretStyle = {
    fontSize: "12px",
    transition: "transform 0.2s ease",
    transform: open ? "rotate(180deg)" : "rotate(0deg)",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* ---------- ACTION BUTTON ---------- */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          ...buttonStyle,
          ...(hoverKey === "button" ? buttonHoverStyle : {}),
        }}
        onMouseEnter={() => setHoverKey("button")}
        onMouseLeave={() => setHoverKey(null)}
      >
        Actions
        <i
          className="fa-solid fa-caret-down"
          style={caretStyle}
          aria-hidden="true"
        />
      </button>

      {/* ---------- DROPDOWN ---------- */}
      {open && (
        <div
          style={dropdownStyle}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => {
            const isDisabled = !!item.disabled;
            const isHovered = hoverKey === item.key;

            return (
              <div
                key={item.key}
                onClick={() => {
                  if (isDisabled) return;
                  setOpen(false);
                  onSelect(item.key);
                }}
                onMouseEnter={() => !isDisabled && setHoverKey(item.key)}
                onMouseLeave={() => setHoverKey(null)}
                style={getItemStyle(item, isHovered)}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        /* Focus visible for accessibility */
        button:focus-visible {
          outline: 2px solid ${COLORS.borderFocus || "#2563EB"};
          outline-offset: 2px;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          button,
          button i,
          div[style*="transition"] {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
