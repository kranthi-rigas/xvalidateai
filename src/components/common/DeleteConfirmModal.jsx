import React, { useState } from "react";
import AwsButton from "./AwsButton";
import ReusableModal from "./Reusablemodal";
import useToast from "../../hooks/useToast";
import { COLORS } from "../../styles/colors";

export default function DeleteConfirmModal({
  onClose,
  onConfirm,
  error,
  title = "Delete Item",
  message = "Are you sure you want to delete the selected item(s)?",
  successMessage = "Item deleted successfully!",
}) {
  const [deleting, setDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const show = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onConfirm();

      // Show success toast
      show(successMessage, { type: "success" });

      // Close modal after successful deletion
      onClose();
    } catch (err) {
      console.error("Delete error:", err);

      // Show error toast
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete. Please try again.";
      show(errorMsg, { type: "error", duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- FOOTER ---------- */
  const footer = (
    <>
      <AwsButton
        label="Cancel"
        variant="secondary"
        onClick={onClose}
        disabled={deleting}
      />
      <AwsButton
        label={deleting ? "Deleting…" : "Delete"}
        variant="danger"
        onClick={handleDelete}
        disabled={deleting}
      />
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
      error={!!error}
      closeOnOverlayClick={!deleting}
      showCloseButton={false}
    >
      {/* Message */}
      <p style={messageStyle}>{message}</p>

      {/* Error Box (if provided by parent) */}
      {error && (
        <div style={errorBoxStyle}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M7 0C3.13438 0 0 3.13438 0 7C0 10.8656 3.13438 14 7 14C10.8656 14 14 10.8656 14 7C14 3.13438 10.8656 0 7 0ZM7 10.5C6.65625 10.5 6.375 10.2188 6.375 9.875V7C6.375 6.65625 6.65625 6.375 7 6.375C7.34375 6.375 7.625 6.65625 7.625 7V9.875C7.625 10.2188 7.34375 10.5 7 10.5ZM7 5.25C6.65625 5.25 6.375 4.96875 6.375 4.625V4.125C6.375 3.78125 6.65625 3.5 7 3.5C7.34375 3.5 7.625 3.78125 7.625 4.125V4.625C7.625 4.96875 7.34375 5.25 7 5.25Z"
              fill="#B91C1C"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Warning Notice */}
      <div style={warningBoxStyle}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ fontSize: "13px", lineHeight: 1.5 }}>
          This action cannot be undone.
        </span>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        button:focus-visible {
          outline: 2px solid ${COLORS.borderFocus || "#2563EB"};
          outline-offset: 2px;
        }
      `}</style>
    </ReusableModal>
  );
}

/* ================= STYLES ================= */

const messageStyle = {
  fontSize: "15px",
  lineHeight: 1.6,
  color: COLORS.textSecondary,
  margin: 0,
  marginBottom: "16px",
};

const errorBoxStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  padding: "12px 14px",
  background: "#FEE2E2",
  color: "#B91C1C",
  borderRadius: "10px",
  fontSize: "14px",
  lineHeight: 1.5,
  border: "1px solid #FCA5A5",
  marginBottom: "16px",
};

const warningBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "12px 14px",
  background: "#FEF3C7",
  color: "#92400E",
  borderRadius: "10px",
  border: "1px solid #FDE68A",
  marginTop: "4px",
};

const deleteButtonStyle = {
  padding: "9px 20px",
  borderRadius: "999px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.15s ease",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  border: "none",
  outline: "none",
  background: "#EF4444", // Normal red
  color: "#FFFFFF",
};

const deleteButtonHoverStyle = {
  background: "#DC2626", // Darker red on hover
};

const deleteButtonDisabledStyle = {
  opacity: 0.6,
  cursor: "not-allowed",
};
