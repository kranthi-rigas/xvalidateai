import React, { useState, useEffect, useRef } from "react";
import { createComplianceProject } from "../../../apiIntegration/compliance";
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
) {
  const hasError = touched[name] && !!errors[name];
  const [focused, setFocused] = useState(false);

  const baseStyle = {
    width: "100%",
    padding: "11px 13px",
    borderRadius: 12,
    fontSize: 14,
    background: "#F9FAFB",
    outline: "none",
    marginBottom: 4,

    /* 🔥 BORDER */
    border: hasError
      ? "1.5px solid #DC2626"
      : focused
        ? "1.5px solid #2563EB"
        : "1px solid #E5E7EB",

    /* 🔥 FOCUS RING */
    boxShadow:
      hasError && focused
        ? "0 0 0 3px rgba(220,38,38,0.25)"
        : focused
          ? "0 0 0 3px rgba(37,99,235,0.25)"
          : "none",

    transition: "all 0.15s ease",
  };

  return (
    <div ref={fieldRef}>
      <label
        style={{
          fontWeight: 600,
          marginBottom: 6,
          display: "block",
        }}
      >
        {label}
        {required && <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>}
      </label>

      {textarea ? (
        <textarea
          name={name}
          value={form[name]}
          onChange={handleChange}
          onBlur={(e) => {
            setFocused(false);
            handleBlur(e);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          style={{ ...baseStyle, height: 90 }}
        />
      ) : (
        <input
          name={name}
          value={form[name]}
          onChange={handleChange}
          onBlur={(e) => {
            setFocused(false);
            handleBlur(e);
          }}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          style={baseStyle}
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

export default function CreateProjectModal({
  setShowCreateModal,
  refreshProjects,
}) {
  /* ---------- ROLE ---------- */
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = userInfo?.roles || [];
  const isAuditor = roles.includes("AUDITOR");

  /* ---------- STATE ---------- */
  const [form, setForm] = useState({
    projectName: "",
    description: "",
    url: "",
    justification: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const show = useToast();
  const [animate, setAnimate] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [creditError, setCreditError] = useState(false);

  /* ---------- FIELD REFS (FOR SCROLL) ---------- */
  const fieldRefs = {
    projectName: useRef(null),
    description: useRef(null),
    url: useRef(null),
    justification: useRef(null),
  };

  useEffect(() => {
    setTimeout(() => setAnimate(true), 10);
  }, []);

  /* ---------- VALIDATION ---------- */
  const validate = (data = form) => {
    const errs = {};

    if (!data.projectName.trim()) errs.projectName = "Tool Name is required";

    if (!data.description.trim()) errs.description = "Description is required";
    else if (data.description.length > 100)
      errs.description = "Maximum 100 characters allowed";

    if (!data.url.trim()) errs.url = "Tool URL is required";
    else if (!/^https?:\/\//i.test(data.url))
      errs.url = "URL must start with http or https";

    if (!data.justification.trim())
      errs.justification = "Reason for Adoption is required";

    return errs;
  };

  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-add https:// for URL field
    if (name === "url") {
      let updatedValue = value.trim();

      if (
        updatedValue &&
        !/^https?:\/\//i.test(updatedValue) &&
        /^[a-z0-9.-]+\.[a-z]{2,}/i.test(updatedValue)
      ) {
        updatedValue = `https://${updatedValue}`;
      }

      setForm((prev) => ({ ...prev, url: updatedValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    // ✅ CLEAR ERROR + TOUCHED when typing
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setTouched((prev) => ({ ...prev, [name]: false }));
  };

  const handleBlur = (e) => {
    const field = e.target.name;
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(form));
  };

  const isValid = Object.keys(validate(form)).length === 0;

  /* ---------- SAVE ---------- */
  const saveProject = async () => {
    setSubmitted(true);

    const validation = validate(form);
    setErrors(validation);

    if (Object.keys(validation).length) {
      const firstErrorField = Object.keys(validation)[0];
      const ref = fieldRefs[firstErrorField];

      if (ref?.current) {
        ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    setSaving(true);

    try {
      await createComplianceProject({
        ...form,
        status: isAuditor ? "requested" : "pending_assessment",
      });

      show(
        isAuditor
          ? "Request submitted successfully!"
          : "Tool created successfully!",
        { type: "success" },
      );

      setShowCreateModal(false);
      refreshProjects?.();
    } catch (err) {
      console.error("Create project error:", err);

      const rawMessage = err?.response?.data?.message || err?.message || "";

      // 🔥 FORCE OVERRIDE BACKEND MESSAGE
      const isInsufficientCredits =
        rawMessage.toLowerCase().includes("insufficient") ||
        rawMessage.toLowerCase().includes("credit");

      const message = isInsufficientCredits
        ? "Insufficient credits to run this scan."
        : "Something went wrong. Please try again.";

      // 🔔 Toast
      show(message, { type: "error", duration: 5000 });

      // 🔴 Modal error UI
      setCreditMessage(message);
      setCreditError(true);

      // ⏱ Auto-close
      setTimeout(() => {
        setCreditError(false);
        setShowCreateModal(false);
      }, 5000);
    }
  };

  return (
    <>
      <div style={overlay} onClick={() => setShowCreateModal(false)}>
        <div
          style={{
            ...modal,
            ...(animate ? modalAnimate : modalStart),
            ...(creditError && {
              border: "2px solid #DC2626",
              boxShadow: "0 0 0 4px rgba(220,38,38,0.25)",
              animation: "shake 0.35s",
            }),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ marginBottom: 10, fontWeight: 700 }}>Assess Tool</h2>

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

          <div style={buttonRow}>
            {/* Cancel */}
            <AwsButton
              label="Cancel"
              onClick={() => setShowCreateModal(false)}
              disabled={saving}
            />

            {/* Save / Request */}
            <AwsButton
              label={
                saving
                  ? isAuditor
                    ? "Requesting…"
                    : "Saving…"
                  : isAuditor
                    ? "Request"
                    : "Save & Evaluate"
              }
              onClick={saveProject}
              disabled={!isValid || saving}
            />
          </div>
          {/* 🔴 Credit info — ONLY for Admin (Save & Evaluate) */}
          {!isAuditor && <CreditInfoNote />}
        </div>
      </div>
    </>
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
  background: "#FFFFFF",
  padding: 24,
  borderRadius: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  maxHeight: "85vh",
  overflowY: "auto",
};

const modalStart = { transform: "scale(0.92)", opacity: 0 };
const modalAnimate = {
  transform: "scale(1)",
  opacity: 1,
  transition: "0.25s",
};

const buttonRow = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 20,
  gap: 12,
};

const toastStyle = {
  position: "fixed",
  bottom: 24,
  right: 24,
  background: "#16A34A",
  color: "#FFF",
  padding: "12px 20px",
  borderRadius: 999,
  boxShadow: "0 12px 40px rgba(22,163,74,0.5)",
};
/* ================= SHAKE ANIMATION ================= */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes shake {
      0% { transform: translateX(0) translateY(-40px); }
      25% { transform: translateX(-4px) translateY(-40px); }
      50% { transform: translateX(4px) translateY(-40px); }
      75% { transform: translateX(-2px) translateY(-40px); }
      100% { transform: translateX(0) translateY(-40px); }
    }
  `;
  document.head.appendChild(style);
}
