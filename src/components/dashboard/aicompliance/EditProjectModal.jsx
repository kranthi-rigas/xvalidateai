import React, { useState, useRef } from "react";
import {
  updateComplianceProject, // PATCH – status update
  updateComplianceTool, // PUT – edit tool
} from "../../../apiIntegration/compliance";
import AwsButton from "../../common/AwsButton";
import useToast from "../../../hooks/useToast";
import CreditInfoNote from "./CreditInfoNote";

/* ---------- FIELD RENDERER ---------- */
function renderField(
  label,
  name,
  form,
  handleChange,
  handleBlur,
  errors,
  touched,
  submitted,
  fieldRef,
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
    border: hasError
      ? "1.5px solid #DC2626"
      : focused
        ? "1.5px solid #2563EB"
        : "1px solid #E5E7EB",
    boxShadow:
      hasError && focused
        ? "0 0 0 3px rgba(220,38,38,0.25)"
        : focused
          ? "0 0 0 3px rgba(37,99,235,0.25)"
          : "none",
    transition: "all 0.15s ease",
  };

  return (
    <div ref={fieldRef} style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 600, marginBottom: 6, display: "block" }}>
        {label}
        {required && <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>}
      </label>

      {textarea ? (
        <textarea
          name={name}
          value={form[name]}
          placeholder={placeholder}
          onChange={disabled ? undefined : handleChange}
          onFocus={() => !disabled && setFocused(true)}
          onBlur={(e) => {
            if (!disabled) {
              setFocused(false);
              handleBlur(e);
            }
          }}
          disabled={disabled}
          style={{
            ...baseStyle,
            height: 90,
            background: disabled ? "#F3F4F6" : "#F9FAFB",
            color: disabled ? "#6B7280" : "#111827",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
      ) : (
        <input
          name={name}
          value={form[name]}
          placeholder={placeholder}
          onChange={disabled ? undefined : handleChange}
          onFocus={() => !disabled && setFocused(true)}
          onBlur={(e) => {
            if (!disabled) {
              setFocused(false);
              handleBlur(e);
            }
          }}
          disabled={disabled}
          style={{
            ...baseStyle,
            background: disabled ? "#F3F4F6" : "#F9FAFB",
            color: disabled ? "#6B7280" : "#111827",
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

export default function EditProjectModal({
  project,
  setShowEditModal,
  refreshProjects,
}) {
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = userInfo?.roles || [];
  const isAdmin = roles.includes("ADMIN");
  const show = useToast();
  const isAuditor = roles.includes("AUDITOR");

  /* ---------- INITIAL FORM ---------- */
  const initialFormRef = useRef({
    projectName: project.name || "",
    description: project.description || "",
    url: project.url || "",
    justification: project.justification || "",
  });

  const [form, setForm] = useState({ ...initialFormRef.current });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creditError, setCreditError] = useState(false);

  const fieldRefs = {
    projectName: useRef(null),
    description: useRef(null),
    url: useRef(null),
    justification: useRef(null),
  };

  /* ---------- DIRTY CHECK ---------- */
  const isDirty = Object.keys(form).some(
    (key) => form[key] !== initialFormRef.current[key],
  );

  /* ---------- VALIDATION ---------- */
  const validate = (data = form) => {
    const errs = {};

    if (!data.projectName.trim()) errs.projectName = "Tool Name is required";

    if (!data.description.trim()) errs.description = "Description is required";

    // ✅ URL validation ONLY for Admin
    if (isAdmin) {
      if (!data.url.trim()) errs.url = "Tool URL is required";
      else if (!/^https?:\/\//i.test(data.url))
        errs.url = "URL must start with http or https";
    }

    if (!data.justification.trim())
      errs.justification = "Reason for Adoption is required";

    return errs;
  };

  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "url") {
      let updated = value.trim();
      if (
        updated &&
        !/^https?:\/\//i.test(updated) &&
        /^[a-z0-9.-]+\.[a-z]{2,}/i.test(updated)
      ) {
        updated = `https://${updated}`;
      }
      setForm((p) => ({ ...p, url: updated }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleBlur = (e) => {
    const field = e.target.name;
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate(form));
  };

  /* ================= SAVE ================= */
  const saveChanges = async () => {
    setSubmitted(true);
    const validation = validate(form);
    setErrors(validation);

    if (Object.keys(validation).length) {
      fieldRefs[Object.keys(validation)[0]]?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setSaving(true);

    try {
      // 🔐 Auditor: remove url from payload
      const payload = isAuditor ? (({ url, ...rest }) => rest)(form) : form;
      await updateComplianceTool(project.project_id, form);

      show("Tool updated successfully!", { type: "success" });
      setShowEditModal(false);
      refreshProjects?.();
    } catch (err) {
      console.error("Edit project error:", err);

      const rawMessage = err?.response?.data?.message || err?.message || "";
      const isInsufficientCredits =
        rawMessage.toLowerCase().includes("credit") ||
        err?.response?.status === 402;

      show(
        isInsufficientCredits
          ? "Insufficient credits to run this scan."
          : "Failed to update tool. Please try again.",
        { type: "error", duration: 5000 },
      );

      setCreditError(true);
      setTimeout(() => setCreditError(false), 5000);
    } finally {
      setSaving(false); // ✅ FIXED
    }
  };

  /* ---------- STATUS ACTIONS ---------- */
  const status = project?.status;
  const showAdminApprovalActions = isAdmin && status === "requested";
  const showFinalEditActions = status !== "requested";

  return (
    <div style={overlay} onClick={() => setShowEditModal(false)}>
      <div
        style={{
          ...modal,
          ...(creditError && {
            border: "2px solid #DC2626",
            boxShadow: "0 0 0 4px rgba(220,38,38,0.25)",
          }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 10, fontWeight: 700 }}>Edit Tool</h2>

        {renderField(
          "Tool Name",
          "projectName",
          form,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          fieldRefs.projectName,
          false,
          "Enter tool name...",
          true,
        )}

        {renderField(
          "Description",
          "description",
          form,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          fieldRefs.description,
          true,
          "Enter a short description...",
          true,
        )}

        {renderField(
          "Tool URL",
          "url",
          form,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          fieldRefs.url,
          false,
          "https://example.com",
          true,
          isAuditor,
        )}

        {isAuditor && (
          <p style={{ fontSize: 12, color: "#6B7280", marginTop: -10 }}>
            Tool URL can only be modified by an Admin
          </p>
        )}

        {renderField(
          "Reason for Adoption",
          "justification",
          form,
          handleChange,
          handleBlur,
          errors,
          touched,
          submitted,
          fieldRefs.justification,
          true,
          "Explain the reason for adopting this tool...",
          true,
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <AwsButton
            label="Cancel"
            onClick={() => setShowEditModal(false)}
            disabled={saving}
          />
          <AwsButton
            label={saving ? "Saving…" : "Save Changes"}
            onClick={saveChanges}
            disabled={saving || !isDirty}
          />
        </div>
        <CreditInfoNote text="Re-running assessment consumes 10 credits" />
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
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
  width: 450,
  maxHeight: "85vh",
  overflowY: "auto",
  padding: 24,
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};
