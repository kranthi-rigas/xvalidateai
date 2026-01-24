import React, { useState } from "react";
import AwsButton from "../../common/AwsButton";
import CreditInfoNote from "./CreditInfoNote";

export default function ApproveRejectModal({
  title,
  actionLabel,
  onConfirm,
  onClose,
  hasError = false,
  hideCredits = false, // ✅ NEW
  hideComment = false, // ✅ NEW (for cancel request)
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(comment);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div
        style={{
          ...modal,
          ...(hasError ? errorModal : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div style={header}>
          <h3 style={titleStyle}>{title}</h3>
        </div>

        {/* ===== BODY ===== */}
        {!hideComment && (
          <div style={body}>
            <textarea
              placeholder="Add comments (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                ...textarea,
                ...(hasError ? errorTextarea : {}),
              }}
            />
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <div style={footer}>
          <AwsButton label="Cancel" onClick={onClose} disabled={loading} />

          <AwsButton
            label={loading ? "Processing…" : actionLabel}
            onClick={handleSubmit}
            disabled={loading}
          />
        </div>

        {/* 🔴 Credit info BELOW buttons */}
        {!hideCredits && (
          <div style={{ padding: "0 24px 20px 24px" }}>
            <CreditInfoNote />
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(17,24,39,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

/* Modal container */
const modal = {
  width: 520,
  background: "#FFFFFF",
  borderRadius: 16,
  boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  overflow: "hidden",
  transform: "translateY(-40px)",
  border: "1px solid #E5E7EB",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

/* 🔴 Error state */
const errorModal = {
  borderColor: "#DC2626",
  boxShadow: "0 0 0 3px rgba(220,38,38,0.35)",
  animation: "shake 0.35s ease-in-out",
};

/* Header */
const header = {
  padding: "20px 24px",
  borderBottom: "1px solid #E5E7EB",
};

const titleStyle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#111827",
};

/* Body */
const body = {
  padding: "20px 24px",
};

const textarea = {
  width: "100%",
  minHeight: 110,
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #D1D5DB",
  fontFamily: "Amazon Ember, sans-serif",
  fontSize: 14,
  resize: "vertical",
  transition: "border-color 0.2s ease",
};

const errorTextarea = {
  borderColor: "#DC2626",
};

/* Footer */
const footer = {
  padding: "16px 24px",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  borderTop: "1px solid #E5E7EB",
};

/* ================= SHAKE ANIMATION ================= */
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes shake {
      0% { transform: translateX(0) translateY(-40px); }
      25% { transform: translateX(-4px) translateY(-40px); }
      50% { transform: translateX(4px) translateY(-40px); }
      75% { transform: translateX(-2px) translateY(-40px); }
      100% { transform: translateX(0) translateY(-40px); }
    }
  `;
  document.head.appendChild(style);
}
