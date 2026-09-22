import React, { useState, useRef, useLayoutEffect } from "react";
import ReactDOM from "react-dom";

const VIEWPORT_MARGIN = 12;

export default function OrgRequiredWrapper({ children, disabled, message }) {
  const [show, setShow] = useState(false);
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);
  // Anchor centre + top, in viewport coords.
  const [anchor, setAnchor] = useState({ top: 0, center: 0 });
  // Resolved after measuring the tooltip so it never spills off-screen.
  const [layout, setLayout] = useState(null);

  const handleMouseEnter = () => {
    if (!disabled) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLayout(null);
    setAnchor({
      top: rect.top - 8,
      center: rect.left + rect.width / 2,
    });
    setShow(true);
  };

  // Keep the tooltip inside the viewport: centre it on the button when there is
  // room, otherwise shift it in and move the arrow to stay on the button.
  useLayoutEffect(() => {
    if (!show || !tooltipRef.current) return;
    const width = tooltipRef.current.offsetWidth;
    const maxLeft = window.innerWidth - VIEWPORT_MARGIN - width;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(anchor.center - width / 2, Math.max(VIEWPORT_MARGIN, maxLeft)),
    );
    const arrowLeft = Math.min(
      Math.max(anchor.center - left, 12),
      Math.max(width - 12, 12),
    );
    setLayout({ left, arrowLeft });
  }, [show, anchor]);

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
              top: anchor.top,
              left: layout ? layout.left : anchor.center,
              transform: layout
                ? "translateY(-100%)"
                : "translate(-50%, -100%)",
              visibility: layout ? "visible" : "hidden",
            }}
          >
            <div
              ref={tooltipRef}
              className="relative bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-lg text-center"
              style={{ maxWidth: 320 }}
            >
              {message}
              <div
                className="absolute top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900"
                style={{ left: layout ? layout.arrowLeft : "50%" }}
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
