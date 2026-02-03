import React, { useState, useRef } from "react";
import {
  updateComplianceProject, // PATCH – status update
  updateComplianceTool, // PUT – edit tool
} from "../../../apiIntegration/compliance";
import AwsButton from "../../common/AwsButton";
import useToast from "../../../hooks/useToast";
import ReusableModal from "../../common/ReusableModal";
import FormField from "../../common/FormField";

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

  /* ---------- STATE ---------- */
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
    if (!data.url.trim()) errs.url = "Tool URL is required";
    else if (!/^https?:\/\//i.test(data.url))
      errs.url = "URL must start with http or https";

    if (!data.justification.trim()) {
      errs.justification = "Reason for Adoption is required";
    }

    return errs;
  };

  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-add https:// for URL field
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
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }

    // CLEAR ERROR + TOUCHED when typing
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setTouched((prev) => ({ ...prev, [name]: false }));
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

    // Mark all fields as touched
    setTouched({
      projectName: true,
      description: true,
      url: true,
      justification: true,
    });

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
      console.error("Edit project error:", err);

      const rawMessage = err?.response?.data?.message || err?.message || "";

      const isInsufficientCredits =
        rawMessage.toLowerCase().includes("insufficient") ||
        rawMessage.toLowerCase().includes("credit") ||
        err?.response?.status === 402;

      const message = isInsufficientCredits
        ? "Insufficient credits to run this scan."
        : "Failed to update tool. Please try again.";

      // 🔔 Toast only
      show(message, { type: "error", duration: 5000 });

      // 🔴 Modal visual feedback only
      setCreditError(true);

      // ⏱ Remove error state after toast
      setTimeout(() => {
        setCreditError(false);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  /* ================= OPTIONAL STATUS API (ADMIN) ================= */
  const approveProject = async () => {
    try {
      await updateComplianceProject(project.project_id, {
        action: "approve",
        status: "approved",
        comment: "Approved by admin",
      });
      show("Tool approved successfully!", { type: "success" });
      refreshProjects?.();
      setShowEditModal(false);
    } catch (err) {
      show("Failed to approve tool. Please try again.", { type: "error" });
    }
  };

  const rejectProject = async () => {
    try {
      await updateComplianceProject(project.project_id, {
        action: "reject",
        status: "rejected",
        comment: "Rejected by admin",
      });
      show("Tool rejected successfully!", { type: "success" });
      refreshProjects?.();
      setShowEditModal(false);
    } catch (err) {
      show("Failed to reject tool. Please try again.", { type: "error" });
    }
  };

  const status = project?.status;

  // ADMIN → requested → approve/reject
  const showAdminApprovalActions = isAdmin && status === "requested";

  // INSTRUCTOR → requested → cancel/save
  const showInstructorEditActions = !isAdmin && status === "requested";

  // completed / approved / rejected → cancel/save (all roles)
  const showFinalEditActions = status !== "requested";

  /* ---------- FOOTER ---------- */
  const footer = (
    <>
      {/* 🔴 Admin + requested */}
      {showAdminApprovalActions && (
        <>
          <AwsButton
            label="Reject"
            variant="secondary"
            onClick={rejectProject}
            disabled={saving}
          />
          <AwsButton
            label="Approve"
            variant="primary"
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
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={saving}
          />
          <AwsButton
            label={saving ? "Saving…" : "Save Changes"}
            variant="primary"
            onClick={saveChanges}
            disabled={saving}
            loading={saving}
          />
        </>
      )}

      {/* 🟢 completed / approved / rejected (all roles) */}
      {showFinalEditActions && (
        <>
          <AwsButton
            label="Cancel"
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={saving}
          />
          <AwsButton
            label={saving ? "Saving…" : "Save Changes"}
            variant="primary"
            onClick={saveChanges}
            disabled={saving}
            loading={saving}
          />
        </>
      )}
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={() => setShowEditModal(false)}
      title="Edit Tool"
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
        rows={3}
        fieldRef={fieldRefs.description}
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
        rows={3}
        fieldRef={fieldRefs.justification}
      />
    </ReusableModal>
  );
}
