import React, { useState } from "react";
import AwsButton from "../../common/AwsButton";

export default function ApproveRejectModal({
  title,
  actionLabel,
  onConfirm,
  onClose,
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(comment); // comment optional ✅
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div style={header}>
          <h3 style={titleStyle}>{title}</h3>
        </div>

        {/* ===== BODY ===== */}
        <div style={body}>
          <textarea
            placeholder="Add comments (optional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)} // ✅ FIXED
            style={textarea}
          />
        </div>

        {/* ===== FOOTER ===== */}
        <div style={footer}>
          <AwsButton label="Cancel" onClick={onClose} disabled={loading} />

          <AwsButton
            label={loading ? "Processing…" : actionLabel}
            onClick={handleSubmit}
            disabled={loading} // ✅ comment no longer required
          />
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

/* Centered overlay (slightly upward like MNC modals) */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(17,24,39,0.55)",
  display: "flex",
  alignItems: "center", // ✅ CENTER
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
  transform: "translateY(-40px)", // ✅ subtle upward lift
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
};

/* Footer */
const footer = {
  padding: "16px 24px",
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  borderTop: "1px solid #E5E7EB",
};
