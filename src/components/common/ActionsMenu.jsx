import React, { useEffect, useRef, useState } from "react";

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

  return (
    <div ref={ref} className="relative">
      {/* ---------- ACTION BUTTON ---------- */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          if (disabled) return;
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`
          relative flex items-center gap-2 px-5 py-2.5 rounded-full border
          text-sm font-medium transition-all
          ${
            disabled
              ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
              : open
                ? "bg-muted text-foreground border-border"
                : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }

          /* ---------- SINGLE FA CARET ---------- */
          after:content-['\\f0d7']
          after:font-['Font_Awesome_6_Free']
          after:font-black
          after:text-xs
          after:transition-transform
          after:duration-200
          ${open ? "after:rotate-180" : ""}
        `}
      >
        Actions
      </button>

      {/* ---------- DROPDOWN ---------- */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 z-50
            bg-white border border-border
            rounded-xl shadow-lg overflow-hidden
            min-w-[180px]
          "
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => {
            const isDisabled = !!item.disabled;

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
                className={`
                  flex items-center px-4 py-2
                  text-sm font-medium select-none
                  transition-colors
                  ${
                    isDisabled
                      ? "text-muted-foreground cursor-not-allowed opacity-50"
                      : item.danger
                        ? hoverKey === item.key
                          ? "bg-red-50 text-red-600"
                          : "text-red-600"
                        : hoverKey === item.key
                          ? "bg-muted text-foreground"
                          : "text-foreground"
                  }
                `}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
