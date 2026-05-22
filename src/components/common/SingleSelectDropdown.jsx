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
          color: COLORS.textPrimary, // #001d6c — was hardcoded #334155
        }}
      >
        {label}
        {required && (
          <span style={{ color: COLORS.error, marginLeft: 4 }}>*</span>
        )}
      </label>

      {/* Native select */}
      {/* Native select */}
      <select
        ref={selectRef}
        value={selected || ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: 12,
          border: error
            ? `1.5px solid ${COLORS.error}`
            : `1.5px solid ${COLORS.borderLight}`,
          background: COLORS.primaryLighter, // #e3edfd — light Trust Blue tint
          padding: "10px 14px",
          minHeight: 44,
          fontSize: 14,
          fontWeight: 500,
          color: selected ? COLORS.primary : COLORS.primary, // #0F3357 selected, gray placeholder
          cursor: "pointer",
          outline: "none",
          appearance: "auto",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? COLORS.error : COLORS.primary;
          e.target.style.boxShadow = error
            ? `0 0 0 3px rgba(218,30,40,0.12)`
            : `0 0 0 3px rgba(15,51,87,0.12)`; // Trust Blue glow
          e.target.style.background = "#ffffff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error
            ? COLORS.error
            : COLORS.borderLight;
          e.target.style.boxShadow = "none";
          e.target.style.background = COLORS.primaryLighter;
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
