import React, { forwardRef, useRef, useImperativeHandle } from "react";
import { COLORS } from "../../styles/colors";

const SingleSelectDropdown = forwardRef(function SingleSelectDropdown(
  { label, options = [], selected, onChange, error, required = false },
  ref,
) {
  const selectRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => selectRef.current?.focus(),
  }));

  return (
    <div style={{ marginBottom: 14 }}>
      {/* Label */}
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

      {/* Native select */}
      <select
        ref={selectRef}
        value={selected || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 12,
          border: error ? "1.5px solid #DC2626" : "1px solid #D1D5DB",
          background: "#F9FAFB",
          padding: "10px 12px",
          minHeight: 42,
          fontSize: 14,
          color: selected ? "#0f172a" : "#94A3B8",
          cursor: "pointer",
          outline: "none",
          appearance: "auto", // keeps native OS dropdown arrow
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? "#DC2626" : "#2563EB";
          e.target.style.boxShadow = error
            ? "0 0 0 3px rgba(220,38,38,0.1)"
            : "0 0 0 3px rgba(37,99,235,0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? "#DC2626" : "#D1D5DB";
          e.target.style.boxShadow = "none";
        }}
      >
        <option value="" disabled>
          Select role…
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Error */}
      {error && (
        <div
          style={{
            color: COLORS.error,
            fontSize: 12,
            marginTop: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <i
            className="fa-solid fa-circle-exclamation"
            style={{ fontSize: 12 }}
          />
          {error}
        </div>
      )}
    </div>
  );
});

export default SingleSelectDropdown;