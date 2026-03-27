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
  // Tab state
  const [activeTab, setActiveTab] = useState("manual");

  // Manual tab state
  const [chipEmails, setChipEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  // Bulk tab state
  const [bulkEmails, setBulkEmails] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
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
    chipInputRef.current?.focus();
  }, []);

  const validate = () => {
    const errs = {};
    const activeEmails =
      activeTab === "manual" ? chipEmails : bulkEmails.map((e) => e.email);

    if (activeEmails.length === 0) {
      errs.emails =
        activeTab === "manual"
          ? "At least one email is required."
          : "Please upload a file with at least one email.";
    }
    if (!rolesSelected) {
      errs.roles = "Select at least one role.";
    }
    return errs;
  };

  // Manual: chip handling
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

  // Bulk: parse CSV / Excel
  const extractEmailsFromText = (text) => {
    const lines = text
      .split(/[\n,;]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const filtered = lines.filter(
      (l) => !l.toLowerCase().startsWith("email") || l.includes("@"),
    );
    setBulkEmails(
      filtered.map((email) => ({ email, valid: isValidEmail(email) })),
    );
  };

  const parseFile = (file) => {
    if (!file) return;
    setBulkFile(file);
    setErrors((p) => ({ ...p, emails: "" }));

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = (e) => extractEmailsFromText(e.target.result);
      reader.readAsText(file);
    } else if (["xlsx", "xls"].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const allCells = rows.flat().map((c) => String(c || "").trim());
        const emails = allCells.filter((c) => c.includes("@"));
        setBulkEmails(
          emails.map((email) => ({ email, valid: isValidEmail(email) })),
        );
      };
      reader.readAsArrayBuffer(file);
    } else {
      show("Unsupported file. Please upload a CSV or Excel file.", {
        type: "error",
      });
    }
  };

  const handleBulkDrop = (e) => {
    e.preventDefault();
    setBulkDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const removeBulkEmail = (index) => {
    setBulkEmails((prev) => prev.filter((_, i) => i !== index));
  };

  const clearBulkUpload = () => {
    setBulkFile(null);
    setBulkEmails([]);
    if (bulkFileRef.current) bulkFileRef.current.value = "";
  };

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

  const handleInvite = async () => {
    setSubmitted(true);
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    const emailsToInvite =
      activeTab === "manual"
        ? chipEmails
        : bulkEmails.filter((e) => e.valid).map((e) => e.email);

    if (emailsToInvite.length === 0) {
      setErrors((p) => ({ ...p, emails: "No valid emails to invite." }));
      return;
    }

    try {
      setLoading(true);
      const result = await onInvite(
        emailsToInvite,
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
  const inviteCount =
    activeTab === "manual" ? chipEmails.length : validBulkCount;

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
      {/* ── TAB SWITCHER ── */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 20,
          background: COLORS.surfaceLight || "#F3F4F6",
          borderRadius: 10,
          padding: 4,
        }}
      >
        {[
          { key: "manual", label: "✏️ Manual Entry" },
          { key: "bulk", label: "📄 Bulk Upload" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSubmitted(false);
              setErrors({});
            }}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              transition: "all 0.15s ease",
              background: activeTab === tab.key ? "#fff" : "transparent",
              color:
                activeTab === tab.key
                  ? COLORS.textPrimary || "#111827"
                  : COLORS.textSecondary || "#6B7280",
              boxShadow:
                activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── MANUAL ENTRY TAB ── */}
      {activeTab === "manual" && (
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: 14,
              lineHeight: 1.5,
              color: COLORS.textPrimary,
              marginBottom: 6,
            }}
          >
            Email(s){" "}
            <span style={{ color: COLORS.error, marginLeft: 4 }}>*</span>
          </label>

          <div
            style={chipBoxStyle()}
            onClick={() => chipInputRef.current?.focus()}
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
                background: "transparent",
                flex: 1,
                minWidth: 140,
                fontSize: 14,
                padding: "4px",
              }}
            />
          </div>

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
      )}

      {/* ── BULK UPLOAD TAB ── */}
      {activeTab === "bulk" && (
        <div style={{ marginBottom: 20 }}>
          {/* Download template link */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <label
              style={{
                fontWeight: 600,
                fontSize: 14,
                color: COLORS.textPrimary,
              }}
            >
              Upload File <span style={{ color: COLORS.error }}>*</span>
            </label>
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
              }}
            >
              <i className="fa-solid fa-download" style={{ fontSize: 11 }} />
              Download Template
            </button>
          </div>

          {/* Drop zone */}
          {!bulkFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setBulkDragOver(true);
              }}
              onDragLeave={() => setBulkDragOver(false)}
              onDrop={handleBulkDrop}
              onClick={() => bulkFileRef.current?.click()}
              style={{
                border: `2px dashed ${bulkDragOver ? COLORS.borderFocus || "#2563EB" : COLORS.borderLight || "#D1D5DB"}`,
                borderRadius: 12,
                padding: "32px 20px",
                textAlign: "center",
                cursor: "pointer",
                background: bulkDragOver
                  ? "#EFF6FF"
                  : COLORS.surfaceLight || "#F9FAFB",
                transition: "all 0.15s ease",
              }}
            >
              <i
                className="fa-solid fa-file-arrow-up"
                style={{
                  fontSize: 32,
                  color: "#9CA3AF",
                  marginBottom: 10,
                  display: "block",
                }}
              />
              <p
                style={{
                  fontSize: 14,
                  color: COLORS.textPrimary,
                  fontWeight: 500,
                  margin: 0,
                }}
              >
                <span
                  style={{
                    color: COLORS.borderFocus || "#2563EB",
                    fontWeight: 600,
                  }}
                >
                  Click to upload
                </span>{" "}
                or drag & drop
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                CSV, XLS, or XLSX — one email per row under an "email" column
              </p>
              <input
                ref={bulkFileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => parseFile(e.target.files[0])}
              />
            </div>
          ) : (
            /* File uploaded — show parsed results */
            <div>
              {/* File info bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  background: "#F0FDF4",
                  border: "1px solid #86EFAC",
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                <i
                  className="fa-solid fa-file-csv"
                  style={{ color: "#16A34A", fontSize: 18 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#15803D",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bulkFile.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#4ADE80" }}>
                    {validBulkCount} valid email
                    {validBulkCount !== 1 ? "s" : ""}
                    {invalidBulkCount > 0 && (
                      <span style={{ color: "#EF4444", marginLeft: 6 }}>
                        · {invalidBulkCount} invalid
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearBulkUpload}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#6B7280",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                  title="Remove file"
                >
                  ×
                </button>
              </div>

              {/* Email list preview */}
              <div
                style={{
                  maxHeight: 180,
                  overflowY: "auto",
                  border: `1px solid ${COLORS.borderLight || "#E5E7EB"}`,
                  borderRadius: 10,
                  background: "#fff",
                }}
              >
                {bulkEmails.length === 0 ? (
                  <p
                    style={{
                      textAlign: "center",
                      padding: 16,
                      fontSize: 13,
                      color: "#9CA3AF",
                    }}
                  >
                    No emails found in file
                  </p>
                ) : (
                  bulkEmails.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "8px 12px",
                        borderBottom:
                          i < bulkEmails.length - 1
                            ? `1px solid ${COLORS.borderLight || "#F3F4F6"}`
                            : "none",
                        gap: 8,
                      }}
                    >
                      <i
                        className={
                          item.valid
                            ? "fa-solid fa-circle-check"
                            : "fa-solid fa-circle-xmark"
                        }
                        style={{
                          fontSize: 14,
                          color: item.valid ? "#22C55E" : "#EF4444",
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13,
                          color: item.valid ? COLORS.textPrimary : "#EF4444",
                          fontFamily: "monospace",
                        }}
                      >
                        {item.email}
                      </span>
                      {!item.valid && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#EF4444",
                            background: "#FEE2E2",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          Invalid
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeBulkEmail(i)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#9CA3AF",
                          fontSize: 14,
                          lineHeight: 1,
                          padding: "0 2px",
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Re-upload link */}
              <button
                type="button"
                onClick={() => {
                  clearBulkUpload();
                  setTimeout(() => bulkFileRef.current?.click(), 50);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: COLORS.borderFocus || "#2563EB",
                  marginTop: 8,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <i
                  className="fa-solid fa-arrow-rotate-left"
                  style={{ fontSize: 11 }}
                />
                Upload a different file
              </button>
            </div>
          )}

          {submitted && errors.emails && (
            <p
              style={{
                color: COLORS.error,
                fontSize: 12,
                marginTop: 6,
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
      )}

      {/* ── ROLES (shared) ── */}
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

      {/* ── GROUPS (shared, optional) ── */}
      <MultiSelectDropdown
        label="Assign to Group(s)"
        options={groups.map((g) => ({
          label: g.name,
          value: g.group_id,
        }))}
        selected={selectedGroups}
        onChange={setSelectedGroups}
      />
    </ReusableModal>
  );
}
