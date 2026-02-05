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
 */
export default function AuthFormInput({
  id,
  name,
  type = "text",
  label,
  placeholder,
  value,
  onChange,
  icon = "fa-user",
  required = true,
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
          required={required}
          className="auth-input"
          style={isPasswordField ? { paddingRight: "3rem" } : {}}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="password-view"
            title={showPassword ? "Hide password" : "Show password"}
          >
            <i 
              key={showPassword ? "hide" : "show"}
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
            ></i>
          </button>
        )}
      </div>
    </div>
  );
}
