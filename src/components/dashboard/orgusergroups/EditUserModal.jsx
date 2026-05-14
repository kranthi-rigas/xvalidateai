import React, { useState, useRef, useEffect } from "react";
import SingleSelectDropdown from "../../common/SingleSelectDropdown";
import AwsButton from "../../common/AwsButton";
import ReusableModal from "../../common/Reusablemodal";
import useToast from "../../../hooks/useToast";
import { COLORS } from "../../../styles/colors";
import {
  getUserAttributes,
  updateUser,
} from "../../../apiIntegration/organization";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function EditUserModal({ user, onClose, onSave }) {
  const isInvited = (user?.status || "").toLowerCase() === "invited";

  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");

  const [roles, setRoles] = useState([]);
  const [roleSelected, setRoleSelected] = useState(
    (user?.roles?.[0] || "").toUpperCase(),
  );
  const [roleError, setRoleError] = useState("");

  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState(false);
  const rolesRef = useRef(null);
  const show = useToast();

  // Load available roles
  useEffect(() => {
    async function loadAttributes() {
      try {
        const res = await getUserAttributes();
        setRoles(res.roles || []);
      } catch (err) {
        console.error("Failed to load roles:", err);
        show("Failed to load roles", { type: "error" });
      }
    }
    loadAttributes();
  }, []);

  const validate = () => {
    let valid = true;

    if (isInvited) {
      if (!email.trim()) {
        setEmailError("Email is required.");
        valid = false;
      } else if (!isValidEmail(email.trim())) {
        setEmailError("Enter a valid email address.");
        valid = false;
      } else {
        setEmailError("");
      }
    }

    if (!roleSelected) {
      setRoleError("Please select a role.");
      valid = false;
    } else {
      setRoleError("");
    }

    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await updateUser(user.user_id, {
        email: isInvited ? email.trim() : user.email,
        roles: [roleSelected],
      });
      show("User updated successfully", { type: "success" });
      onSave?.(); // notify parent to refresh list
      onClose();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update user.";
      show(message, { type: "error", duration: 5000 });
      setModalError(true);
      setTimeout(() => setModalError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <AwsButton
        label="Cancel"
        variant="secondary"
        onClick={onClose}
        disabled={loading}
      />
      <AwsButton
        label={loading ? "Saving…" : "Save Changes"}
        variant="primary"
        disabled={loading}
        loading={loading}
        onClick={handleSave}
      />
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={onClose}
      title="Edit User"
      footer={footer}
      size="md"
      error={modalError}
      closeOnOverlayClick={!loading}
    >
      {/* Status badge */}
      <div style={{ marginBottom: 20 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: isInvited ? "#EFF6FF" : "#F0FDF4",
            color: isInvited ? "#1D4ED8" : "#16A34A",
            border: `1px solid ${isInvited ? "#BFDBFE" : "#86EFAC"}`,
          }}
        >
          <i
            className={
              isInvited ? "fa-solid fa-envelope" : "fa-solid fa-circle-check"
            }
            style={{ fontSize: 11 }}
          />
          {isInvited ? "Invited" : "Active"}
        </span>
      </div>

      {/* Email — editable only for Invited users */}
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontWeight: 600,
            fontSize: 14,
            color: COLORS.textPrimary || "#0F172A",
            marginBottom: 6,
          }}
        >
          Email{" "}
          {isInvited && (
            <span style={{ color: COLORS.error, marginLeft: 2 }}>*</span>
          )}
        </label>

        {isInvited ? (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="Enter email address"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: emailError
                  ? `2px solid ${COLORS.error || "#DC2626"}`
                  : `1px solid ${COLORS.borderLight || "#D1D5DB"}`,
                fontSize: 14,
                background: COLORS.surfaceLight || "#F9FAFB",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {emailError && (
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
                <i className="fa-solid fa-circle-exclamation" />
                {emailError}
              </p>
            )}
          </>
        ) : (
          // Active users — email is read-only
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid ${COLORS.borderLight || "#D1D5DB"}`,
              fontSize: 14,
              background: "#F1F5F9",
              color: "#64748B",
              cursor: "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <i
              className="fa-solid fa-lock"
              style={{ fontSize: 12, color: "#94A3B8" }}
            />
            {user?.email}
          </div>
        )}
      </div>

      {/* Role — editable for both Invited and Active */}
      <SingleSelectDropdown
        ref={rolesRef}
        label="Role"
        required
        options={roles.map((r) => ({ label: r, value: r }))}
        selected={roleSelected}
        onChange={(val) => {
          setRoleSelected(val);
          setRoleError("");
        }}
        error={roleError}
      />

      {/* Info note */}
      <p
        style={{
          fontSize: 12,
          color: "#64748B",
          marginTop: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <i
          className="fa-solid fa-circle-info"
          style={{ fontSize: 12, marginTop: 1, flexShrink: 0 }}
        />
        {isInvited
          ? "You can update the email and role for invited users."
          : "Only role can be changed for active users."}
      </p>
    </ReusableModal>
  );
}
