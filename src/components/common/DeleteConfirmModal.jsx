import React from "react";

export default function DeleteConfirmModal({
  onClose,
  onConfirm,
  error,
  title = "Delete Item",
  message = "Are you sure you want to delete the selected item(s)?"
}) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Dynamic Title */}
        <h2 style={titleStyle}>{title}</h2>

        {/* Dynamic Description */}
        <p style={msg}>{message}</p>

        {/* Error Box */}
        {error && <div style={errorBox}>{error}</div>}

        <div style={btnRow}>
          <button style={cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button style={deleteBtn} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

const errorBox = {
  marginTop: 12,
  padding: "10px",
  background: "#FEE2E2",
  color: "#B91C1C",
  borderRadius: 8,
  fontSize: 14,
  border: "1px solid #FCA5A5",
};

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modal = {
  width: 420,
  background: "#fff",
  padding: "28px 30px",
  borderRadius: 16,
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};

const titleStyle = {
  margin: 0,
  fontSize: 22,
  fontWeight: 700,
  color: "#1F2937",
};

const msg = {
  marginTop: 12,
  fontSize: 15,
  color: "#374151",
};

const btnRow = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 26,
};

const cancelBtn = {
  padding: "9px 20px",
  borderRadius: 999,
  border: "1px solid #D1D5DB",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
};

const deleteBtn = {
  padding: "9px 20px",
  borderRadius: 999,
  border: "none",
  background: "#EF4444",
  color: "white",
  fontSize: 14,
  cursor: "pointer",
};
