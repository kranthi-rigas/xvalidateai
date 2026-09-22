import React, { useState } from "react";

/**
 * AuthFormInput - Reusable input field with icon for auth forms
 * @param {string} id - Input id
 * @param {string} name - Input name
 * @param {string} type - Input type (text, email, password)
 * @param {string} label - Label text
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} icon - FontAwesome icon class (e.g., "fa-user", "fa-envelope")
 * @param {boolean} required - Whether the field is required
 * @param {boolean} showToggle - Whether to show password toggle button (default: true)
 */
export default function AuthFormInput({
  id,
  name,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  icon = "fa-user",
  required = true,
  showToggle = true,
  // Extra class for the input itself — used to paint the confirmation state
  // instead of spelling it out in a line of text underneath.
  className = "",
  children,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

  return (
    <div className="auth-input-group">
      <label htmlFor={id} className="auth-input-label">
        {label}
      </label>
      <div className="auth-input-wrapper">
        <div className="auth-input-icon">
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <input
          type={inputType}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          required={required}
          className={`auth-input${className ? ` ${className}` : ""}`}
          style={isPasswordField && showToggle ? { paddingRight: "3rem" } : {}}
        />
        {isPasswordField && showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-view"
            title={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            <i 
              key={showPassword ? "hide" : "show"}
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
            ></i>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
