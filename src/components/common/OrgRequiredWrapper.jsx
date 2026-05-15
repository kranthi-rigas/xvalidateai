import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";

export default function OrgRequiredWrapper({ children, disabled, message }) {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (!disabled) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
    setShow(true);
  };

  if (!disabled) return children;

  return (
    <>
      <span
        ref={wrapperRef}
        style={{ display: "inline-flex", cursor: "not-allowed", opacity: 0.75 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        <span style={{ pointerEvents: "none" }}>{children}</span>
      </span>

      {show &&
        typeof document !== "undefined" &&
        ReactDOM.createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-md whitespace-nowrap shadow-lg">
              {message}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}