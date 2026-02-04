import React, { useState } from "react";
import COLORS from "../../styles/colors";

/**
 * Reusable Form Field Component - AI Compliance Design System
 *
 * Follows Trust Blue design system with WCAG AA/AAA compliance
 * All form inputs meet minimum 44x44px touch target requirements
 *
 * @param {string} label - Field label
 * @param {string} name - Field name
 * @param {string} value - Field value
 * @param {function} onChange - Change handler
 * @param {function} onBlur - Blur handler
 * @param {string} error - Error message
 * @param {boolean} touched - Whether field has been touched
 * @param {boolean} required - Show required asterisk
 * @param {string} placeholder - Placeholder text
 * @param {string} type - Input type: 'text' | 'email' | 'url' | 'password' | 'number' | 'textarea'
 * @param {object} fieldRef - React ref for scrolling to field
 * @param {number} rows - Number of rows for textarea (default: 3)
 * @param {string} className - Additional classes
 * @param {boolean} disabled - Disabled state
 * @param {string} helperText - Helper text below input
 */
export default function FormField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  placeholder = "",
  type = "text",
  fieldRef,
  rows = 3,
  className = "",
  disabled = false,
  helperText = "",
}) {
  const [focused, setFocused] = useState(false);
  const hasError = touched && !!error;

  const containerStyle = {
    marginBottom: "4px",
  };

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: 1.5,
    color: disabled ? COLORS.textDisabled : COLORS.textPrimary,
    marginBottom: "6px",
  };

  const requiredStyle = {
    color: COLORS.error,
    marginLeft: "4px",
  };

  const baseInputStyle = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: "12px",
    fontSize: "14px",
    lineHeight: 1.5,
    background: disabled ? COLORS.bgTertiary : COLORS.surfaceLight,
    color: disabled ? COLORS.textDisabled : COLORS.textPrimary,
    outline: "none",
    transition: "all 0.15s ease",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu"',

    // Border states
    border: hasError
      ? `1.5px solid ${COLORS.error}`
      : focused
        ? `1.5px solid ${COLORS.borderFocus}`
        : `1px solid ${COLORS.borderLight}`,

    // Box shadow states
    boxShadow:
      hasError && focused
        ? `0 0 0 3px ${COLORS.errorLight}`
        : focused
          ? `0 0 0 3px ${COLORS.focusRing}`
          : "none",

    // Disabled state
    cursor: disabled ? "not-allowed" : "text",
    opacity: disabled ? 0.6 : 1,
  };

  const textareaStyle = {
    ...baseInputStyle,
    resize: "vertical",
    minHeight: `${rows * 20}px`,
  };

  const errorStyle = {
    color: COLORS.error,
    fontSize: "12px",
    lineHeight: 1.5,
    marginTop: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  };

  const helperStyle = {
    color: COLORS.textSecondary,
    fontSize: "12px",
    lineHeight: 1.5,
    marginTop: "4px",
  };

  const handleFocus = () => {
    if (!disabled) {
      setFocused(true);
    }
  };

  const handleBlurWrapper = (e) => {
    setFocused(false);
    if (onBlur) onBlur(e);
  };

  const inputProps = {
    name,
    value,
    onChange: disabled ? undefined : onChange,
    onBlur: handleBlurWrapper,
    onFocus: handleFocus,
    placeholder,
    disabled,
    "aria-invalid": hasError ? "true" : "false",
    "aria-describedby": hasError
      ? `${name}-error`
      : helperText
        ? `${name}-helper`
        : undefined,
    "aria-required": required ? "true" : "false",
  };

  return (
    <div ref={fieldRef} className={className} style={containerStyle}>
      <label htmlFor={name} style={labelStyle}>
        {label}
        {required && (
          <span style={requiredStyle} aria-label="required">
            *
          </span>
        )}
      </label>

      {type === "textarea" ? (
        <textarea id={name} style={textareaStyle} rows={rows} {...inputProps} />
      ) : (
        <input id={name} type={type} style={baseInputStyle} {...inputProps} />
      )}

      {hasError && (
        <p id={`${name}-error`} style={errorStyle} role="alert">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M7 0C3.13438 0 0 3.13438 0 7C0 10.8656 3.13438 14 7 14C10.8656 14 14 10.8656 14 7C14 3.13438 10.8656 0 7 0ZM7 10.5C6.65625 10.5 6.375 10.2188 6.375 9.875V7C6.375 6.65625 6.65625 6.375 7 6.375C7.34375 6.375 7.625 6.65625 7.625 7V9.875C7.625 10.2188 7.34375 10.5 7 10.5ZM7 5.25C6.65625 5.25 6.375 4.96875 6.375 4.625V4.125C6.375 3.78125 6.65625 3.5 7 3.5C7.34375 3.5 7.625 3.78125 7.625 4.125V4.625C7.625 4.96875 7.34375 5.25 7 5.25Z"
              fill={COLORS.error}
            />
          </svg>
          {error}
        </p>
      )}

      {!hasError && helperText && (
        <p id={`${name}-helper`} style={helperStyle}>
          {helperText}
        </p>
      )}

      <style>{`
        /* Placeholder styling */
        input::placeholder,
        textarea::placeholder {
          color: ${COLORS.textMuted};
          opacity: 1;
        }
        
        /* Focus visible for accessibility */
        input:focus-visible,
        textarea:focus-visible {
          outline: 2px solid ${COLORS.borderFocus};
          outline-offset: 2px;
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          input,
          textarea {
            transition: none;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: more) {
          input,
          textarea {
            border-width: 2px;
          }
        }
      `}</style>
    </div>
  );
}
