import React, { useState, useRef } from "react";
import AwsButton from "../../common/AwsButton";
import ReusableModal from "../../common/Reusablemodal";
import FormField from "../../common/FormField";
import useToast from "../../../hooks/useToast";
import { reviewOrganization } from "../../../apiIntegration/organization";
import { COLORS } from "../../../styles/colors";

const REQUIRES_COMMENT = ["SUSPEND", "REJECT", "DELETE"];

export default function ReviewOrganizationModal({
  organization,
  action,
  onClose,
  onSuccess,
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modalError, setModalError] = useState(false);
  const show = useToast();
  const commentRef = useRef(null);

  const requiresComment = REQUIRES_COMMENT.includes(action);

  /* ---------- VALIDATION ---------- */
  const getError = () => {
    if (requiresComment && !comment.trim()) {
      return "Comment is required for this action.";
    }
    return "";
  };

  const error = submitted || touched ? getError() : "";

  /* ---------- HANDLERS ---------- */
  const handleChange = (e) => {
    setComment(e.target.value);
    setSubmitted(false);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    const validationError = getError();
    if (validationError) {
      if (commentRef?.current) {
        commentRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    try {
      setLoading(true);

      await reviewOrganization(organization.org_id, {
        action,
        comment,
      });

      show(`Organization ${action.toLowerCase()} successfully!`, {
        type: "success",
      });

      onSuccess();
    } catch (err) {
      console.error("Review organization error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Action failed. Please try again.";

      // 🔔 Toast
      show(message, { type: "error", duration: 5000 });

      // 🔴 Modal error state
      setModalError(true);
      setTimeout(() => setModalError(false), 5000);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FOOTER ---------- */
  const footer = (
    <>
      <AwsButton
        label="Cancel"
        variant="secondary"
        disabled={loading}
        onClick={onClose}
      />
      <AwsButton
        label={loading ? "Processing..." : action}
        variant={action === "DELETE" ? "danger" : "primary"}
        disabled={loading}
        loading={loading}
        onClick={handleSubmit}
      />
    </>
  );

  /* ---------- ACTION LABEL ---------- */
  const getActionLabel = () => {
    switch (action) {
      case "APPROVE":
        return "Approve";
      case "REJECT":
        return "Reject";
      case "SUSPEND":
        return "Suspend";
      case "DELETE":
        return "Delete";
      default:
        return action;
    }
  };

  return (
    <ReusableModal
      isOpen={true}
      onClose={onClose}
      title={`${getActionLabel()} Organization`}
      footer={footer}
      size="md"
      error={modalError}
      closeOnOverlayClick={!loading}
    >
      {/* Organization Name */}
      <div
        style={{
          padding: "12px 14px",
          background: COLORS.surfaceLight || "#F9FAFB",
          borderRadius: "10px",
          marginBottom: "20px",
          border: `1px solid ${COLORS.borderLight || "#E5E7EB"}`,
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: COLORS.textSecondary || "#6B7280",
            marginBottom: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Organization
        </div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: COLORS.textPrimary || "#111827",
          }}
        >
          {organization?.name || "N/A"}
        </div>
      </div>

      {/* Comment Field */}
      <FormField
        label="Review Comment"
        name="comment"
        value={comment}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        touched={touched || submitted}
        required={requiresComment}
        placeholder="Explain the reason for this action clearly…"
        type="textarea"
        rows={4}
        fieldRef={commentRef}
        helperText={
          requiresComment
            ? "Required: Provide a clear explanation for this action"
            : "Optional: Add any additional notes"
        }
      />

      {/* Warning for destructive actions */}
      {(action === "DELETE" || action === "SUSPEND" || action === "REJECT") && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 14px",
            background: "#FEF3C7",
            color: "#92400E",
            borderRadius: "10px",
            border: "1px solid #FDE68A",
            marginTop: "16px",
            fontSize: "13px",
          }}
        >
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
          <span>
            {action === "DELETE"
              ? "This action cannot be undone. The organization will be permanently deleted."
              : action === "SUSPEND"
                ? "This will temporarily suspend the organization's access."
                : "This will reject the organization request."}
          </span>
        </div>
      )}
    </ReusableModal>
  );
}
