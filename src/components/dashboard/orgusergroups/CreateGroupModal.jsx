import React, { useState, useEffect, useRef } from "react";
import { COLORS } from "../../../styles/colors";
import { getUserAttributes } from "../../../apiIntegration/organization";
import MultiSelectDropdown from "../../common/MultiSelectDropdown";
import AwsButton from "../../common/AwsButton";
import ReusableModal from "../../common/Reusablemodal";
import FormField from "../../common/FormField";
import useToast from "../../../hooks/useToast";

export default function CreateGroupModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [permissionsList, setPermissionsList] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState(false);
  const show = useToast();

  const nameRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    try {
      const res = await getUserAttributes();
      const perms = (res.roles || []).map((r) => ({
        label: r.charAt(0).toUpperCase() + r.slice(1).toLowerCase(),
        value: r,
      }));
      setPermissionsList(perms);
    } catch (err) {
      console.error("Failed permissions:", err);
      show("Failed to load permissions", { type: "error" });
    }
  }

  /* ---------- VALIDATION ---------- */
  const validate = (data = form) => {
    const errs = {};

    if (!data.name.trim()) errs.name = "Group name is required.";
    if (!data.description.trim()) errs.description = "Description is required.";
    if (selectedPermissions.length === 0)
      errs.permissions = "Select at least one permission.";

    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => ({ ...p, [name]: value }));

    // CLEAR ERROR WHILE TYPING
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: false,
    }));
  };

  const handleBlur = (e) => {
    const field = e.target.name;
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate());
  };

  const handleCreate = async () => {
    setSubmitted(true);
    const validation = validate();
    setErrors(validation);

    // Mark all fields as touched
    setTouched({
      name: true,
      description: true,
      permissions: true,
    });

    if (Object.keys(validation).length) {
      // Scroll to first error
      const firstErrorField = Object.keys(validation)[0];
      if (firstErrorField === "name" && nameRef.current) {
        nameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (firstErrorField === "description" && descriptionRef.current) {
        descriptionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    try {
      setLoading(true);

      const result = await onCreate({
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: selectedPermissions,
        tags: [],
        metadata: {},
      });

      if (result.success) {
        // Success toast is shown by parent component
        onClose();
      } else {
        // Only show error toast if creation failed
        const message =
          result.error || "Failed to create group. Please try again.";
        show(message, { type: "error", duration: 5000 });
        setModalError(true);
        setTimeout(() => setModalError(false), 5000);
      }
    } catch (err) {
      console.error("Create group error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create group. Please try again.";

      show(message, { type: "error", duration: 5000 });

      setModalError(true);
      setTimeout(() => setModalError(false), 5000);
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
        onClick={onClose}
        disabled={loading}
      />
      <AwsButton
        label={loading ? "Creating…" : "Create Group"}
        variant="primary"
        onClick={handleCreate}
        disabled={loading}
        loading={loading}
      />
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={onClose}
      title="Create New Group"
      footer={footer}
      size="md"
      error={modalError}
      closeOnOverlayClick={!loading}
    >
      <FormField
        label="Group Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.name}
        touched={touched.name}
        required
        placeholder="Enter group name..."
        fieldRef={nameRef}
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
        placeholder="Enter description..."
        type="textarea"
        rows={2}
        fieldRef={descriptionRef}
      />

      <MultiSelectDropdown
        label="Permissions"
        required
        options={permissionsList}
        selected={selectedPermissions}
        onChange={(arr) => {
          setSelectedPermissions(arr);
          setErrors((p) => ({ ...p, permissions: "" }));
        }}
        error={(submitted || touched.permissions) && errors.permissions}
      />
    </ReusableModal>
  );
}
