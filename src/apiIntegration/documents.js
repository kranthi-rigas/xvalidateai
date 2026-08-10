import { API_BASE_URL, fetchWithAuth } from "./auth";

const ENDPOINT = `${API_BASE_URL}/documents`;

async function unwrap(res, fallbackMessage) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error || error?.message || fallbackMessage);
  }
  return res.json();
}

/** GET /documents - the caller's own documents, newest first. */
export async function listDocuments({ limit } = {}) {
  const url = limit ? `${ENDPOINT}?limit=${limit}` : ENDPOINT;
  const res = await fetchWithAuth(url, { method: "GET" });
  return unwrap(res, "Failed to load documents");
}

/** POST /documents - register metadata and get a presigned upload URL. */
export async function registerDocument({ filename, content_type }) {
  const res = await fetchWithAuth(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, content_type }),
  });
  return unwrap(res, "Failed to register document");
}

/** GET /documents/{id}/url - short-lived presigned download URL. */
export async function getDocumentUrl(documentId) {
  const res = await fetchWithAuth(
    `${ENDPOINT}/${encodeURIComponent(documentId)}/url`,
    { method: "GET" },
  );
  return unwrap(res, "Failed to get document URL");
}

/**
 * Register the document, then PUT the file straight to S3 with the presigned
 * URL. The bytes never pass through the API, which is why this is two steps.
 */
export async function uploadDocument(file) {
  const contentType = file.type || "application/octet-stream";

  const { document, upload_url } = await registerDocument({
    filename: file.name,
    content_type: contentType,
  });

  const putRes = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!putRes.ok) {
    // The metadata row already exists and stays "pending", which is how a
    // failed upload stays visible rather than disappearing silently.
    throw new Error("The file could not be uploaded to storage.");
  }

  return document;
}
