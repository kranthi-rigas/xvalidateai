import React, { useState, useRef } from "react";
import { updateComplianceTool } from "../../../apiIntegration/compliance";
import AwsButton from "../../common/AwsButton";
import useToast from "../../../hooks/useToast";
import ReusableModal from "../../common/Reusablemodal";
import FormField from "../../common/Formfield";
import CreditInfoNote from "./CreditInfoNote";
import { SHOW_CREDITS } from "@/config/features";
import { useContextElement } from "@/context/Context";

export default function EditProjectModal({
  project,
  setShowEditModal,
  refreshProjects,
}) {
  /* ---------- ROLE ---------- */
  const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
  const roles = userInfo?.roles || [];
  const isAdmin = roles.includes("ADMIN");
  const isAuditor = roles.includes("MANAGER");
  const { refreshUserPlan } = useContextElement();

  // Show credit note only for Admin evaluation
  const showCreditsNote = SHOW_CREDITS && isAdmin && !isAuditor;

  /* ---------- STATE ---------- */
  const [form, setForm] = useState({
    projectName: project?.name || "",
    description: project?.description || "",
    url: project?.url || "",
    justification: project?.justification || "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [creditError, setCreditError] = useState(false);

  const show = useToast();

  /* ---------- FIELD REFS ---------- */
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
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setTouched((prev) => ({ ...prev, [name]: false }));
  };

  const handleBlur = (e) => {
    const field = e.target.name;
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate(form));
  };

  /* ---------- SAVE ---------- */
  const saveChanges = async () => {
    const validation = validate(form);
    setErrors(validation);

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
      await updateComplianceTool(project.project_id, form);

      show("Tool updated successfully!", { type: "success" });

      setShowEditModal(false);
      refreshProjects?.();
      try {
        await refreshUserPlan?.();
      } catch (planErr) {
        show("Plan refresh failed:", { type: "error" });
      }
    } catch (err) {
      const rawMessage = err?.response?.data?.message || err?.message || "";

      const isInsufficientCredits =
        rawMessage.toLowerCase().includes("insufficient") ||
        rawMessage.toLowerCase().includes("credit") ||
        err?.response?.status === 402;

      const message = isInsufficientCredits
        ? "Insufficient credits to run this scan."
        : "Failed to update tool. Please try again.";

      show(message, { type: "error", duration: 5000 });
      setCreditError(true);

      setTimeout(() => {
        setCreditError(false);
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- FOOTER ---------- */
  const footer = (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 justify-end">
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
      </div>
    </div>
  );

  /* ---------- UI ---------- */
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
        rows={2}
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

      {showCreditsNote && (
        <CreditInfoNote text="This assessment will consume 10 credits from your balance." />
      )}
    </ReusableModal>
  );
}
