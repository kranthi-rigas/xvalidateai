import React, { useEffect, useState } from "react";
import AwsButton from "@/components/common/AwsButton";
import {
  updateFindingStatus,
  getObservationArtifact,
} from "@/apiIntegration/verification";

export const SEVERITY_STYLE = {
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-sky-50 text-sky-700 border-sky-200",
  INFO: "bg-gray-50 text-gray-600 border-gray-200",
};

// Confidence sits beside severity rather than folded into it. "Observed once"
// and "confirmed on twelve checks" are different claims, and someone deciding
// what to act on needs both.
export const CONFIDENCE_LABEL = {
  OBSERVED_ONCE: "Observed once",
  REPRODUCED: "Reproduced",
  CONFIRMED: "Confirmed",
};

export const formatDate = (iso) => {
  if (!iso) return "--";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "--"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export function SeverityBadge({ severity }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        SEVERITY_STYLE[severity] || SEVERITY_STYLE.INFO
      }`}
    >
      {severity || "INFO"}
    </span>
  );
}

function EvidenceLinks({ observationIds }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  if (!observationIds?.length) {
    return <p className="text-sm text-light-1">No evidence recorded.</p>;
  }

  const open = async (id) => {
    setBusy(id);
    setError("");
    try {
      const data = await getObservationArtifact(id);
      // Presigned and short-lived, so fetched on click rather than rendered as
      // an href that would be expired by the time anyone used it.
      window.open(data.artifact_url, "_blank", "noopener");
    } catch (e) {
      setError(e?.message || "Could not open the evidence artifact.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      {observationIds.map((id) => (
        <div key={id} className="flex items-center gap-2">
          <code className="text-xs text-light-1">{id.slice(0, 8)}…</code>
          <button
            type="button"
            onClick={() => open(id)}
            disabled={busy === id}
            className="text-xs text-blue-600 hover:underline"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {busy === id ? "Opening…" : "Open raw evidence"}
          </button>
        </div>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function StatusTimeline({ history }) {
  if (!history?.length) return null;
  return (
    <div>
      <div className="text-xs font-semibold uppercase text-light-1 mb-2">History</div>
      <ul className="space-y-1">
        {history.map((h, i) => (
          <li key={i} className="text-sm text-dark-1">
            <span className="text-light-1">{formatDate(h.at)}</span> {h.from} →{" "}
            <strong>{h.to}</strong>
            {h.by === "SYSTEM" ? " (automatic)" : ""}
            {h.note ? <span className="text-light-1"> — {h.note}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Detail and triage for one finding.
 *
 * Lives on the assessment report rather than a page of its own - a finding is
 * a statement about a specific tool, and the report is where someone is already
 * looking at that tool.
 */
export default function FindingDetail({ finding, onClose, onChanged }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!finding) return null;

  const apply = async (status) => {
    setSaving(status);
    setError("");
    try {
      await updateFindingStatus(finding.finding_id, status, note.trim());
      await onChanged();
      onClose();
    } catch (e) {
      setError(e?.message || "Could not update this finding.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-16 shadow-4 w-full"
        style={{ maxWidth: 680, maxHeight: "88vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-bottom-light">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={finding.severity} />
              <span className="text-xs text-light-1">
                {CONFIDENCE_LABEL[finding.confidence] || finding.confidence}
                {finding.occurrence_count > 1
                  ? ` · confirmed on ${finding.occurrence_count} checks`
                  : ""}
              </span>
            </div>
            <h3 className="text-lg font-bold text-dark-1">{finding.title}</h3>
            <div className="text-sm text-light-1 mt-1">
              {finding.subject_id} · first seen {formatDate(finding.first_seen_at)} ·
              last seen {formatDate(finding.last_seen_at)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-light-1 hover:text-dark-1"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {finding.detail && (
            <div>
              <div className="text-xs font-semibold uppercase text-light-1 mb-2">
                What was found
              </div>
              <pre
                className="text-sm text-dark-1"
                style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}
              >
                {finding.detail}
              </pre>
            </div>
          )}

          {finding.remediation && (
            <div>
              <div className="text-xs font-semibold uppercase text-light-1 mb-2">
                What to ask the vendor
              </div>
              <p className="text-sm text-dark-1">{finding.remediation}</p>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase text-light-1 mb-2">
              Evidence
            </div>
            <EvidenceLinks observationIds={finding.evidence_observation_ids} />
          </div>

          <StatusTimeline history={finding.status_history} />

          <div className="border-top-light pt-4">
            <div className="text-xs font-semibold uppercase text-light-1 mb-2">
              Triage
            </div>
            <textarea
              className="form-control w-full mb-3"
              rows={2}
              placeholder="Optional note explaining the decision"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
            <div className="flex flex-wrap gap-2">
              <AwsButton
                label={saving === "ACKNOWLEDGED" ? "Saving…" : "Acknowledge"}
                size="sm"
                variant="secondary"
                disabled={!!saving}
                onClick={() => apply("ACKNOWLEDGED")}
              />
              <AwsButton
                label={saving === "RESOLVED" ? "Saving…" : "Resolve"}
                size="sm"
                variant="success"
                disabled={!!saving}
                onClick={() => apply("RESOLVED")}
              />
              <AwsButton
                label={saving === "FALSE_POSITIVE" ? "Saving…" : "False positive"}
                size="sm"
                variant="secondary"
                disabled={!!saving}
                onClick={() => apply("FALSE_POSITIVE")}
              />
              <AwsButton
                label={saving === "DISPUTED" ? "Saving…" : "Vendor disputes"}
                size="sm"
                variant="secondary"
                disabled={!!saving}
                onClick={() => apply("DISPUTED")}
              />
            </div>
            {/* The difference decides whether this returns tomorrow, so it is
                stated rather than left to be discovered. */}
            <p className="text-xs text-light-1 mt-3">
              <strong>Resolve</strong> if the issue was dealt with — it reopens
              automatically if the next check still detects it.{" "}
              <strong>False positive</strong> if the detection itself is wrong —
              it stays closed.
            </p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
