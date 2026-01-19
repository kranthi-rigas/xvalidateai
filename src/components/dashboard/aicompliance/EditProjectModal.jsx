import React, { useState, useRef } from "react";
import {
  updateComplianceProject, // PATCH – status update
  updateComplianceTool, // PUT – edit tool
} from "../../../apiIntegration/compliance";
import AwsButton from "../../common/AwsButton";
import useToast from "../../../hooks/useToast";

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
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            handleBlur(e);
          }}
          style={{ ...baseStyle, height: 90 }}
        />
      ) : (
        <input
          name={name}
          value={form[name]}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            handleBlur(e);
          }}
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

export default function EditProjectModal({
  project,
  setShowEditModal,
  refreshProjects,
}) {
  const showReasonForAdoption =
    project?.requested_by && project.requested_by.is_staff_admin === false;

  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = userInfo?.roles || [];
  const isAdmin = roles.includes("ADMIN");

  const [form, setForm] = useState({
    projectName: project.name || "",
    description: project.description || "",
    url: project.url || "",
    justification: project.justification || "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const show = useToast();

  const fieldRefs = {
    projectName: useRef(null),
    description: useRef(null),
    url: useRef(null),
    justification: useRef(null),
  };

  const validate = (data = form) => {
    const errs = {};
    if (!data.projectName.trim()) errs.projectName = "Tool Name is required";
    if (!data.description.trim()) errs.description = "Description is required";
    if (!data.url.trim()) errs.url = "Tool URL is required";
    else if (!/^https?:\/\//i.test(data.url))
      errs.url = "URL must start with http or https";

    if (!data.justification.trim()) {
      errs.justification = "Reason for Adoption is required";
    }

    return errs;
  };

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

  /* ================= SAVE (EDIT TOOL API) ================= */
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
      // ✅ EDIT TOOL DETAILS
      await updateComplianceTool(project.project_id, form);

      show("Tool updated successfully!", { type: "success" });

      setShowEditModal(false);
      refreshProjects?.();
    } catch (err) {
      show(err.message || "Failed to update tool", { type: "error" });
    } finally {
      setSaving(false);
    }
  };

  /* ================= OPTIONAL STATUS API (ADMIN) ================= */
  const approveProject = async () => {
    await updateComplianceProject(project.project_id, {
      action: "approve",
      status: "approved",
      comment: "Approved by admin",
    });
    refreshProjects?.();
    setShowEditModal(false);
  };

  const rejectProject = async () => {
    await updateComplianceProject(project.project_id, {
      action: "reject",
      status: "rejected",
      comment: "Rejected by admin",
    });
    refreshProjects?.();
    setShowEditModal(false);
  };

  const status = project?.status;

  // ADMIN → requested → approve/reject
  const showAdminApprovalActions = isAdmin && status === "requested";

  // INSTRUCTOR → requested → cancel/save
  const showInstructorEditActions = !isAdmin && status === "requested";

  // completed / approved / rejected → cancel/save (all roles)
  const showFinalEditActions = status !== "requested";

  return (
    <>
      <div style={overlay} onClick={() => setShowEditModal(false)}>
        <div style={modal} onClick={(e) => e.stopPropagation()}>
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
            {/* 🔴 Admin + requested */}
            {showAdminApprovalActions && (
              <>
                <AwsButton
                  label="Reject"
                  onClick={rejectProject}
                  disabled={saving}
                />
                <AwsButton
                  label="Approve"
                  onClick={approveProject}
                  disabled={saving}
                />
              </>
            )}

            {/* 🟢 Instructor + requested */}
            {showInstructorEditActions && (
              <>
                <AwsButton
                  label="Cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                />
                <AwsButton
                  label={saving ? "Saving…" : "Save Changes"}
                  onClick={saveChanges}
                  disabled={saving}
                />
              </>
            )}

            {/* 🟢 completed / approved / rejected (all roles) */}
            {showFinalEditActions && (
              <>
                <AwsButton
                  label="Cancel"
                  onClick={() => setShowEditModal(false)}
                  disabled={saving}
                />
                <AwsButton
                  label={saving ? "Saving…" : "Save Changes"}
                  onClick={saveChanges}
                  disabled={saving}
                />
              </>
            )}
          </div>
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
  maxHeight: "85vh",
  overflowY: "auto",
  padding: 24,
  background: "#fff",
  borderRadius: 18,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

const toastStyle = {
  position: "fixed",
  bottom: 20,
  right: 20,
  background: "#16A34A",
  color: "#fff",
  padding: "12px 22px",
  borderRadius: 999,
  boxShadow: "0 12px 40px rgba(22,163,74,0.5)",
};
