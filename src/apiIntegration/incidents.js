import { API_BASE_URL, fetchWithAuth } from "./auth";
const ENDPOINT = `${API_BASE_URL}/incidents`;

export async function getIncidents() {
  const res = await fetchWithAuth(ENDPOINT, { method: "GET" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to fetch incidents");
  }
  return res.json();
}

export async function createIncident(formData, attachments) {
  // Step 1: POST JSON with attachment metadata (not the files themselves)
  const attachmentMeta = (attachments || []).map((file) => ({
    filename: file.name,
    content_type: file.type,
  }));

  const response = await fetchWithAuth(ENDPOINT, {
    method: "POST",
    body: JSON.stringify({
      ...formData,
      ...(attachmentMeta.length > 0 ? { attachments: attachmentMeta } : {}),
    }),
  });

  if (!response.ok) throw new Error("Failed to create incident");
  const data = await response.json();

  // Step 2: Upload each file directly to S3 using the presigned upload_url
  if (attachments && attachments.length > 0 && data.attachments?.length > 0) {
    const filesMap = Object.fromEntries(attachments.map((f) => [f.name, f]));

    await Promise.all(
      data.attachments.map(({ filename, upload_url }) => {
        const file = filesMap[filename];
        if (!file || !upload_url) return Promise.resolve();
        // No Authorization header — the URL is pre-signed
        // Send the raw File object, not FormData
        return fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      })
    );
  }

  return data;
}

export async function addAttachmentToIncident(incidentId, file) {
  const accessToken = localStorage.getItem("access_token");

  // Step 1: Get presigned upload URL
  const response = await fetch(`${ENDPOINT}/${incidentId}/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filename: file.name, content_type: file.type }),
  });

  if (!response.ok) throw new Error("Failed to get upload URL");
  const { upload_url } = await response.json();

  // Step 2: Upload directly to S3
  await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
}
