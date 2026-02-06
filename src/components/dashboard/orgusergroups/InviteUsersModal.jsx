import React, { useState, useEffect, useRef } from "react";
import { getUserAttributes } from "../../../apiIntegration/organization";
import MultiSelectDropdown from "../../common/MultiSelectDropdown";
import AwsButton from "../../common/AwsButton";
import ReusableModal from "../../common/Reusablemodal";
import useToast from "../../../hooks/useToast";
import { COLORS } from "../../../styles/colors";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function InviteUsersModal({ onClose, onInvite }) {
  const [chipEmails, setChipEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState([]);
  const rolesRef = useRef(null);
  const chipInputRef = useRef(null);

  const [rolesSelected, setRolesSelected] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  /* ---------- VALIDATION STATE ---------- */
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(null);

  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState(false);
  const show = useToast();

  /* ---------- LOAD ROLES / GROUPS ---------- */
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

  /* ---------- VALIDATION ---------- */
  const validate = () => {
    const errs = {};

    if (chipEmails.length === 0) {
      errs.emails = "At least one email is required.";
    }

    if (rolesSelected.length === 0) {
      errs.roles = "Select at least one role.";
    }

    return errs;
  };

  /* ---------- EMAIL CHIP HANDLING ---------- */
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
      if (emailInput.trim()) {
        addEmail(emailInput);
      }

      // 🔥 MARK TOUCHED BEFORE LEAVING
      setTouched((p) => ({ ...p, emails: true }));
      setFocused(null);

      // 🔥 VALIDATE BEFORE MOVING
      const validation = validate();
      setErrors(validation);

      e.preventDefault();

      // move focus to roles
      setTimeout(() => rolesRef.current?.focus?.(), 0);
      return;
    }

    if (saveKeys.includes(e.key) && emailInput.trim()) {
      e.preventDefault();
      addEmail(emailInput);
    }
  };

  /* ---------- SUBMIT ---------- */
  const handleInvite = async () => {
    setSubmitted(true);

    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length) return;

    try {
      setLoading(true);
      const result = await onInvite(chipEmails, rolesSelected, selectedGroups);

      if (result?.success) {
        onClose();
      }
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

  /* ---------- CHIP INPUT STYLE ---------- */
  /* ---------- CHIP INPUT STYLE ---------- */
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

      // Single border - no double ring
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

      // Force remove any inherited properties
      WebkitAppearance: "none",
      MozAppearance: "none",
      appearance: "none",
    };
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
        label={loading ? "Inviting…" : "Invite Users"}
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
      {/* EMAILS */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontWeight: 600,
            fontSize: "14px",
            lineHeight: 1.5,
            color: COLORS.textPrimary,
            marginBottom: "6px",
          }}
        >
          Email(s) <span style={{ color: COLORS.error, marginLeft: 4 }}>*</span>
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
                style={{
                  marginLeft: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
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
              const validation = validate();
              setErrors(validation);

              if (emailInput.trim()) {
                addEmail(emailInput);
              }
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M7 0C3.13438 0 0 3.13438 0 7C0 10.8656 3.13438 14 7 14C10.8656 14 14 10.8656 14 7C14 3.13438 10.8656 0 7 0ZM7 10.5C6.65625 10.5 6.375 10.2188 6.375 9.875V7C6.375 6.65625 6.65625 6.375 7 6.375C7.34375 6.375 7.625 6.65625 7.625 7V9.875C7.625 10.2188 7.34375 10.5 7 10.5ZM7 5.25C6.65625 5.25 6.375 4.96875 6.375 4.625V4.125C6.375 3.78125 6.65625 3.5 7 3.5C7.34375 3.5 7.625 3.78125 7.625 4.125V4.625C7.625 4.96875 7.34375 5.25 7 5.25Z"
                  fill={COLORS.error}
                />
              </svg>
              {errors.emails}
            </p>
          )}
      </div>

      {/* ROLES */}
      <MultiSelectDropdown
        ref={rolesRef}
        label="Assign to Role(s)"
        required
        options={roles.map((r) => ({ label: r, value: r }))}
        selected={rolesSelected}
        onChange={(arr) => {
          setRolesSelected(arr);
          setErrors((p) => ({ ...p, roles: "" }));
        }}
        error={(submitted || touched.roles) && errors.roles}
      />

      {/* GROUPS (OPTIONAL) */}
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
