import React, { useState, useEffect, useRef } from "react";
import { createComplianceProject } from "../../../apiIntegration/compliance";
import AwsButton from "../../common/AwsButton";
import useToast from "../../../hooks/useToast";
import ReusableModal from "../../common/Reusablemodal";
import FormField from "../../common/Formfield";
import CreditInfoNote from "./CreditInfoNote";

export default function CreateProjectModal({
  setShowCreateModal,
  refreshProjects,
}) {
  /* ---------- ROLE ---------- */
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = userInfo?.roles || [];

  const isAdmin = roles.includes("ADMIN");
  const isAuditor = roles.includes("AUDITOR");

  const showCreditsNote = isAdmin && !isAuditor;

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

  const [creditError, setCreditError] = useState(false);

  /* ---------- FIELD REFS (FOR SCROLL) ---------- */
  const fieldRefs = {
    projectName: useRef(null),
    description: useRef(null),
    url: useRef(null),
    justification: useRef(null),
  };

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

    // CLEAR ERROR + TOUCHED when typing
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

    // Mark all fields as touched
    setTouched({
      projectName: true,
      description: true,
      url: true,
      justification: true,
    });

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

      // FORCE OVERRIDE BACKEND MESSAGE
      const isInsufficientCredits =
        rawMessage.toLowerCase().includes("insufficient") ||
        rawMessage.toLowerCase().includes("credit");

      const message = isInsufficientCredits
        ? "Insufficient credits to run this scan."
        : "Something went wrong. Please try again.";

      // Toast
      show(message, { type: "error", duration: 5000 });

      // Modal error UI
      setCreditError(true);

      // Auto-close
      setTimeout(() => {
        setCreditError(false);
        setShowCreateModal(false);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- FOOTER ---------- */
  const footer = (
    <>
      <AwsButton
        label="Cancel"
        variant="secondary"
        onClick={() => setShowCreateModal(false)}
        disabled={saving}
      />
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
        variant="primary"
        onClick={saveProject}
        disabled={!isValid || saving}
        loading={saving}
      >
        {!saving && (
          <i
            className="fa-solid fa-gear"
            style={{ fontSize: "14px" }}
            aria-hidden="true"
          ></i>
        )}
      </AwsButton>
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={() => setShowCreateModal(false)}
      title="Assess Tool"
      footer={footer}
      size="md"
      error={creditError}
      closeOnOverlayClick={!saving}
    >
      <FormField
        label="Tool Name"
        name="projectName"
        value={form.projectName}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.projectName}
        touched={touched.projectName}
        required
        placeholder="Enter tool name..."
        fieldRef={fieldRefs.projectName}
      />

      <FormField
        label="Description"
        name="description"
        value={form.description}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.description}
        touched={touched.description}
        required
        placeholder="Enter a short description..."
        type="textarea"
        rows={1}
        fieldRef={fieldRefs.description}
        helperText={`${form.description.length}/100 characters`}
      />

      <FormField
        label="Tool URL"
        name="url"
        value={form.url}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.url}
        touched={touched.url}
        required
        placeholder="https://example.com"
        type="url"
        fieldRef={fieldRefs.url}
      />

      <FormField
        label="Reason for Adoption"
        name="justification"
        value={form.justification}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.justification}
        touched={touched.justification}
        required
        placeholder="Explain the reason for adopting this tool..."
        type="textarea"
        rows={2}
        fieldRef={fieldRefs.justification}
      />
      {/* ✅ Credit Message BELOW buttons */}
      {showCreditsNote && (
        <div className="pt-1">
          <CreditInfoNote text="Each assessment consumes 10 credits." />
        </div>
      )}
    </ReusableModal>
  );
}
