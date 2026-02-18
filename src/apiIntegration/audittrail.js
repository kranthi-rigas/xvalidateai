import { API_BASE_URL, fetchWithAuth } from "./auth";
const ENDPOINT = `${API_BASE_URL}/audit`;

export async function getAuditTrail(filters = {}) {
  const {
    user_id,
    resource_type,
    org_id,
    start_time,
    end_time,
    limit = 100,
    days = 30,
  } = filters;

  const params = new URLSearchParams();

  if (user_id) params.append("user_id", user_id);
  if (resource_type) params.append("resource_type", resource_type);
  if (org_id) params.append("org_id", org_id);
  if (start_time) params.append("start_time", start_time);
  if (end_time) params.append("end_time", end_time);
  if (limit) params.append("limit", limit);
  if (days) params.append("days", days);

  const queryString = params.toString();
  const url = queryString ? `${ENDPOINT}?${queryString}` : ENDPOINT;

  const res = await fetchWithAuth(url, {
    method: "GET",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.message || "Failed to fetch audit trail");
  }

  return res.json();
}