import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import COLORS from "../../styles/colors";

export default function ActionsMenu({
  items = [],
  disabled = false,
  onSelect = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [hoverKey, setHoverKey] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, right: "auto" });
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const portalRef = useRef(null);

  /* ---------- CALCULATE PORTAL POSITION ---------- */
  const calcPosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 180;
    // Prefer aligning to the right edge of the button; flip left if it would overflow
    const rightEdge = rect.right;
    const left = rightEdge - dropdownWidth < 0
      ? rect.left
      : rightEdge - dropdownWidth;

    setDropdownPos({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(left, viewportWidth - dropdownWidth - 8)),
    });
  }, []);

  /* ---------- CLOSE ON OUTSIDE CLICK / SCROLL ---------- */
  useEffect(() => {
    function handleOutside(e) {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        !(portalRef.current && portalRef.current.contains(e.target))
      ) {
        setOpen(false);
      }
    }
    function handleScroll() {
      setOpen(false);
    }

    if (open) {
      calcPosition();
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, calcPosition]);

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
    position: "fixed",
    top: dropdownPos.top,
    left: dropdownPos.left,
    zIndex: 9999,
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
          ? isHovered
            ? COLORS.errorLight
            : "transparent"
          : isHovered
            ? COLORS.hover
            : "transparent",
      color: isDisabled
        ? COLORS.textDisabled
        : item.danger
          ? isHovered
            ? COLORS.errorDark
            : COLORS.error
          : isHovered
            ? COLORS.primary
            : COLORS.textPrimary,
    };
  };

  /* ---------- CARET ICON STYLES ---------- */
  const caretStyle = {
    fontSize: "12px",
    transition: "transform 0.2s ease",
    transform: open ? "rotate(180deg)" : "rotate(0deg)",
    // Color will inherit from button text color
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* ---------- ACTION BUTTON ---------- */}
      <button
        ref={buttonRef}
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
        <i
          className="fa-solid fa-caret-down"
          style={caretStyle}
          aria-hidden="true"
        />
      </button>

      {/* ---------- DROPDOWN (Portal — renders into document.body to avoid overflow clipping) ---------- */}
      {open && createPortal(
        <div
          ref={portalRef}
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
                role="menuitem"
                tabIndex={isDisabled ? -1 : 0}
                onClick={() => {
                  if (isDisabled) return;
                  setOpen(false);
                  onSelect(item.key);
                }}
                onMouseEnter={() => !isDisabled && setHoverKey(item.key)}
                onMouseLeave={() => setHoverKey(null)}
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
        </div>,
        document.body
      )}

      <style>{`
        /* Focus visible for accessibility */
        button:focus-visible {
          outline: 2px solid ${COLORS.borderFocus};
          outline-offset: 2px;
        }
        
        /* Menu item focus */
        div[role="menuitem"]:focus-visible {
          outline: 2px solid ${COLORS.borderFocus};
          outline-offset: -2px;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          button,
          button i,
          button span,
          div[style*="transition"] {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
