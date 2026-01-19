import React, { useState } from "react";
import AwsButton from "../../common/AwsButton";
import { createOrganization } from "../../../apiIntegration/organization";
import { fetchUserProfile } from "../../../apiIntegration/auth";
import { useNavigate } from "react-router-dom";
import useToast from "../../../hooks/useToast";
import { useEffect } from "react";
import { auto } from "@popperjs/core";

/* ---------- FIELD RENDERER (SAME AS MODAL) ---------- */
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
          onChange={disabled ? undefined : onChange}
          disabled={disabled}
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
          onChange={disabled ? undefined : onChange}
          disabled={disabled}
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

/* ================= COMPONENT ================= */

export default function CreateOrganization() {
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [form, setForm] = useState({
    name: "",
    slug: "app",
    description: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const userInfo =
      JSON.parse(localStorage.getItem("user_info")) ||
      JSON.parse(sessionStorage.getItem("user_info"));

    if (userInfo?.email) {
      setForm((prev) => ({
        ...prev,
        email: userInfo.email,
      }));
    }
  }, []);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const show = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // clear error while typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e) => {
    const field = e.target.name;

    // mark field as touched
    setTouched((prev) => ({ ...prev, [field]: true }));

    // revalidate form
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

  /* ---------- SUBMIT ---------- */
  const handleSubmit = async () => {
    setSubmitted(true);

    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    try {
      setLoading(true);

      // ✅ Create org & receive updated token
      const res = await createOrganization(form);

      // ✅ Save new tokens if backend returned them
      if (res?.access_token) {
        localStorage.setItem("access_token", res.access_token);
      }
      if (res?.refresh_token) {
        localStorage.setItem("refresh_token", res.refresh_token);
      }

      // ✅ Fetch fresh user profile
      const freshUser = await fetchUserProfile(
        res?.access_token || localStorage.getItem("access_token"),
      );

      // ✅ Update user_info in storage
      if (freshUser) {
        localStorage.setItem("user_info", JSON.stringify(freshUser));
      }

      show("Organization created successfully!", { type: "success" });

      // Navigate after state is consistent
      setTimeout(() => navigate("/dashboard/organizations"), 1200);
    } catch (err) {
      show(err.message || "Failed to create organization", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    //<div className="dashboard__content bg-light-4">
    <div className="dashboard__content">
      <div className="dashboard-body">
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
          <AwsButton
            label="Cancel"
            onClick={() => navigate("/dashboard/organizations")}
          />
          <AwsButton
            label={loading ? "Creating..." : "Create Organization"}
            disabled={loading}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
