import { API_BASE_URL, fetchWithAuth } from "./auth";

const FINDINGS = `${API_BASE_URL}/findings`;
const OBSERVATIONS = `${API_BASE_URL}/observations`;
const VERIFICATION = `${API_BASE_URL}/verification`;

async function readOrThrow(res, fallback) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || error?.message || fallback);
  }
  return res.json();
}

/** GET /findings - by status, or every finding for one vendor. */
export async function getFindings({ status, subject_type, subject_id, limit } = {}) {
  const params = new URLSearchParams();
  if (subject_type && subject_id) {
    params.append("subject_type", subject_type);
    params.append("subject_id", subject_id);
  } else if (status) {
    params.append("status", status);
  }
  if (limit) params.append("limit", limit);

  const qs = params.toString();
  const res = await fetchWithAuth(qs ? `${FINDINGS}?${qs}` : FINDINGS, {
    method: "GET",
  });
  return readOrThrow(res, "Failed to load findings");
}

/**
 * PATCH /findings/{id} - record a triage decision.
 *
 * RESOLVED reopens automatically if the next check still detects the issue;
 * FALSE_POSITIVE does not. The UI has to make that difference obvious or
 * people pick the wrong one and the finding returns overnight.
 */
export async function updateFindingStatus(findingId, status, note = "") {
  const res = await fetchWithAuth(`${FINDINGS}/${encodeURIComponent(findingId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, note }),
  });
  return readOrThrow(res, "Failed to update finding");
}

/** GET /observations - the evidence trail for a subject. */
export async function getObservations({ subject_type, subject_id, check_type, limit } = {}) {
  const params = new URLSearchParams({ subject_type, subject_id });
  if (check_type) params.append("check_type", check_type);
  if (limit) params.append("limit", limit);

  const res = await fetchWithAuth(`${OBSERVATIONS}?${params.toString()}`, {
    method: "GET",
  });
  return readOrThrow(res, "Failed to load evidence");
}

/** GET /observations/{id}/artifact - short-lived presigned URL for raw evidence. */
export async function getObservationArtifact(observationId) {
  const res = await fetchWithAuth(
    `${OBSERVATIONS}/${encodeURIComponent(observationId)}/artifact`,
    { method: "GET" },
  );
  return readOrThrow(res, "Failed to load evidence artifact");
}

/** POST /verification/incident-check - breach and CVE lookup for one vendor. */
export async function runIncidentCheck({ vendor_name, domain }) {
  const res = await fetchWithAuth(`${VERIFICATION}/incident-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vendor_name, domain }),
  });
  return readOrThrow(res, "Failed to run incident check");
}

/** POST /verification/policy-check - capture policy documents and diff them. */
export async function runPolicyCheck({ homepage, documents, subject_id }) {
  const res = await fetchWithAuth(`${VERIFICATION}/policy-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homepage, documents, subject_id }),
  });
  return readOrThrow(res, "Failed to run policy check");
}
