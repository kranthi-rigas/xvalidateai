import React, { useState, useEffect } from "react";
import AwsButton from "../../common/AwsButton";
import { createOrganization } from "../../../apiIntegration/organization";
import { fetchUserProfile } from "../../../apiIntegration/auth";
import useToast from "../../../hooks/useToast";

/* ---------- FIELD RENDERER (UNCHANGED) ---------- */
function renderField(
  label,
  name,
  value,
  onChange,
  onBlur,
  errors,
  touched,
  submitted,
  textarea = false,
  placeholder = "",
  required = false,
  disabled = false,
) {
  const [focused, setFocused] = useState(false);
  const hasError = (touched[name] || submitted) && !!errors[name];

  const baseStyle = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 12,
    fontSize: 14,
    background: "#F9FAFB",
    outline: "none",
    marginBottom: 4,
    border: focused
      ? "1.5px solid #2563EB"
      : hasError
        ? "1.5px solid #DC2626"
        : "1px solid #E5E7EB",
    boxShadow: focused
      ? "0 0 0 3px rgba(37,99,235,0.25)"
      : hasError
        ? "0 0 0 3px rgba(220,38,38,0.25)"
        : "none",
    transition: "all 0.15s ease",
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>
        {label}
        {required && <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>}
      </label>

      {textarea ? (
        <textarea
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={disabled ? undefined : onChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur(e);
          }}
          style={{
            ...baseStyle,
            height: 100,
            background: disabled ? "#F3F4F6" : baseStyle.background,
          }}
        />
      ) : (
        <input
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={disabled ? undefined : onChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            onBlur(e);
          }}
          style={{
            ...baseStyle,
            background: disabled ? "#F3F4F6" : baseStyle.background,
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
      )}

      {hasError && (
        <p style={{ color: "#DC2626", fontSize: 12, marginTop: 4 }}>
          {errors[name]}
        </p>
      )}
    </div>
  );
}

/* ================= MODAL COMPONENT ================= */

export default function CreateOrganizationModal({
  setShowCreateModal,
  onSuccess,
}) {
  /* ---------- STATE ---------- */
  const [form, setForm] = useState({
    name: "",
    slug: "app",
    description: "",
    email: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const show = useToast();
  const [modalError, setModalError] = useState(false);

  /* ---------- PREFILL EMAIL ---------- */
  useEffect(() => {
    const userInfo =
      JSON.parse(localStorage.getItem("user_info")) ||
      JSON.parse(sessionStorage.getItem("user_info"));

    if (userInfo?.email) {
      setForm((p) => ({ ...p, email: userInfo.email }));
    }
  }, []);

  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleBlur = (e) => {
    const field = e.target.name;
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate());
  };

  /* ---------- VALIDATION ---------- */
  const validate = () => {
    const errs = {};

    if (!form.name.trim()) errs.name = "Organization name is required.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      errs.slug = "Only lowercase letters, numbers & hyphens allowed.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.address.trim()) errs.address = "Address is required.";

    return errs;
  };

  const isFormValid = () => {
    const errs = validate();
    return Object.keys(errs).length === 0;
  };
  const getReadableApiError = (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;

    // 🔴 SERVER ERRORS → ALWAYS GENERIC
    if (!status || status >= 500) {
      return "Something went wrong on our side. Please try again later.";
    }

    // 🟠 CLIENT ERRORS (4xx) → show backend message if available
    if (status >= 400 && status < 500) {
      if (typeof data === "string") {
        return data;
      }

      if (typeof data === "object" && data !== null) {
        if (data.error) return String(data.error);
        if (data.message) return String(data.message);
      }
    }

    // 🔹 Fallback (network / unknown)
    if (typeof err?.message === "string") {
      return err.message;
    }

    return "Request failed";
  };

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    setSubmitted(true);
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    try {
      setLoading(true);

      const res = await createOrganization(form);

      if (res?.access_token)
        localStorage.setItem("access_token", res.access_token);
      if (res?.refresh_token)
        localStorage.setItem("refresh_token", res.refresh_token);

      const freshUser = await fetchUserProfile(
        res?.access_token || localStorage.getItem("access_token"),
      );

      if (freshUser) {
        localStorage.setItem("user_info", JSON.stringify(freshUser));
      }

      show("Organization created successfully!", { type: "success" });

      // ✅ notify parent to refresh list
      if (typeof onSuccess === "function") {
        onSuccess();
        setShowCreateModal(false);
      }

      // close modal immediately (no delay needed)
      setShowCreateModal(false);
    } catch (err) {
      console.error("Create organization error:", err);

      const message = getReadableApiError(err);

      // 🔔 Toast (string ONLY)
      show(message, { type: "error", duration: 5000 });

      // 🔴 Modal shake + red border
      setModalError(true);
      setTimeout(() => setModalError(false), 5000);

      // ⏱ Auto-close modal after error
      setTimeout(() => {
        setShowCreateModal(false);
      }, 5000);
    }
  };
  //close modal user click on Esc helper
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowCreateModal(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={overlay} onClick={() => setShowCreateModal(false)}>
      <div
        style={{
          ...modal,
          ...(modalError && {
            border: "2px solid #DC2626",
            boxShadow: "0 0 0 4px rgba(220,38,38,0.25)",
            animation: "shake 0.35s",
          }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 16, fontWeight: 700 }}>
          Create Organization
        </h2>

        {renderField(
          "Organization Name",
          "name",
          form.name,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          false,
          "Enter organization name",
          true,
        )}

        {renderField(
          "Slug",
          "slug",
          form.slug,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          false,
          "app",
          true,
          true,
        )}

        {renderField(
          "Description",
          "description",
          form.description,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          true,
          "Short description",
          true,
        )}

        {renderField(
          "Email",
          "email",
          form.email,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          false,
          "",
          true,
          true,
        )}

        {renderField(
          "Address",
          "address",
          form.address,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          true,
          "Organization address",
          true,
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <AwsButton label="Cancel" onClick={() => setShowCreateModal(false)} />
          <AwsButton
            label={loading ? "Creating..." : "Create Organization"}
            disabled={loading || !isFormValid()}
            style={{
              opacity: loading || !isFormValid() ? 0.6 : 1,
              cursor: loading || !isFormValid() ? "not-allowed" : "pointer",
            }}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- MODAL STYLES ---------- */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modal = {
  width: 480,
  maxHeight: "85vh",
  overflowY: "auto",
  background: "#fff",
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes shake {
      0% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      50% { transform: translateX(4px); }
      75% { transform: translateX(-2px); }
      100% { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
}
