import React, { useEffect, useState } from "react";
import AwsButton from "@/components/common/AwsButton";
import { COLORS } from "@/styles/colors";
import { S, severityClass, severityPill } from "./evidenceStyles";
import {
  updateFindingStatus,
  getObservationArtifact,
} from "@/apiIntegration/verification";

// Kept for callers that still import it. The colour itself now comes from
// severityClass() below, which maps onto badge classes this project actually
// defines - the bg-*/text-* names here are Tailwind, which this project does
// not load, so they rendered every severity identically.
export const SEVERITY_STYLE = {
  CRITICAL: "badge-error",
  HIGH: "badge-error",
  MEDIUM: "badge-warning",
  LOW: "badge-success",
  INFO: "badge-success",
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
    <span className={severityClass(severity)} style={severityPill}>
      {severity || "INFO"}
    </span>
  );
}

function EvidenceLinks({ observationIds }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  if (!observationIds?.length) {
    return (
      <p className="text-light-1" style={{ fontSize: 13, margin: 0 }}>
        No evidence recorded.
      </p>
    );
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {observationIds.map((id) => (
        <div key={id} style={S.evidenceRow}>
          <code className="text-light-1" style={S.evidenceId}>
            {id.slice(0, 8)}…
          </code>
          <button
            type="button"
            onClick={() => open(id)}
            disabled={busy === id}
            style={{
              ...S.linkButton,
              fontSize: 13,
              color: COLORS.info,
              opacity: busy === id ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {busy === id ? "Opening…" : "Open raw evidence →"}
          </button>
        </div>
      ))}
      {error && <p style={S.errorText}>{error}</p>}
    </div>
  );
}

function StatusTimeline({ history }) {
  if (!history?.length) return null;
  return (
    <div style={{ ...S.sectionRuled, ...S.sectionLast }}>
      <div className="text-light-1" style={S.sectionTitle}>
        History
      </div>
      <ul style={{ ...S.list, paddingLeft: 0, listStyle: "none" }}>
        {history.map((h, i) => (
          <li key={i} className="text-dark-1" style={{ fontSize: 13 }}>
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
    <div style={S.overlay} onClick={onClose}>
      <div
        className="bg-white rounded-16 shadow-4"
        style={{ ...S.modal, maxWidth: 680 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={S.header}>
          <div style={S.headerText}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <SeverityBadge severity={finding.severity} />
              <span className="text-light-1" style={{ fontSize: 12 }}>
                {CONFIDENCE_LABEL[finding.confidence] || finding.confidence}
                {finding.occurrence_count > 1
                  ? ` · confirmed on ${finding.occurrence_count} checks`
                  : ""}
              </span>
            </div>
            <h3 className="text-dark-1" style={S.title}>
              {finding.title}
            </h3>
            <div className="text-light-1" style={S.subtitle}>
              {finding.subject_id}
              {finding.occurred_at
                ? ` · occurred ${formatDate(finding.occurred_at)}`
                : ""}
              {" · detected "}
              {formatDate(finding.first_seen_at)}
              {" · last confirmed "}
              {formatDate(finding.last_seen_at)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-light-1"
            style={S.close}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div style={S.body}>
          {finding.detail && (
            <div style={S.sectionRuled}>
              <div className="text-light-1" style={S.sectionTitle}>
                What was found
              </div>
              <pre
                className="text-dark-1"
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  margin: 0,
                  fontSize: 14,
                }}
              >
                {finding.detail}
              </pre>
            </div>
          )}

          {finding.remediation && (
            <div style={S.sectionRuled}>
              <div className="text-light-1" style={S.sectionTitle}>
                What to ask the vendor
              </div>
              <p className="text-dark-1" style={{ fontSize: 14, margin: 0 }}>
                {finding.remediation}
              </p>
            </div>
          )}

          <div
            style={
              finding.status_history?.length
                ? S.sectionRuled
                : { ...S.sectionRuled, ...S.sectionLast }
            }
          >
            <div className="text-light-1" style={S.sectionTitle}>
              Evidence
            </div>
            <EvidenceLinks observationIds={finding.evidence_observation_ids} />
          </div>

          <StatusTimeline history={finding.status_history} />
        </div>

        <div style={S.footer}>
          <div className="text-light-1" style={S.sectionTitle}>
            Triage
          </div>
          <textarea
            style={{ ...S.textarea, marginBottom: 12 }}
            rows={2}
            placeholder="Optional note explaining the decision"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
          <p className="text-light-1" style={{ fontSize: 12, marginTop: 12 }}>
            <strong>Resolve</strong> if the issue was dealt with — it reopens
            automatically if the next check still detects it.{" "}
            <strong>False positive</strong> if the detection itself is wrong —
            it stays closed.
          </p>
          {error && <p style={S.errorText}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
