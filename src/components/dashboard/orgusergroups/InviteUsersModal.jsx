import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { getUserAttributes } from "../../../apiIntegration/organization";
import SingleSelectDropdown from "../../common/SingleSelectDropdown";
import MultiSelectDropdown from "../../common/MultiSelectDropdown";
import AwsButton from "../../common/AwsButton";
import ReusableModal from "../../common/Reusablemodal";
import useToast from "../../../hooks/useToast";
import { COLORS } from "../../../styles/colors";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function InviteUsersModal({ onClose, onInvite }) {
  // Email chip state
  const [chipEmails, setChipEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  // File upload state
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkEmails, setBulkEmails] = useState([]); // { email, valid }[] — for counts display
  const bulkFileRef = useRef(null);

  // Shared state
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const rolesRef = useRef(null);
  const chipInputRef = useRef(null);

  const [rolesSelected, setRolesSelected] = useState("");
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);
  const [emailActivated, setEmailActivated] = useState(false); // ✅ ADD THIS
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState(false);
  const show = useToast();

  useEffect(() => {
    async function loadAttributes() {
      try {
        const res = await getUserAttributes();
        setRoles(res.roles || []);
        setGroups(res.groups || []);
      } catch (err) {
        console.error("Failed to load attributes:", err);
        show("Failed to load user attributes", { type: "error" });
      }
    }
    loadAttributes();
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (chipEmails.length === 0) {
      errs.emails = "At least one email is required.";
    }
    if (!rolesSelected) {
      errs.roles = "Select at least one role.";
    }
    return errs;
  };

  // ── Manual chip handling ───────────────────────────────────────────────────
  const addEmail = (email) => {
    const clean = email.trim();
    if (!clean) return;
    if (!chipEmails.includes(clean)) {
      setChipEmails((prev) => [...prev, clean]);
    }
    setEmailInput("");
    setErrors((p) => ({ ...p, emails: "" }));
  };

  const removeEmail = (i) => {
    setChipEmails((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleChipInput = (e) => {
    const saveKeys = ["Enter", ",", " "];
    if (e.key === "Tab") {
      if (emailInput.trim()) addEmail(emailInput);
      setTouched((p) => ({ ...p, emails: true }));
      setFocused(null);
      setErrors(validate());
      e.preventDefault();
      setTimeout(() => rolesRef.current?.focus?.(), 0);
      return;
    }
    if (saveKeys.includes(e.key) && emailInput.trim()) {
      e.preventDefault();
      addEmail(emailInput);
    }
  };

  // ── File parsing — imports directly into chip emails ───────────────────────
  const parseFile = (file) => {
    if (!file) return;
    setBulkFile(file);
    setErrors((p) => ({ ...p, emails: "" }));

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const lines = e.target.result
          .split(/[\n,;]+/)
          .map((l) => l.trim())
          .filter(Boolean)
          .filter((l) => l.includes("@")); // only email-like values

        const parsed = lines.map((email) => ({
          email,
          valid: isValidEmail(email),
        }));
        setBulkEmails(parsed);
        // ✅ Merge valid emails directly into chip emails
        const validEmails = parsed.filter((e) => e.valid).map((e) => e.email);
        setChipEmails((prev) => [...new Set([...prev, ...validEmails])]);
      };
      reader.readAsText(file);
    } else if (["xlsx", "xls"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const allCells = rows.flat().map((c) => String(c || "").trim());
        const emailCells = allCells.filter((c) => c.includes("@"));
        const parsed = emailCells.map((email) => ({
          email,
          valid: isValidEmail(email),
        }));
        setBulkEmails(parsed);
        // ✅ Merge valid emails directly into chip emails
        const validEmails = parsed.filter((e) => e.valid).map((e) => e.email);
        setChipEmails((prev) => [...new Set([...prev, ...validEmails])]);
      };
      reader.readAsArrayBuffer(file);
    } else {
      show("Unsupported file. Please upload a CSV or Excel file.", {
        type: "error",
      });
    }
  };

  const clearBulkUpload = () => {
    setBulkFile(null);
    setBulkEmails([]);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
  };

  // ── Download CSV template ──────────────────────────────────────────────────
  const downloadTemplate = () => {
    const csv =
      "email\nuser1@example.com\nuser2@example.com\nuser3@example.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invite-users-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleInvite = async () => {
    setSubmitted(true);
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    if (chipEmails.length === 0) {
      setErrors((p) => ({ ...p, emails: "No valid emails to invite." }));
      return;
    }

    try {
      setLoading(true);
      const result = await onInvite(
        chipEmails,
        [rolesSelected],
        selectedGroups,
      );
      if (result?.success) onClose();
    } catch (err) {
      console.error("Invite error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to invite users. Please try again.";
      show(message, { type: "error", duration: 5000 });
      setModalError(true);
      setTimeout(() => setModalError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ── Chip box style ─────────────────────────────────────────────────────────
  const chipBoxStyle = () => {
    const hasError =
      (submitted || touched.emails) &&
      Boolean(errors.emails) &&
      focused !== "emails";
    const isFocused = focused === "emails";
    return {
      width: "100%",
      minHeight: 48,
      borderRadius: 12,
      border: hasError
        ? `2px solid ${COLORS.error || "#DC2626"}`
        : isFocused
          ? `2px solid ${COLORS.borderFocus || "#2563EB"}`
          : `1px solid ${COLORS.borderLight || "#D1D5DB"}`,
      boxShadow: "none",
      outline: "none",
      background: COLORS.surfaceLight || "#F9FAFB",
      padding: "6px 10px",
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      transition: "border 0.15s ease",
      cursor: "text",
      WebkitAppearance: "none",
      MozAppearance: "none",
      appearance: "none",
    };
  };

  const validBulkCount = bulkEmails.filter((e) => e.valid).length;
  const invalidBulkCount = bulkEmails.filter((e) => !e.valid).length;
  const inviteCount = chipEmails.length;

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = (
    <>
      <AwsButton
        label="Cancel"
        variant="secondary"
        onClick={onClose}
        disabled={loading}
      />
      <AwsButton
        label={
          loading
            ? "Inviting…"
            : inviteCount > 0
              ? `Invite ${inviteCount} User${inviteCount !== 1 ? "s" : ""}`
              : "Invite Users"
        }
        variant="primary"
        disabled={loading}
        loading={loading}
        onClick={handleInvite}
      />
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={onClose}
      title="Invite Users"
      footer={footer}
      size="md"
      error={modalError}
      closeOnOverlayClick={!loading}
    >
      {/* ── EMAILS ── */}
      <div style={{ marginBottom: 20 }}>
        {/* Label row — label left, Import File button right */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <label
            style={{
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.5,
              color: COLORS.textPrimary,
            }}
          >
            Email(s){" "}
            <span style={{ color: COLORS.error, marginLeft: 4 }}>*</span>
          </label>

          {/* ✅ Import File button */}
          <button
            type="button"
            onClick={() => bulkFileRef.current?.click()}
            title="Import emails from CSV or Excel"
            style={{
              background: "none",
              border: `1px solid ${COLORS.borderLight || "#D1D5DB"}`,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              color: COLORS.textSecondary || "#6B7280",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor =
                COLORS.borderFocus || "#2563EB";
              e.currentTarget.style.color = COLORS.borderFocus || "#2563EB";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                COLORS.borderLight || "#D1D5DB";
              e.currentTarget.style.color = COLORS.textSecondary || "#6B7280";
            }}
          >
            <i className="fa-solid fa-file-arrow-up" style={{ fontSize: 12 }} />
            Import File
          </button>

          {/* Hidden file input */}
          <input
            ref={bulkFileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: "none" }}
            onChange={(e) => parseFile(e.target.files[0])}
          />
        </div>

        {/* Chip input box */}
        <div
          style={{
            ...chipBoxStyle(),
            cursor: emailActivated ? "text" : "default",
          }}
          onClick={() => {
            setEmailActivated(true); // ✅ activate on click
            setTimeout(() => chipInputRef.current?.focus(), 0);
          }}
          tabIndex={-1}
        >
          {chipEmails.map((email, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "4px 10px",
                background: isValidEmail(email) ? "#E0E7FF" : "#FEE2E2",
                color: isValidEmail(email) ? "#3730A3" : "#B91C1C",
                borderRadius: 20,
                fontSize: 13,
              }}
            >
              {email}
              <span
                style={{ marginLeft: 8, cursor: "pointer", fontWeight: 700 }}
                onClick={() => removeEmail(i)}
              >
                ×
              </span>
            </div>
          ))}
          <input
            ref={chipInputRef}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleChipInput}
            onFocus={() => setFocused("emails")}
            onBlur={() => {
              setFocused(null);
              setTouched((p) => ({ ...p, emails: true }));
              setErrors(validate());
              if (emailInput.trim()) addEmail(emailInput);
            }}
            placeholder="Enter email and press Enter…"
            style={{
              border: "none",
              outline: "none",
              boxShadow: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
              background: "transparent",
              flex: 1,
              minWidth: 140,
              fontSize: 14,
              padding: "4px",
              pointerEvents: emailActivated ? "auto" : "none", // ✅ blocks mouse until activated
              cursor: emailActivated ? "text" : "default",
            }}
          />
        </div>

        {/* ✅ File import info bar — shown after a file is uploaded */}
        {bulkFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              padding: "7px 12px",
              background: "#F0FDF4",
              border: "1px solid #86EFAC",
              borderRadius: 8,
            }}
          >
            <i
              className="fa-solid fa-file-csv"
              style={{ color: "#16A34A", fontSize: 14, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#15803D",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {bulkFile.name}
              </span>
              <span style={{ fontSize: 11, color: "#4ADE80" }}>
                {validBulkCount} email{validBulkCount !== 1 ? "s" : ""} imported
                {invalidBulkCount > 0 && (
                  <span style={{ color: "#EF4444", marginLeft: 6 }}>
                    · {invalidBulkCount} skipped (invalid)
                  </span>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearBulkUpload();
                // Remove imported emails from chips? Optional — keep them since user may want them
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6B7280",
                fontSize: 16,
                lineHeight: 1,
                flexShrink: 0,
              }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* ✅ Download template link — always visible below chip box */}
        <button
          type="button"
          onClick={downloadTemplate}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            color: COLORS.borderFocus || "#2563EB",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: bulkFile ? 6 : 8,
            padding: 0,
          }}
        >
          <i className="fa-solid fa-download" style={{ fontSize: 11 }} />
          Download Template
        </button>

        {/* Validation error */}
        {(submitted || touched.emails) &&
          errors.emails &&
          focused !== "emails" && (
            <p
              style={{
                color: COLORS.error,
                fontSize: 12,
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <i
                className="fa-solid fa-circle-exclamation"
                style={{ fontSize: 12 }}
              />
              {errors.emails}
            </p>
          )}
      </div>

      {/* ── ROLES ── */}
      <SingleSelectDropdown
        ref={rolesRef}
        label="Assign to Role"
        required
        options={roles.map((r) => ({ label: r, value: r }))}
        selected={rolesSelected}
        onChange={(val) => {
          setRolesSelected(val);
          setErrors((p) => ({ ...p, roles: "" }));
        }}
        error={(submitted || touched.roles) && errors.roles}
      />

      {/* ── GROUPS (optional) ── */}

      {/*
      <MultiSelectDropdown
      
       label="Assign to Group(s)"
        options={groups.map((g) => ({
          label: g.name,
          value: g.group_id,
        }))}
        selected={selectedGroups}
        onChange={setSelectedGroups}
      />
*/}
    </ReusableModal>
  );
}
