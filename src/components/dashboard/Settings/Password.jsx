import React, { useState, memo } from "react";
import { updatePassword } from "../../../apiIntegration/auth";
import AwsButton from "@/components/common/AwsButton";
import PasswordStrength from "@/components/common/PasswordStrength";
import { getPasswordChecks, describeMissingRules } from "@/utils/password";

/* ===========================
   PASSWORD FIELD (MEMOIZED)
=========================== */
const PasswordField = memo(
  ({
    label,
    name,
    value,
    type,
    onChange,
    onToggle,
    onFocus,
    onBlur,
    placeholder,
    children,
  }) => {
    return (
      <div className="col-md-7">
        <label className="text-16 fw-500 mb-10">{label}</label>

        <div className="password-wrapper">
          <input
            required
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
          />

          <button type="button" className="password-toggle" onClick={onToggle}>
            {type === "password" ? "Show" : "Hide"}
          </button>
        </div>

        {children}
      </div>
    );
  }
);

/* ===========================
   MAIN PASSWORD COMPONENT
=========================== */
export default function Password({ activeTab }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);

  const { requiredMet } = getPasswordChecks(form.new_password);

  const passwordsMatch =
    form.new_password &&
    form.confirm_password &&
    form.new_password === form.confirm_password;

  /* ---------- HANDLERS ---------- */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const toggleShow = (key) => {
    setShow((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordsMatch) {
      setError("New password and confirm password do not match");
      return;
    }

    // Same rules the checklist under the field lists.
    if (!requiredMet) {
      setError(describeMissingRules(form.new_password));
      return;
    }

    try {
      setLoading(true);

      await updatePassword({
        password: form.current_password,
        new_password: form.new_password,
      });

      // ✅ IMMEDIATELY logout & redirect
      localStorage.clear();
      sessionStorage.clear();

      window.location.replace("/"); // ⬅️ IMPORTANT
    } catch (err) {
      // ✅ Ignore token errors AFTER password change
      if (
        err.message?.toLowerCase().includes("token") ||
        err.message?.toLowerCase().includes("expired")
      ) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace("/");
        return;
      }

      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div
      className={`tabs__pane -tab-item-2 ${activeTab == 2 ? "is-active" : ""}`}
    >
      <form onSubmit={handleSubmit} className="contact-form row y-gap-30">
        <PasswordField
          label="Current password"
          name="current_password"
          value={form.current_password}
          type={show.current ? "text" : "password"}
          onChange={handleChange}
          onToggle={() => toggleShow("current")}
          placeholder="Current password"
        />

        <PasswordField
          label="New password"
          name="new_password"
          value={form.new_password}
          type={show.new ? "text" : "password"}
          onChange={handleChange}
          onToggle={() => toggleShow("new")}
          onFocus={() => setNewPasswordFocused(true)}
          onBlur={() => setNewPasswordFocused(false)}
          placeholder="New password"
        >
          <PasswordStrength
            password={form.new_password}
            show={newPasswordFocused}
          />
        </PasswordField>

        <PasswordField
          label="Confirm New Password"
          name="confirm_password"
          value={form.confirm_password}
          type={show.confirm ? "text" : "password"}
          onChange={handleChange}
          onToggle={() => toggleShow("confirm")}
          placeholder="Confirm new password"
        />

        {/* LIVE PASSWORD MATCH MESSAGE */}
        {form.confirm_password && !passwordsMatch && (
          <div className="col-md-7 text-red-1 text-14">
            Passwords do not match
          </div>
        )}

        {error && <div className="col-md-7 text-red-1 text-14">{error}</div>}

        <div className="col-12">
          <AwsButton
            label={loading ? "Saving..." : "Save Password"}
            variant="primary"
            disabled={loading || !passwordsMatch || !requiredMet}
            onClick={() => { }}
          />
        </div>
      </form>
    </div>
  );
}
