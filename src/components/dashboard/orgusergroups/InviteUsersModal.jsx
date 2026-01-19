import React, { useState, useEffect, useRef } from "react";
import { getUserAttributes } from "../../../apiIntegration/organization";
import MultiSelectDropdown from "../../common/MultiSelectDropdown";
import AwsButton from "../../common/AwsButton";

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

  /* ---------- LOAD ROLES / GROUPS ---------- */
  useEffect(() => {
    async function loadAttributes() {
      try {
        const res = await getUserAttributes();
        setRoles(res.roles || []);
        setGroups(res.groups || []);
      } catch (err) {
        console.error("Failed to load attributes:", err);
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

    setLoading(true);
    const result = await onInvite(chipEmails, rolesSelected, selectedGroups);
    setLoading(false);

    if (result?.success) onClose();
  };

  /* ---------- CHIP INPUT STYLE ---------- */
  const chipBoxStyle = () => {
    const hasError =
      (submitted || touched.emails) &&
      Boolean(errors.emails) &&
      focused !== "emails"; // 🔥 KEY LINE

    const isFocused = focused === "emails";

    return {
      width: "100%",
      minHeight: 48,
      borderRadius: 12,

      border: isFocused
        ? "1.5px solid #2563EB"
        : hasError
          ? "1.5px solid #DC2626"
          : "1px solid #D1D5DB",

      boxShadow: isFocused
        ? "0 0 0 3px rgba(37,99,235,0.25)"
        : hasError
          ? "0 0 0 3px rgba(220,38,38,0.25)"
          : "none",

      background: "#F9FAFB",
      padding: "6px 10px",
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      transition: "all 0.15s ease",
    };
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2 style={title}>Invite Users</h2>

        {/* EMAILS */}
        <label style={label}>
          Email(s) <span style={requiredStar}>*</span>
        </label>

        <div
          style={chipBoxStyle()}
          onClick={() => chipInputRef.current?.focus()}
        >
          {chipEmails.map((email, i) => (
            <div key={i} style={chip(email)}>
              {email}
              <span style={chipClose} onClick={() => removeEmail(i)}>
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
              // 🔥 VALIDATE IMMEDIATELY
              const validation = validate();
              setErrors(validation);

              if (emailInput.trim()) {
                addEmail(emailInput);
              }
            }}
            placeholder="Enter email and press Enter…"
            style={chipInput}
          />
        </div>

        {(submitted || touched.emails) &&
          errors.emails &&
          focused !== "emails" && <div style={errorText}>{errors.emails}</div>}

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

        {/* ACTIONS */}
        <div style={actions}>
          <AwsButton label="Cancel" onClick={onClose} />
          <AwsButton
            label={loading ? "Inviting…" : "Invite Users"}
            disabled={loading}
            onClick={handleInvite}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000,
};

const modal = {
  width: 480,
  padding: "28px 32px",
  borderRadius: 16,
  background: "#fff",
  border: "1px solid #E5E7EB",
  boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
};

const title = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 18,
};

const label = {
  fontSize: 14,
  fontWeight: 600,
  color: "#334155",
  marginBottom: 6,
};

const requiredStar = {
  color: "#DC2626",
  marginLeft: 4,
};

const chip = (email) => ({
  display: "flex",
  alignItems: "center",
  padding: "4px 10px",
  background: isValidEmail(email) ? "#E0E7FF" : "#FEE2E2",
  color: isValidEmail(email) ? "#3730A3" : "#B91C1C",
  borderRadius: 20,
  fontSize: 13,
});

const chipClose = {
  marginLeft: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const chipInput = {
  border: "none",
  outline: "none",
  background: "transparent",
  flex: 1,
  minWidth: 140,
  fontSize: 14,
};

const errorText = {
  color: "#DC2626",
  fontSize: 13,
  marginBottom: 12,
};

const actions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
};
