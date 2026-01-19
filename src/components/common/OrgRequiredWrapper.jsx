import React, { useState, useRef, useLayoutEffect } from "react";

export default function OrgRequiredWrapper({ children, disabled, message }) {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({});

  useLayoutEffect(() => {
    if (!show || !wrapperRef.current || !tooltipRef.current) return;

    const wrapper = wrapperRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();
    const padding = 12;

    let left = wrapper.left + wrapper.width / 2 - tooltip.width / 2;

    // 🔥 clamp inside viewport
    if (left < padding) {
      left = padding;
    }

    if (left + tooltip.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltip.width - padding;
    }

    setPos({
      left,
      top: wrapper.bottom + 8 + window.scrollY,
    });
  }, [show]);

  if (!disabled) return children;

  return (
    <span
      ref={wrapperRef}
      style={{ display: "inline-flex", position: "relative" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{ opacity: 0.6, cursor: "not-allowed" }}>{children}</span>

      {show && (
        <div
          ref={tooltipRef}
          style={{
            position: "fixed", // 🔥 key change
            background: "#111827",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 13,
            whiteSpace: "nowrap",
            zIndex: 9999,
            boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
            ...pos,
          }}
        >
          {message}
        </div>
      )}
    </span>
  );
}
