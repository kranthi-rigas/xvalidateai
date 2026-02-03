import React from "react";

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
          type={type}
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="auth-input"
        />
      </div>
    </div>
  );
}
