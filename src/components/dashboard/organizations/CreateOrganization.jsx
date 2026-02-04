import React, { useState, useEffect, useRef } from "react";
import AwsButton from "../../common/AwsButton";
import ReusableModal from "../../common/Reusablemodal";
import FormField from "../../common/Formfield";
import { createOrganization } from "../../../apiIntegration/organization";
import { fetchUserProfile } from "../../../apiIntegration/auth";
import useToast from "../../../hooks/useToast";

export default function CreateOrganizationModal({ setShowCreateModal }) {
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

  /* ---------- FIELD REFS (FOR SCROLL) ---------- */
  const fieldRefs = {
    name: useRef(null),
    slug: useRef(null),
    description: useRef(null),
    email: useRef(null),
    address: useRef(null),
  };

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
    setTouched((p) => ({ ...p, [name]: false }));
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

    // Mark all fields as touched
    setTouched({
      name: true,
      slug: true,
      description: true,
      email: true,
      address: true,
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

      setTimeout(() => setShowCreateModal(false), 1200);
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
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FOOTER ---------- */
  const footer = (
    <>
      <AwsButton
        label="Cancel"
        variant="secondary"
        onClick={() => setShowCreateModal(false)}
        disabled={loading}
      />
      <AwsButton
        label={loading ? "Creating..." : "Create Organization"}
        variant="primary"
        onClick={handleSubmit}
        disabled={loading || !isFormValid()}
        loading={loading}
      />
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={() => setShowCreateModal(false)}
      title="Create Organization"
      footer={footer}
      size="md"
      error={modalError}
      closeOnOverlayClick={!loading}
    >
      <FormField
        label="Organization Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
        touched={touched.name}
        required
        placeholder="Enter organization name"
        fieldRef={fieldRefs.name}
      />

      <FormField
        label="Slug"
        name="slug"
        value={form.slug}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.slug}
        touched={touched.slug}
        required
        placeholder="app"
        disabled
        fieldRef={fieldRefs.slug}
        helperText="Only lowercase letters, numbers & hyphens allowed"
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
        placeholder="Short description"
        type="textarea"
        rows={3}
        fieldRef={fieldRefs.description}
      />

      <FormField
        label="Email"
        name="email"
        value={form.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        touched={touched.email}
        required
        type="email"
        disabled
        fieldRef={fieldRefs.email}
      />

      <FormField
        label="Address"
        name="address"
        value={form.address}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.address}
        touched={touched.address}
        required
        placeholder="Organization address"
        type="textarea"
        rows={3}
        fieldRef={fieldRefs.address}
      />
    </ReusableModal>
  );
}
