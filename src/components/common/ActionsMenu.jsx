import React, { useState, useRef, useEffect } from "react";

export default function ActionsMenu({
  selected = [],
  items = null,
  onSelect = () => {},
  onEdit = () => {},
  onDelete = () => {},
}) {
  const [show, setShow] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [hoverKey, setHoverKey] = useState(null);
  const ref = useRef(null);

  /* ---------- CLOSE ON OUTSIDE CLICK ---------- */
  useEffect(() => {
    function outside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setShow(false);
      }
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  const disabled = selected.length === 0;
  const singleSelect = selected.length === 1;

  return (
    <div
      ref={ref}
      style={{ position: "relative" }}
      onMouseDown={(e) => e.stopPropagation()} // 🔥 REQUIRED
      onClick={(e) => e.stopPropagation()} // 🔥 REQUIRED
    >
      {/* ---------- ACTIONS BUTTON ---------- */}
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => e.stopPropagation()} // 🔥 REQUIRED
        onClick={(e) => {
          e.stopPropagation();
          !disabled && setShow((v) => !v);
        }}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="lh-1"
        style={{
          padding: "4px 12px",
          minHeight: 32,
          fontSize: "clamp(11px, 2.5vw, 13px)",
          fontWeight: 600,
          fontFamily: "Amazon Ember, sans-serif",
          background: disabled ? "#F2F4F8" : isHover ? "#F2F8FD" : "#FFFFFF",
          color: disabled ? "#6B7280" : isHover ? "#0F1E46" : "#1A73E8",
          border: `2px solid ${
            disabled ? "#C3C7CF" : isHover ? "#0F1E46" : "#1A73E8"
          }`,
          borderRadius: 999,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          whiteSpace: "nowrap",
        }}
      >
        Actions
        <span
          style={{
            fontSize: 11,
            transform: `rotate(${show ? 180 : 0}deg)`,
          }}
        >
          ▼
        </span>
      </button>

      {/* ---------- DROPDOWN ---------- */}
      {show && (
        <div
          onMouseDown={(e) => e.stopPropagation()} // 🔥 REQUIRED
          onClick={(e) => e.stopPropagation()} // 🔥 REQUIRED
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "max-content",
            background: "#FFFFFF",
            border: "1px solid #D5DBE0",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            overflow: "hidden",
            zIndex: 1000,
          }}
        >
          {items ? (
            items.map((item) => {
              const isDisabled = !!item.disabled;

              return (
                <div
                  key={item.key}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();

                    // 🔒 BLOCK CLICK IF DISABLED
                    if (isDisabled) return;

                    setShow(false);
                    onSelect(item.key);
                  }}
                  title={
                    isDisabled
                      ? "Approved or pending assessment tools cannot be deleted"
                      : ""
                  }
                  onMouseEnter={() => !isDisabled && setHoverKey(item.key)}
                  onMouseLeave={() => setHoverKey(null)}
                  style={{
                    minHeight: 36,
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",

                    /* ✅ TEXT ALIGNMENT */
                    fontSize: 14,
                    lineHeight: "20px",
                    fontWeight: 500,
                    fontFamily: "Amazon Ember, sans-serif",

                    /* ✅ HOVER HIGHLIGHT */
                    background:
                      hoverKey === item.key && !isDisabled
                        ? item.danger
                          ? "#FEE2E2"
                          : "#F2F8FD"
                        : "#FFFFFF",

                    cursor: isDisabled ? "not-allowed" : "pointer",
                    opacity: isDisabled ? 0.5 : 1,

                    color: isDisabled
                      ? "#9CA3AF"
                      : item.danger
                        ? "#DC2626"
                        : "#1F2937",

                    borderBottom: "1px solid #F1F1F1",
                    userSelect: "none",
                    transition: "background 0.15s ease",
                  }}
                >
                  {item.label}
                </div>
              );
            })
          ) : (
            <>
              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (singleSelect) {
                    setShow(false);
                    onEdit(selected[0]);
                  }
                }}
                style={{ padding: "8px 14px" }}
              >
                Edit
              </div>

              <div
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShow(false);
                  onDelete();
                }}
                style={{ padding: "8px 14px" }}
              >
                Delete
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
