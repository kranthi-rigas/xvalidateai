import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import COLORS from "../../styles/colors";

export default function ActionsMenu({
  items = [],
  disabled = false,
  onSelect = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [hoverKey, setHoverKey] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [tooltipText, setTooltipText] = useState("");
  const ref = useRef(null);
  const itemRefs = useRef({});

  /* ---------- CLOSE ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
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
    transition: "all 0.2s ease",
    cursor: disabled ? "not-allowed" : "pointer",
    border: `1px solid ${
      disabled
        ? COLORS.borderLight
        : buttonHovered || open
          ? COLORS.primary
          : COLORS.borderLight
    }`,
    background: disabled
      ? COLORS.bgTertiary
      : open
        ? COLORS.hover
        : buttonHovered
          ? COLORS.surfaceLight
          : COLORS.bgPrimary,
    color: disabled
      ? COLORS.textDisabled
      : buttonHovered || open
        ? COLORS.primary
        : COLORS.textPrimary,
    opacity: disabled ? 0.6 : 1,
  };

  /* ---------- DROPDOWN STYLES ---------- */
  const dropdownStyle = {
    position: "absolute",
    right: 0,
    marginTop: "8px",
    zIndex: 50,
    background: COLORS.bgPrimary,
    border: `1px solid ${COLORS.borderLight}`,
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
          ? isHovered ? COLORS.errorLight : "transparent"
          : isHovered ? COLORS.hover : "transparent",
      color: isDisabled
        ? COLORS.textDisabled
        : item.danger
          ? isHovered ? COLORS.errorDark : COLORS.error
          : isHovered ? COLORS.primary : COLORS.textPrimary,
    };
  };

  /* ---------- CARET ICON STYLES ---------- */
  const caretStyle = {
    fontSize: "12px",
    transition: "transform 0.2s ease",
    transform: open ? "rotate(180deg)" : "rotate(0deg)",
  };

  /* ---------- TOOLTIP HANDLERS ---------- */
  const handleItemMouseEnter = (item) => {
    if (!item.disabled) {
      setHoverKey(item.key);
      return;
    }
    if (!item.tooltip) return;
    const el = itemRefs.current[item.key];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltipPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
    setTooltipText(item.tooltip);
  };

  const handleItemMouseLeave = () => {
    setHoverKey(null);
    setTooltipText("");
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
        style={buttonStyle}
        onMouseEnter={() => setButtonHovered(true)}
        onMouseLeave={() => setButtonHovered(false)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Actions
        <i className="fa-solid fa-caret-down" style={caretStyle} aria-hidden="true" />
      </button>

      {/* ---------- DROPDOWN ---------- */}
      {open && (
        <div
          style={dropdownStyle}
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => {
            const isDisabled = !!item.disabled;
            const isHovered = hoverKey === item.key;

            return (
              <div
                key={item.key}
                ref={(el) => (itemRefs.current[item.key] = el)}
                role="menuitem"
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => {
                  if (isDisabled) return;
                  setOpen(false);
                  onSelect(item.key);
                }}
                onMouseEnter={() => handleItemMouseEnter(item)}
                onMouseLeave={handleItemMouseLeave}
                onKeyDown={(e) => {
                  if (isDisabled) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpen(false);
                    onSelect(item.key);
                  }
                }}
                style={getItemStyle(item, isHovered)}
                aria-disabled={isDisabled}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- DARK PORTAL TOOLTIP ---------- */}
      {tooltipText &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
              {tooltipText}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>,
          document.body,
        )}

      <style>{`
        button:focus-visible {
          outline: 2px solid ${COLORS.borderFocus};
          outline-offset: 2px;
        }
        div[role="menuitem"]:focus-visible {
          outline: 2px solid ${COLORS.borderFocus};
          outline-offset: -2px;
        }
        @media (prefers-reduced-motion: reduce) {
          button, button i, button span, div[style*="transition"] {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}