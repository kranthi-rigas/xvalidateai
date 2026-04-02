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
  if (attachments && attachments.length > 0) {
    const body = new FormData();
    Object.entries(formData).forEach(([key, value]) => body.append(key, value));
    attachments.forEach((file) => body.append("attachments", file));

    const accessToken = localStorage.getItem("access_token");
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    });
    if (!response.ok) throw new Error("Failed to create incident");
    return response.json();
  } else {
    const response = await fetchWithAuth(ENDPOINT, {
      method: "POST",
      body: JSON.stringify(formData),
    });
    if (!response.ok) throw new Error("Failed to create incident");
    return response.json();
  }
}
