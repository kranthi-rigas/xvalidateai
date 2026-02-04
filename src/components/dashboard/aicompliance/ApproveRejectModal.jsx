import React, { useState, useRef } from "react";
import AwsButton from "../../common/AwsButton";
import ReusableModal from "../../common/Reusablemodal";
import FormField from "../../common/FormField";

export default function ApproveRejectModal({
  title,
  actionLabel,
  onConfirm,
  onClose,
  hasError = false,
}) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const commentRef = useRef(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm(comment); // parent handles success / error
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setComment(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
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
        label={loading ? "Processing…" : actionLabel}
        variant="primary"
        onClick={handleSubmit}
        disabled={loading}
        loading={loading}
      />
    </>
  );

  return (
    <ReusableModal
      isOpen={true}
      onClose={onClose}
      title={title}
      footer={footer}
      size="md"
      error={hasError}
      closeOnOverlayClick={!loading}
    >
      <FormField
        label="Comments"
        name="comment"
        value={comment}
        onChange={handleChange}
        onBlur={handleBlur}
        touched={touched}
        placeholder="Add comments (optional)..."
        type="textarea"
        rows={4}
        fieldRef={commentRef}
        helperText="Optional: Add any additional notes or context"
      />
    </ReusableModal>
  );
}
