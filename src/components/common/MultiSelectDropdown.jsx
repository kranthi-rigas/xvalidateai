import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { COLORS } from "../../styles/colors";

const MultiSelectDropdown = forwardRef(function MultiSelectDropdown(
  {
    label,
    options = [],
    selected = [],
    onChange,
    error,
    required = false, // ✅ ADD THIS
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const boxRef = useRef(null);

  /* ---------------- EXPOSE FOCUS API ---------------- */
  useImperativeHandle(ref, () => ({
    focus: () => {
      boxRef.current?.focus();
      setOpen(true); // AWS-style
    },
  }));

  /* ---------------- CLOSE ON OUTSIDE CLICK ---------------- */
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ---------------- TOGGLE OPTION ---------------- */
  const toggleOption = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  /* ---------------- SELECTED LABELS ---------------- */
  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label)
    .join(", ");

  return (
    <div
      ref={wrapperRef}
      style={{
        marginBottom: 14,
        position: "relative",
        zIndex: open ? 5000 : 1,
      }}
    >
      {/* -------- LABEL -------- */}
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontWeight: 600,
          fontSize: 14,
          color: "#334155", // ✅ ALWAYS NORMAL COLOR
        }}
      >
        {label}
        {required && <span style={{ color: COLORS.error, marginLeft: 4 }}>*</span>}
      </label>

      {/* -------- SELECT BOX -------- */}
      <div
        ref={boxRef}
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!wrapperRef.current.contains(e.relatedTarget)) {
            setOpen(false);
          }
        }}
        style={{
          borderRadius: 12,
          border: error ? "1.5px solid #DC2626" : "1px solid #D1D5DB",
          background: "#F9FAFB",
          padding: "10px 12px",
          cursor: "pointer",
          minHeight: 42,
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          color: selected.length === 0 ? "#94A3B8" : "#0F172A",
          outline: "none",
          boxShadow: error ? "0 0 0 3px rgba(220,38,38,0.15)" : "none",
          transition: "all 0.15s ease",
        }}
      >
        {selected.length === 0 ? "Select…" : selectedLabels}
      </div>

      {/* -------- DROPDOWN -------- */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "105%",
            left: 0,
            width: "100%",
            background: "white",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "8px 0",
            maxHeight: 200,
            overflowY: "auto",
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            zIndex: 6000,
          }}
        >
          {options.length === 0 && (
            <div
              style={{
                padding: "10px 12px",
                color: "#94A3B8",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              No options found
            </div>
          )}

          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(opt.value);
              }}
              style={{
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                readOnly
              />
              <span style={{ fontSize: 14 }}>{opt.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* -------- ERROR -------- */}
      {error && (
        <div style={{ color: COLORS.error, fontSize: 13, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
});

export default MultiSelectDropdown;
