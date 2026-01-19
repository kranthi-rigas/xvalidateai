import React, { useState, useEffect, useRef } from "react";
import { getUserAttributes } from "../../../apiIntegration/organization";
import MultiSelectDropdown from "../../common/MultiSelectDropdown";
import AwsButton from "../../common/AwsButton";

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
  const [focused, setFocused] = useState(null);

  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
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

    // 🔥 CLEAR ERROR WHILE TYPING
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleBlur = (e) => {
    const field = e.target.name;
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors(validate());
    setFocused(null);
  };

  const handleCreate = async () => {
    setSubmitted(true);
    const validation = validate();
    setErrors(validation);

    if (Object.keys(validation).length) return;

    setLoading(true);

    const result = await onCreate({
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: selectedPermissions,
      tags: [],
      metadata: {},
    });

    setLoading(false);
    if (result.success) onClose();
  };

  const fieldStyle = (field) => {
    const hasError = (touched[field] || submitted) && Boolean(errors[field]);
    const isFocused = focused === field;

    return {
      width: "100%",
      padding: "11px 13px",
      borderRadius: 12,
      fontSize: 14,
      background: "#F9FAFB",
      outline: "none",
      marginBottom: 4,

      /* 🔥 FIXED PRIORITY */
      border: isFocused
        ? "1.5px solid #2563EB"
        : hasError
          ? "1.5px solid #DC2626"
          : "1px solid #E5E7EB",

      boxShadow: isFocused
        ? "0 0 0 3px rgba(37,99,235,0.25)"
        : hasError
          ? "0 0 0 3px rgba(220,38,38,0.25)"
          : "none",

      transition: "all 0.15s ease",
    };
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          width: 520,
          maxHeight: "85vh", // 🔥 LIMIT HEIGHT
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "28px 32px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
        }}
      >
        <h2 style={{ fontSize: 23, fontWeight: 600, marginBottom: 15 }}>
          Create New Group
        </h2>

        {/* GROUP NAME */}
        <label style={{ fontWeight: 600 }}>
          Group Name <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <input
          ref={inputRef}
          name="name"
          value={form.name}
          placeholder="Enter group name..."
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setFocused("name")}
          style={fieldStyle("name")}
        />
        {errors.name && focused !== "name" && (
          <p style={{ color: "#DC2626", fontSize: 12 }}>{errors.name}</p>
        )}

        {/* DESCRIPTION */}
        <label style={{ fontWeight: 600, marginTop: 18, display: "block" }}>
          Description <span style={{ color: "#DC2626" }}>*</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          placeholder="Enter description..."
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setFocused("description")}
          style={{ ...fieldStyle("description"), height: 60 }}
        />
        {(touched.description || submitted) && errors.description && (
          <p style={{ color: "#DC2626", fontSize: 12 }}>{errors.description}</p>
        )}

        {/* PERMISSIONS */}
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

        {/* BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 22,
          }}
        >
          <AwsButton label="Cancel" onClick={onClose} disabled={loading} />
          <AwsButton
            label={loading ? "Creating…" : "Create Group"}
            onClick={handleCreate}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
