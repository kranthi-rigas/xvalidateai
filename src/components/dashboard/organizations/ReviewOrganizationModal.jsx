import { useState } from "react";
import AwsButton from "../../common/AwsButton";
import { reviewOrganization } from "../../../apiIntegration/organization";

const REQUIRES_COMMENT = ["SUSPEND", "REJECT", "DELETE"];

export default function ReviewOrganizationModal({
  organization,
  action,
  onClose,
  onSuccess,
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requiresComment = REQUIRES_COMMENT.includes(action);

  const handleSubmit = async () => {
    if (requiresComment && !comment.trim()) {
      setError("Comment is required for this action.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await reviewOrganization(organization.org_id, {
        action,
        comment,
      });

      onSuccess();
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ---------- OVERLAY ---------- */
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      {/* ---------- MODAL CARD ---------- */}
      <div
        style={{
          width: 520,
          background: "white",
          borderRadius: 16,
          padding: "28px 32px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 12px 40px rgba(15,23,42,0.12)",
        }}
      >
        {/* TITLE */}
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
          Review Organization
        </h2>

        {/* ORG NAME */}
        <div style={{ fontWeight: 600, color: "#374151", marginBottom: 16 }}>
          {organization?.name}
        </div>

        {/* ERROR */}
        {error && (
          <div
            style={{
              background: "#FEE2E2",
              color: "#991B1B",
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 14,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* COMMENT */}
        <label style={{ fontSize: 14, fontWeight: 600 }}>
          Review Comment
          {requiresComment && <span style={{ color: "#DC2626" }}> *</span>}
        </label>

        <textarea
          value={comment}
          onChange={(e) => {
            const value = e.target.value;
            setComment(value);

            // ✅ clear error immediately once valid input exists
            if (requiresComment && value.trim()) {
              setError("");
            }
          }}
          placeholder="Explain the reason for this action clearly…"
          style={{
            width: "100%",
            minHeight: 120,
            marginTop: 6,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid #D1D5DB",
            background: "#F9FAFB",
            resize: "vertical",
          }}
        />

        {/* ---------- AWS BUTTONS ---------- */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 24,
          }}
        >
          {/* ✅ AWS Cancel Button */}
          <AwsButton
            label="Cancel"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          />

          {/* ✅ AWS Primary / Danger Button */}
          <AwsButton
            label={action}
            danger={action === "DELETE"}
            disabled={loading}
            onClick={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
