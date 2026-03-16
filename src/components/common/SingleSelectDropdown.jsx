import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { COLORS } from "../../styles/colors";

const SingleSelectDropdown = forwardRef(function SingleSelectDropdown(
  { label, options = [], selected, onChange, error, required = false },
  ref,
) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const boxRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      boxRef.current?.focus();
      setOpen(true);
    },
  }));

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = options.find((o) => o.value === selected)?.label || "";

  return (
    <div ref={wrapperRef} style={{ marginBottom: 14, position: "relative" }}>
      <label
        style={{
          display: "block",
          marginBottom: 6,
          fontWeight: 600,
          fontSize: 14,
          color: "#334155",
        }}
      >
        {label}
        {required && (
          <span style={{ color: COLORS.error, marginLeft: 4 }}>*</span>
        )}
      </label>

      <div
        ref={boxRef}
        tabIndex={0}
        onClick={() => setOpen((p) => !p)}
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
          color: selected ? "#0F172A" : "#94A3B8",
        }}
      >
        {selected ? selectedLabel : "Select role…"}
      </div>

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
            boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
            zIndex: 6000,
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
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
                type="radio"
                name="role-select"
                checked={selected === opt.value}
                readOnly
              />
              <span style={{ fontSize: 14 }}>{opt.label}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ color: COLORS.error, fontSize: 13, marginTop: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
});

export default SingleSelectDropdown;
